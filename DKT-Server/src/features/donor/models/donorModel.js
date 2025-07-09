import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  address: { type: String, required: true }, // Single string for the full address
  verified: { type: Boolean, default: false }, // For admin verification
  shiprocketPickupDetails: {
    pickup_code: { type: String },
    company_id: { type: String },
    rto_address_id: { type: String },
    pickup_id: { type: String },
  },
  requestedAt: { type: Date, default: Date.now },
});

const gstSchema = new mongoose.Schema({
  gst_number: { type: String, required: true },
  company_name: { type: String, required: true },
  company_address: { type: String, required: true }, // Single string for GST address
});

const donorSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "donor" },
    donationDetails: { type: String },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // gstIn: [
    //   {
    //     gst_number: { type: String, required: true },
    //     company_name: { type: String, required: true },
    //     company_address: { type: String, required: true },
    //   },
    // ],
    gstIn: [gstSchema],
    address: [addressSchema], // Separate field for addresses
    verify: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Reject"],
    },
    subscription: {
      plan: {
        type: mongoose.Schema.Types.ObjectId, // ✅ Reference PricingPlan
        ref: "PricingPlan",
        required: false, // ✅ Keep it false if a free tier exists
      },
      status: {
        type: String,
        enum: ["Active", "Expired", "Canceled", "Pending"],
        default: "Pending", // ✅ Industry standard to track subscription lifecycle
      },
      paid: {
        type: Boolean,
        default: false,
      },
      expiresAt: {
        type: Date, // ✅ Using Date for proper time calculations
        default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // ✅ Default: Current Date + 10 days
        required: false,
      },

      startedAt: {
        type: Date, // ✅ Useful for tracking when the subscription began
        default: Date.now,
      },
      transactionId: {
        type: String, // ✅ Store payment transaction ID if needed for audit
        required: false,
      },
      paymentMethod: {
        type: String,
        enum: [
          "Credit Card",
          "PayPal",
          "Bank Transfer",
          "UPI",
          "RazorPay",
          "Other",
        ], // ✅ Industry standard to track payment method
        default: "RazorPay",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Donor", donorSchema);
