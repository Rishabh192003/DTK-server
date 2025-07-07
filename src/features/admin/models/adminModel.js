import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" }, // Specific to admins
    verify:{
      type: String,
      default: "Approved",
      enum: ["Pending","Approved", "Reject"],
    },
    reports: [
      {
        beneficiaryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Beneficiary",
        },
        requestId: {
          type: mongoose.Schema.Types.ObjectId, 
          ref: "BeneficiaryRequest",
        },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
