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

const partnerSchema = new mongoose.Schema(
  {
    partnerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: false },
    alternatePhone: { type: String },
    role: { type: String, default: "partner" },
    servicesProvided: { type: String },
    gstIn: [gstSchema],
    address: [addressSchema], // Separate field for addresses
    verify: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Reject"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Partner", partnerSchema);
