import { sendEmail } from "../../../services/emailService.js";
import beneficiaryModel from "../models/beneficiaryModel.js";
import beneficiaryRequestModel from "../models/beneficiaryRequestModel.js";

// ✅ Create Asset Request
export const createAssetRequest = async (req, res) => {
  try {
    const {
      fullName,
      contactNumber,
      email,
      organizationName,
      role,
      address,
      city,
      state,
      pincode,
      alternateContactNumber,
      deviceType,
      operatingSystem,
      processor,
      ram,
      storage,
      purpose,
      reasonForRequest,
      quantity,
      preferredDeliveryDate,
      urgency,
    } = req.body;

    console.log("Asset Request Data:", req.body);

    // ✅ 1. Check if All Required Fields are Present
    if (
      !fullName ||
      !contactNumber ||
      !organizationName ||
      !role ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !deviceType ||
      !ram ||
      !storage ||
      !purpose ||
      !reasonForRequest ||
      !quantity
   
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    // ✅ 2. Validate Contact Number (10-digit format)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact number. Must be exactly 10 digits.",
      });
    }

    // ✅ 3. Validate Alternate Contact Number (If provided)
    if (alternateContactNumber && !phoneRegex.test(alternateContactNumber)) {
      return res.status(400).json({
        success: false,
        message: "Alternate contact number must be exactly 10 digits.",
      });
    }

    // ✅ 4. Validate Email (If provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    // ✅ 5. Validate Pincode (6-digit format)
    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode. Must be exactly 6 digits.",
      });
    }

    // ✅ 6. Validate Device Type
    const validDeviceTypes = ["Laptop", "Desktop", "Tablet"];
    if (!validDeviceTypes.includes(deviceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device type. Must be Laptop, Desktop, or Tablet.",
      });
    }

    // ✅ 7. Validate Urgency Level
    const validUrgencyLevels = ["Urgent", "Normal", "Flexible"];
    if (urgency && !validUrgencyLevels.includes(urgency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid urgency level. Must be Urgent, Normal, or Flexible.",
      });
    }

    // ✅ 8. Validate Quantity (Must be 1 or more)
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    
    

    // ✅ 10. Create New Asset Request
    const newRequest = new beneficiaryRequestModel({
      beneficiaryId: req.userId, // Assuming req.userId is set by authentication middleware
      fullName,
      contactNumber,
      email,
      organizationName,
      role,
      address,
      city,
      state,
      pincode,
      alternateContactNumber,
      deviceType,
      operatingSystem,
      processor,
      ram,
      storage,
      purpose,
      reasonForRequest,
      quantity,
      preferredDeliveryDate,
      urgency,
     
    });

    await newRequest.save();

    // ✅ 11. Fetch Beneficiary Data (For Sending Email)
    const getBeneficiary = await beneficiaryModel.findById(req.userId);
    if (!getBeneficiary) {
      return res.status(404).json({
        success: false,
        message: "Beneficiary not found.",
      });
    }

    // ✅ 12. Send Email Notification
    await sendEmail(getBeneficiary.email, "assetRequest", {
      requestId: newRequest._id,
    });

    // ✅ 13. Respond with Success
    res.status(201).json({
      success: true,
      message: "Asset request created successfully.",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error Creating Asset Request:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};


// Get all asset requests for the beneficiary
export const getAssetRequests = async (req, res) => {
  try {
    const requests = await beneficiaryRequestModel
      .find({ beneficiaryId: req.userId })
      .populate("beneficiaryId")
      .sort({ createdAt: -1 }); // Fetch all requests for the logged-in beneficiary

    if (!requests || requests.length === 0) {
      return res.status(404).json({ message: "No asset requests found." });
    }

    res.status(200).json({ requests });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Update request status (for admin usage)
export const updateAssetRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminComments } = req.body;
    console.log(status);

    const request = await beneficiaryRequestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Asset request not found." });
    }
    console.log(request)
    // Update the status and admin comments
    request.status = status || request.status;
    request.adminComments = adminComments || request.adminComments;

    await request.save();
    const benedicearyId = request.beneficiaryId
    const beneficeary = await beneficiaryModel.findById(benedicearyId);
    await sendEmail(beneficeary.email,"assetRequestResponce",{requestId:request._id,status})

    res.status(200).json({
      success: true,
      message: "Request status updated successfully.",
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
