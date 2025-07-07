import axios from "axios";
import { sendEmail } from "../../../services/emailService.js";
import beneficiaryRequestModel from "../../beneficiary/models/beneficiaryRequestModel.js";
import productModel from "../../donor/models/productModel.js";
import assetDelevery from "../../partner/models/assetDelevery.js";
import partnerModel from "../../partner/models/partnerModel.js";
let shipRocketToken = null;
let shipRocketTokenExpiry = null;

// Fetch ShipRocket Token
const fetchShipRocketToken = async () => {
  try {
    // Check if the token exists and is not expired
    if (shipRocketToken && shipRocketTokenExpiry > Date.now()) {
      console.log("Using existing valid ShipRocket token");
      return shipRocketToken;
    }

    console.log("Fetching a new ShipRocket token");
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.status === 200) {
      const { token, expires_in } = response.data;

      shipRocketToken = token;
      shipRocketTokenExpiry = Date.now() + expires_in * 1000; // Convert expires_in seconds to milliseconds

      return shipRocketToken;
    } else {
      throw new Error("Failed to authenticate with ShipRocket");
    }
  } catch (error) {
    console.error("Error fetching ShipRocket token:", error.message);
    throw new Error("ShipRocket authentication failed");
  }
};

/**
 * Parses an address string into its components (address, city, state, pincode).
 * @param {string} address - The full address string.
 * @returns {Object} - An object containing address components.
 */
const parseAddress = (address) => {
  if (!address || typeof address !== "string") {
    return {
      address: "",
      city: "",
      state: "",
      pincode: "",
    };
  }

  const addressParts = address.split(",").map((part) => part.trim());
  const addressLength = addressParts.length;

  return {
    address: addressLength > 3 ? addressParts.slice(0, addressLength - 3).join(", ") : "",
    city: addressLength >= 3 ? addressParts[addressLength - 3] : "",
    state: addressLength >= 2 ? addressParts[addressLength - 2] : "",
    pincode: addressLength >= 1 ? addressParts[addressLength - 1] : "",
  };
};

export const creatAssetDeleveryRequest = async (req, res) => {
  try {
    const { request, assetId, partnerId, partnerAddress } = req.body;
    console.log(request, assetId, partnerId, partnerAddress)

    // Validate input
    if (!request || !assetId || !partnerId || !partnerAddress || !Array.isArray(assetId) || assetId.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    // Check if all assets are unassigned
    const assignedAssets = await productModel.find({
      _id: { $in: assetId },
      "assignedToBeneficiary.beneficiaryId": { $exists: true }, // Find assigned assets
    });

    if (assignedAssets.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Request contains already assigned assets. Assigned assets: ${assignedAssets.map((asset) => asset._id).join(", ")}`,
      });
    }

    // Proceed with the request as all assets are unassigned
    const newRequest = new assetDelevery({
      beneficeryRequestId: request._id,
      assetId,
      partnerId,
      partnerAddress: partnerAddress.address
    });

    if (!newRequest) {
      return res.status(404).json({ success: false, message: "Request not created" });
    }



    const updateBeneficeryRequest = await beneficiaryRequestModel.findOne({ _id: request._id }).populate("beneficiaryId");
    updateBeneficeryRequest.status = "Approved"
    updateBeneficeryRequest.assignedDetails.assetIds = assetId
    updateBeneficeryRequest.assignedDetails.status = "Assigned"
    updateBeneficeryRequest.assignedDetails.date = new Date()

    const partner = await partnerModel.findById(partnerId)

    const addressParts = partnerAddress.address.split(",");

    // Parse billing address
    const billingAddress = parseAddress(partnerAddress.address);
    const {
      address: billing_address,
      city: billing_city,
      state: billing_state,
      pincode: billing_pincode,
    } = billingAddress;

    // Parse shipping address
    const shippingAddress = parseAddress(updateBeneficeryRequest.address.fullAddress);
    const {
      address: shipping_address,
      city: shipping_city,
      state: shipping_state,
      pincode: shipping_pincode,
    } = shippingAddress;

    // all asign products 
    const Products = await productModel.find({
      _id: { $in: assetId }
    }).lean(); // ✅ This retrieves all matching products

    const payload = {
      order_id: updateBeneficeryRequest._id,
      order_date: new Date().toISOString(),
      pickup_location: partnerAddress.shiprocketPickupDetails.pickup_code,
      channel_id: "",
      comment: "Handle with care",
      reseller_name: partner.partnerName,
      company_name: "Digital-K-Tech",
      billing_customer_name: partner.partnerName || "John",
      billing_last_name: "",
      billing_address: billing_address || "Default Address",
      billing_address_2: "",
      billing_isd_code: "+91",
      billing_city: billing_city,
      billing_pincode: billing_pincode,
      billing_state: billing_state,
      billing_country: "India",
      billing_email: partner.email,
      billing_phone: partner.phone,
      billing_alternate_phone: partner.alternatePhone ||partner.phone,
      shipping_is_billing: false, 
      shipping_customer_name: updateBeneficeryRequest.fullName || "",
      shipping_last_name: "",
      shipping_address: shipping_address || "",
      shipping_address_2: "",
      shipping_city: shipping_city || "",
      shipping_pincode: shipping_pincode || "",
      shipping_country: "India",
      shipping_state: shipping_state || "",
      shipping_email: updateBeneficeryRequest.email || "example@example.com",
      shipping_phone: updateBeneficeryRequest.contactNumber,
      order_items: Products.map((product) => ({
        name: product.name,
        sku: product.model || "Default-SKU",
        units: product.quantity || 1,
        selling_price: 0,
        discount: "0",
        tax: "0",
        hsn: "84713010",
      })),
      payment_method: "Prepaid",
      shipping_charges: "0",
      giftwrap_charges: "0",
      transaction_charges: "0",
      total_discount: "0",
      sub_total: 0,
      length: 30,
      breadth: 30,
      height: 30,
      weight: 5,
      ewaybill_no: "EWB123456789",
      customer_gstin: "29ABCDE1234F2Z5",
      invoice_number: "INV987654321",
      order_type: "ESSENTIALS",
    };

    console.log(payload)
    // Fetch ShipRocket token if not available
    const shipRocketToken = await fetchShipRocketToken();
    if (!shipRocketToken) {
      return res.status(401).json({ success: false, message: "Failed to authenticate with ShipRocket" });
    }
    // ✅ Send Request to ShipRocket
    // try {
    const shiprocketResponse = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shipRocketToken}`,
        },
      }
    );
    console.log(shiprocketResponse.status)
    // ✅ Handle Successful Response
    if (shiprocketResponse.status === 200) {
      updateBeneficeryRequest.shippingDetails = shiprocketResponse.data;
      newRequest.shippingDetails = shiprocketResponse.data;

      // Update product statuses to "assigned"
      await productModel.updateMany(
        { _id: { $in: assetId } },
        {
          $set: {
            "assignedToBeneficiary.beneficiaryId": request.beneficiaryId,
            "assignedToBeneficiary.status": "Assigned",
            "assignedToBeneficiary.date": new Date(),
          },
        }
      );

      // Save the new delivery request and update beneficery request
      await newRequest.save();
      await updateBeneficeryRequest.save();
      await sendEmail(updateBeneficeryRequest.beneficiaryId.email, "Asset Allocation", { requestId: updateBeneficeryRequest._id })

      res.status(200).json({
        success: true,
        message: `Request created successfully! All assets have been assigned.`,
      });
    } else {
      // ❌ Handle Unexpected Success Response with Wrong Status Code
      console.error("Unexpected Response:", shiprocketResponse.status, shiprocketResponse.data);
      return res.status(shiprocketResponse.status).json({
        success: false,
        message: "Unexpected ShipRocket response",
        error: shiprocketResponse.data,
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
