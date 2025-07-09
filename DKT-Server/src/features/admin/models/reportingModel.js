import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
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

  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
