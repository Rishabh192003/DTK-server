import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Subscription } from "../models/subscriptionModel.js";
import donorModel from "../models/donorModel.js";
import Invoice from "../../admin/models/Invoice.js";
import requestModel from "../models/requestModel.js";

// Load environment variables
dotenv.config();

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECURITY_KEY,
});

export const checkout = async (req, res) => {
  const { invoice } = req.body;
  const userId = req.userId;

  const options = {
    amount: Number(invoice.invoiceAmount * 100), // amount in the smallest currency unit
    currency: "INR",
  };

  try {
    const order = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: order,
      requestId: invoice.requestId._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error });
  }
};

// Utility function to calculate end date based on the subscription type
const calculateEndDate = (startDate, type) => {
  const startTimestamp = new Date(startDate).getTime();

  if (type === "Monthly") {
    // Number of milliseconds in one month (assuming an average month length of 30.44 days)
    const oneMonthInMilliseconds = 30.44 * 24 * 60 * 60 * 1000;
    const endTimestamp = startTimestamp + oneMonthInMilliseconds;
    return new Date(endTimestamp);
  } else if (type === "Yearly") {
    // Number of milliseconds in one year (using 365.25 days to account for leap years)
    const oneYearInMilliseconds = 365.25 * 24 * 60 * 60 * 1000;
    const endTimestamp = startTimestamp + oneYearInMilliseconds;
    return new Date(endTimestamp);
  }
  // Return null or handle invalid type cases
  return null;
};


export const paymentVarification = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    invoiceId,
  } = req.body;

  try {
    // ✅ Check if the Razorpay security key is set
    if (!process.env.RAZORPAY_SECURITY_KEY) {
      return res
        .status(500)
        .json({ success: false, message: "Razorpay security key not set." });
    }

    // ✅ Generate Expected Signature
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECURITY_KEY)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Payment Verification!" });
    }

    // ✅ Fetch the invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found!" });
    }

    // ✅ Update Invoice Payment Details
    invoice.paymentDetail.status = "Success";
    invoice.paymentDetail.paid = true;
    invoice.paymentDetail.transactionId = razorpay_payment_id;

    // ✅ Fetch the related request
    const request = await requestModel.findById(invoice.requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found!" });
    }

    // ✅ Update Request Payment Details
    request.paymentDetail.status = "Active";
    request.paymentDetail.paid = true;
    request.paymentDetail.transactionId = razorpay_payment_id;

    // ✅ Fetch the donor
    const donor = await donorModel.findById(request.donor);
    if (!donor) {
      return res
        .status(404)
        .json({ success: false, message: "Donor not found!" });
    }

    // ✅ If Invoice is for Subscription, Update Donor Subscription
    if (invoice.subscription) {
      donor.subscription.status = "Active";
      donor.subscription.paid = true;
      donor.subscription.transactionId = razorpay_payment_id;

      // ✅ Correctly Set Subscription Expiry Date (12 Months from Now)
      donor.subscription.expiresAt = new Date();
      donor.subscription.expiresAt.setFullYear(
        donor.subscription.expiresAt.getFullYear() + 1
      );

      // ✅ Update Subscription Start Date
      donor.subscription.startedAt = new Date();
    }

    // ✅ Save Updated Data
    await invoice.save();
    await request.save();
    await donor.save();

    return res.status(201).json({
      success: true,
      message: "Payment Verified & Subscription Updated!",
      data: {
        paymentId: razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
};
