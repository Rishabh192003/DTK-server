import mongoose from "mongoose";

const productUploadsSchema = new mongoose.Schema({
  donerId:{
    type:mongoose.Schema.Types.ObjectId,
      ref:"Donor"
  },
  products:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Product"
  }],
  adminApproval:{
    type: String,
    default: "Pending",
    enum: ["Pending","Approved", "Reject"],
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("productUpload", productUploadsSchema);
