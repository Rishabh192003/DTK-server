// import mongoose from "mongoose";

// const assetRequestSchema = new mongoose.Schema(
//   {
//     beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: "Beneficiary" },
//     productName: { type: String, required: true },
//     category: { type: String, required: true },
//     organizationName: { type: String, required: true },
//     address: { type: String, required: true },
//     deviceType: { type: String, required: true },
//     quantity: { type: Number, required: true },
//     status: { type: String, default: "Pending" }, // pending, accepted, rejected
//     adminComments: { type: String },
//     assignedDetails: {
//       assetIds: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Product",
//       }],
//       status: {
//         type: String,
//         default: "Pending",
//         enum: ["Pending", "Assigned", "In-progress", "Delivered"],
//       },
//       date: { type: Date },
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("BeneficiaryRequest", assetRequestSchema);

import mongoose from "mongoose";

const assetRequestSchema = new mongoose.Schema(
  {
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: "Beneficiary", required: true },
    
    // Beneficiary Information
    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true, match: /^[0-9]{10}$/ }, // Validates 10-digit phone number
    email: { type: String },
    organizationName: { type: String, required: true },
    role: { type: String, required: true }, // Example: Student, Teacher, NGO
    
    // Address Details
    address: {
      pickupCode:{type: String, required: true},
      fullAddress:{type: String, required: true},
    },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^[0-9]{6}$/ }, // Validates 6-digit pincode
    alternateContactNumber: { type: String, match: /^[0-9]{10}$/ }, // Optional 10-digit number
    
    // Laptop Specifications
    deviceType: { type: String, required: true, enum: ["Laptop", "Desktop", "Tablet"] },
    operatingSystem: { type: String, enum: ["Windows", "macOS", "Linux", "No Preference"] },
    processor: { type: String },
    ram: { type: String, required: true }, // Example: "8GB", "16GB"
    storage: { type: String, required: true }, // Example: "256GB SSD"
    purpose: { type: String, required: true }, // Justification for laptop request
    
    // Justification & Documents
    reasonForRequest: { type: String, required: true },
  
    // Quantity & Urgency
    quantity: { type: Number, required: true, min: 1 },
    preferredDeliveryDate: { type: Date },
    urgency: { type: String, enum: ["Urgent", "Normal", "Flexible"] },

    // Approval & Status
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected"],
    },
    adminComments: { type: String },
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

    // Assigned Assets
    assignedDetails: {
      assetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      status: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Assigned", "In-progress", "Delivered"],
      },
      date: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model("BeneficiaryRequest", assetRequestSchema);
