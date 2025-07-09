import beneficiaryModel from "../../beneficiary/models/beneficiaryModel.js";
import donorModel from "../../donor/models/donorModel.js";
import partnerModel from "../../partner/models/partnerModel.js";

export const getAllDonor = async (req, res) => {
  try {
    // Find the donor and populate the `products` field
    const donor = await donorModel.find();

    if (!donor) {
      return res
        .status(404)
        .json({ success: false, message: "Donors not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Donors fetched successfully", donor });
  } catch (error) {
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
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAllPartner = async (req, res) => {
  try {
    // Find the donor and populate the `products` field
    const partner = await partnerModel.find();

    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    res.status(200).json({
      success: true,
      message: "Partner fetched successfully",
      partner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};