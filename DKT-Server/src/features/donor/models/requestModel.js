import mongoose from "mongoose";

// export default mongoose.model("Request", requestSchema);
const requestSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
    },
    address: {
      pickupCode:{type: String, required: true},
      fullAddress:{type: String, required: true},
    }, // Shipping Address
    city: { type: String, required: true }, // Shipping City
    state: { type: String, required: true }, // Shipping State
    country: { type: String, default: "India" }, // Shipping Country
    pincode: { type: String, required: true }, // Postal Code
    phone: { type: String, required: true }, // Donor Phone
    alternatePhone: { type: String }, // Optional Alternate Phone
    shippingDate: { type: String, required: true }, // Shipping Date
    description: { type: String }, // Additional Notes or Description
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    status: {
      type: String,
      default: "Requested",
      enum: ["Requested", "Assigned", "Pickedup", "Delivered"],
    },
    dimensions: {
      length: { type: Number, required: true }, // Package Length
      breadth: { type: Number, required: true }, // Package Breadth
      height: { type: Number, required: true }, // Package Height
      weight: { type: Number, required: true }, // Package Weight
    },
    invoiceGenerated: { type: Boolean, default: false },
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

    paymentDetail: {
      status: {
        type: String,
        enum: ["Active", "Expired", "Canceled", "Pending"],
        default: "Pending",
      },
      paid: {
        type: Boolean,
        default: false,
      },
      transactionId: {
        type: String,
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
        ],
        default: "RazorPay",
      },
      creatdAt: {
        type: String,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Request", requestSchema);
