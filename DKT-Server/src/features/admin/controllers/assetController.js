import { sendEmail } from "../../../services/emailService.js";
import beneficiaryRequestModel from "../../beneficiary/models/beneficiaryRequestModel.js";

export const assetAcceptOrReject = async (req,res)=>{
    try {
        const { id, status } = req.body
        // Find the product uploads for the donor and populate the products
        const assetRequest = await beneficiaryRequestModel.findOne({ _id: id }).populate("beneficiaryId")
         console.log(assetRequest)
        if(!assetRequest){
            res.status(404).json({success:false, message: "Request not found" });
        }
        assetRequest.status = status
        await sendEmail(assetRequest.beneficiaryId.email,"assetRequestResponce",{requestId:assetRequest._id,status})
        await assetRequest.save();
        res.status(200).json({ success:true,message: `Asset ${status} successfully!!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}; 