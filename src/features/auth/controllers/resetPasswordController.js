import bcrypt from "bcrypt";
import { sendEmail } from "../../../services/emailService.js";
import { generateOTP, verifyOTP } from "../services/otpService.js";
import Beneficiary from "../../beneficiary/models/beneficiaryModel.js";
import Donor from "../../donor/models/donorModel.js";
import Admin from "../../admin/models/adminModel.js";
import Partner from "../../partner/models/partnerModel.js";

const sections = {
  beneficiary: Beneficiary,
  donor: Donor,
  admin: Admin,
  partner: Partner,
};

// Request OTP for reset password
export const requestResetPasswordOtp = async (req, res) => {
  const { email, section } = req.body;

  try {
    const SectionModel = sections[section];
    if (!SectionModel) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    const user = await SectionModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not registered in this section, please signup",
      });
    }

    // Generate OTP
    const otp = await generateOTP(email);

    // Send OTP via email
    await sendEmail(email, "resetPassword", { otp });

    res.status(200).json({
      success: true,
      message: `Password reset OTP sent to ${email}`,
    });
  } catch (error) {
    console.error("Error during OTP request for reset password:", error);
    res
      .status(500)
      .json({ success: false, message: "Error sending password reset OTP" });
  }
};

// verify otp
export const verifyResetPasswordOtp = async (req, res) => {
  const { email, section, otp } = req.body;

  try {
    const SectionModel = sections[section];
    if (!SectionModel) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    const user = await SectionModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not registered in this section",
      });
    }

    // Verify OTP
    const isOtpValid = await verifyOTP(email, otp);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error during OTP verification for reset password:", error);
    res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  const { email, section, newPassword } = req.body;

  try {
    const SectionModel = sections[section];
    if (!SectionModel) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    const user = await SectionModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not registered in this section",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    res
      .status(500)
      .json({ success: false, message: "Error resetting password" });
  }
};
