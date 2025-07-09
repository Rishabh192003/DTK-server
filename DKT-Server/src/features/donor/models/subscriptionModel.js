import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor', // Reference to the User model
    required: true,
  },
  plan: {
    type: String,
    required: true,
  },
  amount: { type: Number, required: true },
  period: {
    type: String,
    enum: ["Monthly", "Yearly"], // Define tiers
    required: true
  },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Active', 'Canceled', 'Expired'],
    default: 'Active',
  },
  paymentDetails: {
    method: { type: String, enum: ['Credit Card', 'PayPal', 'Other'], required: true },
    transactionId: { type: String, required: true },
  },
}, { timestamps: true });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
