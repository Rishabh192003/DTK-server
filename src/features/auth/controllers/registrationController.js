import bcrypt from "bcrypt";
import Beneficiary from "../../beneficiary/models/beneficiaryModel.js";
import Donor from "../../donor/models/donorModel.js";
import Admin from "../../admin/models/adminModel.js";
import Partner from "../../partner/models/partnerModel.js";
import { validateRegistration } from "../validations/authValidation.js";
import { sendEmail } from "../../../services/emailService.js";
import { generateOTP, verifyOTP } from "../services/otpService.js";

const sections = {
  beneficiary: Beneficiary,
  donor: Donor,
  admin: Admin,
  partner: Partner,
};

// Request OTP before registration
export const requestOtpBeforSignup = async (req, res) => {
  const { email, section } = req.body;

  try {
    // Validate section
    const SectionModel = sections[section];
    if (!SectionModel) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    // Find user by email
    const user = await SectionModel.findOne({ email });
    if (user) {
      return res.status(404).json({
        success: false,
        message: `Email already registered in the ${section} section, kindly sign-in!`,
      });
    }

    // Generate OTP
    const otp = await generateOTP(email);

    // Send OTP via email
    await sendEmail(email, "register", { otp });

    return res
      .status(200)
      .json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error requesting OTP" });
  }
};

export const registerUser = async (req, res, next) => {
  const { section, otp, data } = req.body;

  try {
    // Check if the section is valid
    const SectionModel = sections[section];
    if (!SectionModel) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    // Validate input
    const { error } = validateRegistration(section, data);
    if (error) {
      await verifyOTP(data.email, otp);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // Verify OTP
    const isOtpValid = await verifyOTP(data.email, otp);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Check if email already exists in the section
    // const existingUser = await SectionModel.findOne({ email: data.email });
    // if (existingUser) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Email already registered in the ${section} section, kindly sign-in!`,
    //   });
    // }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Register the user
    const newUser = await SectionModel.create({
      ...data,
      password: hashedPassword,
    });

    await sendEmail(data.email, "greeting", data);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    next(error); // Pass error to centralized error handler
  }
};
