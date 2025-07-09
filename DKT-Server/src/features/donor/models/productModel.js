import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    companyDetails: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      contactPerson: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
      },
      authorizedPerson: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
      },
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    condition: {
      type: String,
      default: "Unclassified",
      enum: ["Recycle", "Repair", "Unclassified", "Allocation-Ready"],
    },
    repair:{
       isRepair:{type:Boolean,default:false},
       service:[{
        part:{type: String},
        description:{type: String},
        cost:{type:Number}
       }]
    },

    images: [{ type: String }],
    quantity: { type: Number, required: true, min: 1 },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    specification: {
      processor: { type: String, required: true },
      RAM: { type: String, required: true },
      storage: { type: String, required: true },
    },
    ageOfProduct: { type: String },
    orignalPurchaseValue: { type: String }, 
    adminApproval: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Reject"],
    },
    status: {
      type: String,
      default: "Available",
      enum: ["Available", "Requested", "Assigned", "Pickedup", "Delivered"],
    },
    // status: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "ProductTracking",
    // },

    assignedToBeneficiary: {
      beneficiaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Beneficiary",
      },
      status: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Assigned", "In-progress", "Delivered"],
      },
      // status: {
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "ProductTracking",
      // },
      date: { type: Date },
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
