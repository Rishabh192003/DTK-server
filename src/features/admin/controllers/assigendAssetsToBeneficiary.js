import { sendEmail } from "../../../services/emailService.js";
import productModel from "../../donor/models/productModel.js";
import beneficiaryRequestModel from "../../beneficiary/models/beneficiaryRequestModel.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const assignedAssetsToBeneficiary = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { assetIds, beneficiaryRequestId } = req.body;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid userId format" });
    }

    // Validate input
    if (
      !assetIds ||
      !assetIds.length ||
      !mongoose.Types.ObjectId.isValid(beneficiaryRequestId)
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Check if all products exist and are available
    const products = await productModel.find({
      _id: { $in: assetIds },
      status: "Pickedup",
    });

    if (products.length !== assetIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some products are not available or do not exist",
      });
    }

    // Update the assignedDetails.status in BeneficiaryRequest model
    const updatedRequest = await beneficiaryRequestModel.findByIdAndUpdate(
      beneficiaryRequestId,
      {
        $set: {
          "assignedDetails.status": "Assigned",
          "assignedDetails.date": new Date(),
        },
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Beneficiary request not found" });
    }

    // Update the assignedToBeneficiary.status in Product model
    await productModel.updateMany(
      { _id: { $in: assetIds } },
      {
        $set: {
          "assignedToBeneficiary.status": "Assigned",
          "assignedToBeneficiary.date": new Date(),
          "assignedToBeneficiary.beneficiaryId": updatedRequest.beneficiaryId,
        },
      }
    );

    // Send email notification to the donor
    // const donorEmail = "donor@example.com"; // Replace with the actual donor email
    // await sendEmail(donorEmail, "requestDelivery", {
    //   address: updatedRequest.address,
    //   shippingDate: updatedRequest.assignedDetails.date,
    //   requestId: updatedRequest._id,
    // });

    res.status(201).json({
      message: "Products and beneficiary request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export default assignedAssetsToBeneficiary;
