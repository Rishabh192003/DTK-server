import OTP from "../models/otpModel.js";
import crypto from "crypto";

const OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Generate OTP
export const generateOTP = async (email) => {
  try {
    const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
    const otpInstance = new OTP({ email, otp });
    await otpInstance.save();
   
    return otp;
  } catch (error) {
    console.error("Error generating OTP:", error.message);
    throw new Error("Failed to generate OTP");
  }
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  try {
  

    const validOtp = await OTP.findOne({ email });


    if (!validOtp) {
      
      return false;
    }

    // Check if OTP has expired
    const currentTime = new Date();
    const timeDifference = currentTime - validOtp.createdAt; // Difference in milliseconds

    if (timeDifference > OTP_EXPIRATION_TIME) {
    
      await OTP.deleteOne({ email }); // Delete expired OTP
      return false;
    }

    // Check if OTP matches
    if (validOtp.otp !== otp) {
     
      return false;
    }

    // Delete OTP after successful verification
    await OTP.deleteOne({ email });
   
    return true;
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    throw new Error("Failed to verify OTP");
  }
};
