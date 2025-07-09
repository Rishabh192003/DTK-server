import Beneficiary from "../../beneficiary/models/beneficiaryModel.js";
import Donor from "../../donor/models/donorModel.js";
import Admin from "../../admin/models/adminModel.js";
import Partner from "../../partner/models/partnerModel.js";
import { sendEmail } from "../../../services/emailService.js";

const sections = {
  beneficiary: Beneficiary,
  donor: Donor,
  admin: Admin,
  partner: Partner,
};

export const approveUser = async (req, res) => {
  const { userId, section, status } = req.body;

  try {
    // Validate input
    if (!["Approved", "Reject"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Status must be 'Approved' or 'Reject'.",
      });
    }

    const SectionModel = sections[section];
    if (!SectionModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid section",
      });
    }

    // Find the user by ID in the specified section
    const user = await SectionModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const name = user?.name || user?.companyName || user?.partnerName;
    // Update the user's verification status
    user.verify = status;
    await user.save();

    if (status === "Approved") {
      await sendEmail(user.email, "subjectApproved", { name });
    } else if (status === "Reject") {
      await sendEmail(user.email, "subjectRejected", { name });
    }

    return res.status(200).json({
      success: true,
      message: `User has been ${status.toLowerCase()} successfully.`,
      user,
    });
  } catch (error) {
    console.error("Error approving/rejecting user:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing the request",
    });
  }
};
