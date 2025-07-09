import mongoose from "mongoose";

const assetsDelevery = new mongoose.Schema(
    {
        beneficeryRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BeneficiaryRequest",
            required: true,
        },
        assetId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }],
        partnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Partner",
        },
        partnerAddress:{
            type: String,
        },
        status: {
            type: String,
            default: "Assigned",
            enum: ["Requested", "Assigned", "In-progress", "Delivered"],
        },
        shippingDetails: {
            order_id: { type: Number }, // ShipRocket order ID
            channel_order_id: { type: String }, // Channel order ID
            shipment_id: { type: Number }, // ShipRocket shipment ID
            status: { type: String }, // Shipping status
            status_code: { type: Number }, // Status code
            onboarding_completed_now: { type: Boolean, default: false }, // Indicates if onboarding was completed now
            awb_code: { type: String }, // Airway Bill code
            courier_company_id: { type: String }, // Courier company ID
            courier_name: { type: String }, // Courier company name
            new_channel: { type: Boolean, default: false }, // Indicates a new channel
            packaging_box_error: { type: String }, // Any error with the packaging box
          },
    },
    { timestamps: true }
);

export default mongoose.model("assetsDelevery", assetsDelevery);
