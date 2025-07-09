import { sendEmail } from "../../../services/emailService.js";
import beneficiaryRequestModel from "../../beneficiary/models/beneficiaryRequestModel.js";
import assetDelevery from "../models/assetDelevery.js";
import partnerModel from "../models/partnerModel.js";


export const acceptOrRejectAssetDelevery = async (req, res) => {
    try {
        const patner = req.userId
        const { requestId, status } = req.body;
        const Patner = await partnerModel.findById(patner)
        const request = await assetDelevery.findById(requestId)
        if (!request) {
            return res.status(404).json({ success: false, message: "request not found" });
        }
        request.status = status;
        request.partnerId = patner;

        const beneficeryRequest = await beneficiaryRequestModel.findById(request.beneficeryRequestId).populate("beneficiaryId")
        if (!beneficeryRequest) {
            return res.status(404).json({ success: false, message: "BeneficeryRequest not found" });
        }
        beneficeryRequest.assignedDetails.status = "In-progress";
        await beneficeryRequest.save();
        await request.save();

        await sendEmail(beneficeryRequest.beneficiaryId.email, "Allot Asset Delevery", { requestId: beneficeryRequest._id, deleveryPartner: Patner.partnerName })
        return res.status(200).json({ success: true, message: "Request accepted successfully!!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
