import beneficiaryRequestModel from "../models/beneficiaryRequestModel.js";
import ReportModel from "../../admin/models/reportingModel.js";
import { sendEmail } from "../../../services/emailService.js";
import beneficiaryModel from "../models/beneficiaryModel.js";

// Create a new report
export const reportToAdmin = async (req, res) => {
  try {
    const { requestId, message } = req.body;
    const beneficiaryId = req.userId;
    console.log(beneficiaryId);

    // Validate the request
    if (!beneficiaryId || !requestId || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Verify the BeneficiaryRequest exists
    const request = await beneficiaryRequestModel.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Requested product not found" });
    }

    // Create and save the report
    const newReport = new ReportModel({
      beneficiaryId,
      requestId,
      message,
    });

    await newReport.save();
     
    //getting beneficeary
    const getBeneficeary = await beneficiaryModel.findById(beneficiaryId)
    //sending email
    await sendEmail(getBeneficeary.email,"report",{reportId:newReport._id})

    res.status(200).json({
      success: true,
      message: "Report submitted successfully",
      report: newReport,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Read all reports
export const getAllReports = async (req, res) => {
  try {
    const reports = await ReportModel.find()
      .populate("beneficiaryId")
      .populate({
        path: "requestId",
        populate:"beneficiaryId"
      }).sort({createdAt:-1});

    res.status(200).json({success:true,reports,message:"getting reports successfull"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a report
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const updatedReport = await ReportModel.findByIdAndUpdate(
      id,
      { message },
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({ success: true, report: updatedReport });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a report
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedReport = await ReportModel.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
