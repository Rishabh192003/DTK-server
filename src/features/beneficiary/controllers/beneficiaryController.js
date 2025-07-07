import jwt from "jsonwebtoken";
import beneficiaryModel from "../models/beneficiaryModel.js";
import beneficiaryRequestModel from "../models/beneficiaryRequestModel.js";

export const getBeneficiaryDetails = async (req, res) => {
  try {
    const beneficiaryId = req.userId; // This is set by the `authenticateToken` middleware

    const beneficiary = await beneficiaryModel.findById(beneficiaryId);

    if (!beneficiary) {
      return res
        .status(404)
        .json({ success: false, message: "beneficiary not found" });
    }

    res.status(200).json({
      success: true,
      message: "beneficiary details fetched successfully",
      beneficiary,
    });
  } catch (error) {
    console.error("Error fetching beneficiary details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllBeneficiary = async (req, res) => {
  try {
    // Find the donor and populate the `products` field
    const beneficiary = await beneficiaryModel.find();

    if (!beneficiary) {
      return res
        .status(404)
        .json({ success: false, message: "Beneficiary not found" });
    }

    res.status(200).json({
      success: true,
      message: "Beneficiary fetched successfully",
      beneficiary,
    });
  } catch (error) {
    console.error("Error fetching beneficiary details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getBeneficiaryById = async (req, res) => {
  try {
    const { beneficiaryId } = req.body;
    // Find the donor and populate the `products` field
    const beneficiary = await beneficiaryModel.findById(beneficiaryId);

    if (!beneficiary) {
      return res
        .status(404)
        .json({ success: false, message: "Beneficiary not found" });
    }

    res.status(200).json({
      success: true,
      message: "Beneficiary fetched successfully",
      beneficiary,
    });
  } catch (error) {
    console.error("Error fetching beneficiary details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAssetRequestsByBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Beneficiary ID is required.",
      });
    }

    // Fetch all asset requests for the given beneficiaryId
    const requests = await beneficiaryRequestModel
      .find({ beneficiaryId: id })
      .populate("beneficiaryId")
      .sort({ createdAt: -1 });

    if (!requests || requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No asset requests found for this beneficiary.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset requests retrieved successfully.",
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const getAssetRequestsByBeneficiaryToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Beneficiary ID is required.",
      });
    }

    // Fetch all asset requests for the given beneficiaryId
    const requests = await beneficiaryRequestModel
      .find({ beneficiaryId: userId })
      .populate("beneficiaryId")
      .sort({ createdAt: -1 });

    if (!requests || requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No asset requests found for this beneficiary.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset requests retrieved successfully.",
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const getAssetRequestsById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Asset ID is required.",
      });
    }

    // Fetch all asset requests for the given beneficiaryId
    const request = await beneficiaryRequestModel
      .find({ _id: id })
      .populate("beneficiaryId") // Populate the beneficiaryId field
      .populate({
        path: "assignedDetails.assetIds", // Path for nested field inside assignedDetails
        model: "Product", // Reference the Product model
      });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No asset requests found for this beneficiary.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset requests retrieved successfully.",
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

export const getAllAssetRequests = async (req, res) => {
  try {
    // Fetch all asset requests
    const requests = await beneficiaryRequestModel
    .find()
    .populate("beneficiaryId") // Populates beneficiary details
    .populate("assignedDetails.assetIds"); // Populates asset details from Product model
    
    if (!requests) {
      return res.status(404).json({
        success: false,
        message: "No asset requests found for this beneficiary.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset requests retrieved successfully.",
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
