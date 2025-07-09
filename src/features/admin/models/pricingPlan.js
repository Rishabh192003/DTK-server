import mongoose from "mongoose";

const PricingPlanSchema = new mongoose.Schema(
  {
    // Category can be one of the predefined pricing categories
    category: {
      type: String,
      required: true,
      enum: [
        "Large Firms (Yearly Contact)",
        "Single Contract",
        "Smaller Firms",
        "Individual",
      ],
    },
    platformFee: {
      type: String,
      required: true,
    },
    perLaptopFee: {
      type: String,
      required: true,
    },
    logistics: {
      type: String,
      required: true,
    },
    // Lumpsum: For "Large Firms" it's "Add Service @ cost" and not applicable for others.
    lumpsum: {
      type: String,
      required: true,
    },
    singleTransactionFee: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      default: "NA",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PricingPlan", PricingPlanSchema);
