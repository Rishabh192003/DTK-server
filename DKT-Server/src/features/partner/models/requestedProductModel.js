import mongoose from "mongoose";

const requestedProductSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },
    productId: { type: mongoose.Schema.Types.ObjectId,ref:"Product", required: true },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
    },
    quantity: { type: Number,default:1 },
    status: {
      type: String,
      default: "Requested",
      enum: ["Requested", "Assigned", "In-progress", "Delivered"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("RequestedProduct", requestedProductSchema);
