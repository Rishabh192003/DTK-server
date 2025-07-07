import jwt from "jsonwebtoken";
import axios from "axios";
import partnerModel from "../models/partnerModel.js";

let shipRocketToken = null;
let shipRocketTokenExpiry = null;

// Fetch ShipRocket Token
const fetchShipRocketToken = async () => {
  try {
    if (shipRocketToken && shipRocketTokenExpiry > Date.now()) {
      // console.log("Using existing valid ShipRocket token");
      return shipRocketToken;
    }

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.status === 200) {
      const { token, expires_in } = response.data;

      shipRocketToken = token;
      shipRocketTokenExpiry = Date.now() + expires_in * 1000;
      return shipRocketToken;
    } else {
      throw new Error("Failed to authenticate with ShipRocket");
    }
  } catch (error) {
    console.error("Error fetching ShipRocket token:", error.message);
    throw new Error("ShipRocket authentication failed");
  }
};

const extractAddressComponents = (address) => {
  try {
    // Split the address into parts by commas
    const parts = address.split(",").map((part) => part.trim());

    if (parts.length < 3) {
      throw new Error(
        "Address does not contain enough components to extract city, state, and pincode."
      );
    }

    // Extract pincode (last part)
    const pincodeMatch = parts[parts.length - 1].match(/\b\d{6}\b/);
    const pincode = pincodeMatch ? pincodeMatch[0] : null;

    // Extract state (second-to-last part)
    const state = parts[parts.length - 2];

    // Extract city (third-to-last part)
    const city = parts[parts.length - 3];

    return { city, state, pincode };
  } catch (error) {
    console.error("Error extracting address components:", error.message);
    return { city: null, state: null, pincode: null };
  }
};

// Add Address as a Pickup Location to Shiprocket
const addAddressToShiprocket = async (partner, address) => {
  try {
    const token = await fetchShipRocketToken();

    const partnerId = String(partner._id);
    const addressId = String(address._id);

    // Generate a shortened pickup location name
    const pickupLocationName = `Pickup-${partnerId.slice(
      5,
      10
    )}-${addressId.slice(5, 10)}`;
    const { city, state, pincode } = extractAddressComponents(address.address);
    // Validate extracted city, state, and pincode
    if (!city || !state || !pincode) {
      throw new Error(
        "Invalid address components: City, State, or Pincode is missing."
      );
    }

    // Validate pin code with Shiprocket
    // const pinCodeValidation = await validatePinCode(pincode);
    // if (!pinCodeValidation || pinCodeValidation.status !== 1) {
    //   throw new Error(`Pin code ${pincode} is not serviceable.`);
    // }

    const payload = {
      pickup_location: pickupLocationName,
      name: partner.partnerName,
      email: partner.email,
      phone: "9876543210",
      address: address.address,
      address_2: "",
      city: city,
      state: state,
      country: "India",
      pin_code: pincode,
    };
    // console.log("Payload sent to Shiprocket:", payload); // Debugging

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/settings/company/addpickup",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    // console.log(response.data.success, "000000");

    // Check if the response indicates success
    if (response.data.success) {
      console.log("Successfully added address to Shiprocket:", response.data);
      return {
        success: true,
        shiprocketPickupId: response.data,
        message: "Address added to Shiprocket successfully",
      };
    } else {
      console.error("Unexpected response from Shiprocket:", response.data);
      throw new Error("Failed to add address to Shiprocket.");
    }
  } catch (error) {
    console.error(
      "Error adding address to Shiprocket:",
      error.response?.data || error.message
    );
    return {
      success: false,
      message:
        error.response?.data?.message || "Could not add address to Shiprocket.",
    };
  }
};

export const addGstDetails = async (req, res) => {
  try {
    // Extract GST details from the request body
    const { gst_number, company_name, company_address } = req.body;

    // Validate the input fields
    if (!gst_number || !company_name || !company_address) {
      return res.status(400).json({
        success: false,
        message:
          "All GST details (gst_number, company_name, company_address) are required",
      });
    }

    // Find the partner by ID
    const partner = await partnerModel.findById(req.userId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    // Check if the GST number already exists in the partner's gstIn array
    const isGstAlreadyPresent = partner.gstIn.some(
      (gst) => gst.gst_number === gst_number
    );

    if (isGstAlreadyPresent) {
      return res.status(400).json({
        success: false,
        message: "GST details already present",
      });
    }

    // Add the GST details to the partner's gstIn array
    partner.gstIn.push({ gst_number, company_name, company_address });
    const address = company_address;
    // Add address to Shiprocket
    const shiprocketResponse = await addAddressToShiprocket(partner, address);

    if (!shiprocketResponse.success) {
      return res.status(500).json({
        success: false,
        message: shiprocketResponse.message,
      });
    }

    const shiprocketPickupDetails = {
      pickup_code: shiprocketResponse.shiprocketPickupId.address.pickup_code,
      company_id: shiprocketResponse.shiprocketPickupId.address.company_id,
      rto_address_id:
        shiprocketResponse.shiprocketPickupId.address.rto_address_id,
      pickup_id: shiprocketResponse.shiprocketPickupId.pickup_id,
    };

    // Add the GST address directly to the address field as a single string with verified: true
    partner.address.push({
      address: company_address,
      verified: true,
      shiprocketPickupDetails,
    });

    await partner.save();

    res.status(200).json({
      success: true,
      message: "GST details and address added successfully",
      gstIn: partner.gstIn, // Return updated GST details
      address: partner.address, // Return updated address list
    });
  } catch (error) {
    console.error("Error adding GST details:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding GST details",
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    // Extract address from the request body
    const { address } = req.body;

    // Validate input fields
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    // Find the partner by ID
    const partner = await partnerModel.findById(req.userId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "partner not found" });
    }

    // Add the address to the address field (unverified by default)
    partner.address.push({
      address,
      verified: false, // Mark as unverified initially
    });

    // Save the updated partner
    await partner.save();

    res.status(200).json({
      success: true,
      message: "Address added successfully, pending verification",
      address: partner.address, // Return updated addresses
    });
  } catch (error) {
    console.error("Error adding address:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the address",
    });
  }
};

export const verifyAddressToPartner = async (req, res) => {
  try {
    const { partnerId, addressId } = req.body;

    // Validate input fields
    if (!partnerId || !addressId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID and Address ID are required.",
      });
    }

    // Find the partner by ID
    const partner = await partnerModel.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found.",
      });
    }

    // Find the address by ID
    const address = partner.address.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    // Add address to Shiprocket
    const shiprocketResponse = await addAddressToShiprocket(partner, address);

    if (!shiprocketResponse.success) {
      return res.status(500).json({
        success: false,
        message: shiprocketResponse.message,
      });
    }

    const shiprocketPickupDetails = {
      pickup_code: shiprocketResponse.shiprocketPickupId.address.pickup_code,
      company_id: shiprocketResponse.shiprocketPickupId.address.company_id,
      rto_address_id:
        shiprocketResponse.shiprocketPickupId.address.rto_address_id,
      pickup_id: shiprocketResponse.shiprocketPickupId.pickup_id,
    };

    // Update the verified status to true
    address.verified = true;
    address.shiprocketPickupDetails = shiprocketPickupDetails;

    // Save the updated partner document
    await partner.save();

    res.status(200).json({
      success: true,
      message: "Address verified and added to Shiprocket successfully.",
      address, // Return the updated address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying the address.",
    });
  }
};
