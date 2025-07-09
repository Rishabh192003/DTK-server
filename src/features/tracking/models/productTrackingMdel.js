import mongoose from "mongoose";

const productTrackingSchema = new mongoose.Schema(
  {
    // productId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Product",
    //   required: true,
    // },
    logs: [
      {
        status: {
          type: String,
          default: "Available",
        },
        checkpoint: { type: String }, // e.g., "Warehouse A", "Checkpoint B"
        latitude: { type: Number }, // GPS latitude
        longitude: { type: Number }, // GPS longitude
        address: { type: String }, // Human-readable address
        timestamp: { type: Date, default: Date.now }, // Time of entry
        // partnerId: {
        //   type: mongoose.Schema.Types.ObjectId,
        //   ref: "Partner",
        // }, // Partner handling this step
        remarks: { type: String }, // Optional comments or remarks
        subStatus: {
          type: String,
        }, // Optional finer-grained status
      },
    ],
    // partnerChain: [
    //   {
    //     partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
    //     role: { type: String, enum: ["Pickup", "Transit", "Delivery"] },
    //     timestamp: { type: Date, default: Date.now },
    //   },
    // ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

export default mongoose.model("ProductTracking", productTrackingSchema);
