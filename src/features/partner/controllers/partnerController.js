import requestModel from "../../donor/models/requestModel.js";
import partnerModel from "../models/partnerModel.js";

export const getPartnerDetails = async (req, res) => {
  try {
    const partnerId = req.userId; // This is set by the `authenticateToken` middleware

    // Find the donor and populate the `products` field
    const partner = await partnerModel.findById(partnerId)

    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found!!" });
    }

    res.status(200).json({
      success: true,
      message: "Partner details fetched successfully",
      partner,
    });
  } catch (error) {
    console.error("Error fetching partner details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllPartner = async (req, res) => {
  try {
    // Find the donor and populate the `products` field
    const partner = await partnerModel.find()

    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.status(200).json({ success: true, message: "Partner fetched successfully", partner });
  } catch (error) {
    console.error("Error fetching Partner details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getPartnerById = async (req, res) => {
  try {
    const { partnerId } = req.body
    // Find the donor and populate the `products` field
    const partner = await partnerModel.findById(partnerId)

    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.status(200).json({ success: true, message: "Partner fetched successfully", partner });
  } catch (error) {
    console.error("Error fetching Partner details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPartnerRequestsById = async (req, res) => {
  try {
    const { PartnerId } = req.body;
    const requestedProducts = await requestModel
      .find({ partner: PartnerId })
      .populate("donor")
      .populate("partner")
      .populate("products").sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: requestedProducts,
      message: "requests found successfully!!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
export const getPartnerRequestsBy_Id = async (req, res) => {
  try {
    const { requestId } = req.body;
    const requestedProducts = await requestModel
      .find({ _id: requestId })
      .populate("donor")
      .populate("partner")
      .populate("products").sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: requestedProducts,
      message: "requests found successfully!!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
}; 