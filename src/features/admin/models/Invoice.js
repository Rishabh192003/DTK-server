import mongoose from "mongoose";
import { type } from "os";

const invoiceSchema = mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "PricingPlan" },
    invoiceType: {
      type: String,
      enum: ["zero-value", "repair", "disposal"],
      required: true,
    },
    platformFee: { type: Number },
    logisticsFee: { type: Number },
    transactionFee: { type: Number },
    serviceFee: { type: Number },
    gstNumber: String,
    invoiceAmount: { type: Number, default: 0 },
    gstApplicable: { type: Boolean, default: false },
    itcClaimable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["generated", "approved", "archived"],
      default: "generated",
    },
    paymentDetail: {
      status: {
        type: String,
        enum: ["Success", "Pending"],
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
      creatdAt: {
        type: String,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
