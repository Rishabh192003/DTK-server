// export const addGstDetails = async (req, res) => {
//   try {
//     // Extract GST details from the request body
//     const { gst_number, company_name, company_address } = req.body;

//     // Validate the input fields
//     if (!gst_number || !company_name || !company_address) {
//       return res.status(400).json({
//         success: false,
//         message: "All GST details (gst_number, company_name, company_address) are required",
//       });
//     }

//     // Find the donor by ID
//     const donor = await Donor.findById(req.userId);
//     if (!donor) {
//       return res.status(404).json({ success: false, message: "Donor not found" });
//     }

//     // Check if the GST number already exists in the donor's gstIn array
//     const isGstAlreadyPresent = donor.gstIn.some(
//       (gst) => gst.gst_number === gst_number
//     );

//     if (isGstAlreadyPresent) {
//       return res.status(400).json({
//         success: false,
//         message: "GST details already present",
//       });
//     }

//     // Add the GST details to the donor's gstIn array
//     donor.gstIn.push({ gst_number, company_name, company_address });
//     await donor.save();

//     res.status(200).json({
//       success: true,
//       message: "GST details added successfully",
//       gstIn: donor.gstIn, // Return updated GST details
//     });
//   } catch (error) {
//     console.error("Error adding GST details:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred while adding GST details",
//     });
//   }
// };

import jwt from "jsonwebtoken";
import Donor from "../models/donorModel.js";
import axios from "axios";

let shipRocketToken = null;
let shipRocketTokenExpiry = null;

// Fetch ShipRocket Token
const fetchShipRocketToken = async () => {
  try {
    if (shipRocketToken && shipRocketTokenExpiry > Date.now()) {
      console.log("Using existing valid ShipRocket token");
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
const addAddressToShiprocket = async (donor, address) => {
  try {
    const token = await fetchShipRocketToken();

    const donorId = String(donor._id);
    const addressId = String(address._id);

    // Generate a shortened pickup location name
    const pickupLocationName = `Pickup-${donorId.slice(
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
      name: donor.companyName,
      email: donor.email,
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

    // Check if the response indicates success
    if (response.data.success) {
      // console.log("Successfully added address to Shiprocket:", response.data);
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

    // Find the donor by ID
    const donor = await Donor.findById(req.userId);
    if (!donor) {
      return res
        .status(404)
        .json({ success: false, message: "Donor not found" });
    }

    // Check if the GST number already exists in the donor's gstIn array
    const isGstAlreadyPresent = donor.gstIn.some(
      (gst) => gst.gst_number === gst_number
    );

    if (isGstAlreadyPresent) {
      return res.status(400).json({
        success: false,
        message: "GST details already present",
      });
    }

    // Add the GST details to the donor's gstIn array
    donor.gstIn.push({ gst_number, company_name, company_address });
    const address = company_address;
    // Add address to Shiprocket
    const shiprocketResponse = await addAddressToShiprocket(donor, address);

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
    donor.address.push({
      address: company_address,
      verified: true,
      shiprocketPickupDetails,
    });

    await donor.save();

    res.status(200).json({
      success: true,
      message: "GST details and address added successfully",
      gstIn: donor.gstIn, // Return updated GST details
      address: donor.address, // Return updated address list
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

    // Find the donor by ID
    const donor = await Donor.findById(req.userId);
    if (!donor) {
      return res
        .status(404)
        .json({ success: false, message: "Donor not found" });
    }

    // Add the address to the address field (unverified by default)
    donor.address.push({
      address,
      verified: false, // Mark as unverified initially
    });

    // Save the updated donor
    await donor.save();

    res.status(200).json({
      success: true,
      message: "Address added successfully, pending verification",
      address: donor.address, // Return updated addresses
    });
  } catch (error) {
    console.error("Error adding address:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the address",
    });
  }
};

export const verifyAddressToDonor = async (req, res) => {
  try {
    const { donorId, addressId } = req.body;

    // Validate input fields
    if (!donorId || !addressId) {
      return res.status(400).json({
        success: false,
        message: "Donor ID and Address ID are required.",
      });
    }

    // Find the donor by ID
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found.",
      });
    }

    // Find the address by ID
    const address = donor.address.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    // Add address to Shiprocket
    const shiprocketResponse = await addAddressToShiprocket(donor, address);

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
    // Store the Shiprocket Pickup Location ID in the database
    address.verified = true;
    address.shiprocketPickupDetails = shiprocketPickupDetails;

    // Save the updated donor document
    await donor.save();

    res.status(200).json({
      success: true,
      message: "Address verified successfully.",
      address, // Return the updated address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying the address.",
    });
  }
};
