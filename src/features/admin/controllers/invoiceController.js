import donorModel from "../../donor/models/donorModel.js";
import requestModel from "../../donor/models/requestModel.js";
import Invoice from "../models/Invoice.js";

// Generate Invoice (Zero-Cost Donation)
export const generateInvoice = async (req, res) => {
  try {
    const { requestId, donorName, donorEmail, laptopDetails, gstNumber } =
      req.body;

    const newInvoice = new Invoice({
      donorName,
      donorEmail,
      laptopDetails: laptopDetails
        .map((p) => `${p.name} (${p.quantity})`)
        .join(", "),
      requestId,
      invoiceType: "zero-value",
      gstNumber,
      invoiceAmount: 0,
      gstApplicable: false,
      itcClaimable: false,
    });

    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Invoices
export const getAllInvoice = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Invoices
export const getInvoiceByrequestId = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Fetch invoices and populate request, subscription, and product details
    const invoices = await Invoice.find({ requestId })
      .populate({
        path: "requestId", // Populate Request details
        populate: {
          path: "products",
          select: "name condition manufacturer model repair",
        },
        select: "products status donor",
      })
      .populate({
        path: "subscription", // Populate PricingPlan details
        select: "planName price duration",
      });

    if (!invoices.length) {
      return res
        .status(404)
        .json({ message: "No invoices found for this request" });
    }

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Repair Invoice

export const addRepaireInvoice = async (req, res) => {
  try {
    const {
      requestId, // Reference to Request
      subscription, // Reference to PricingPlan (if applicable)
      invoiceAmount, // Invoice Amount
      gstNumber, // GST Number
      donorId, // ✅ Donor ID for subscription update
      platformFee,
      logisticsFee,
      transactionFee,
      serviceFee,
    } = req.body;
    // console.log(requestId,
    // subscription,
    // invoiceAmount,
    // gstNumber,
    // donorId,platformFee,
    // logisticsFee,
    // transactionFee,
    // serviceFee)

    // ✅ Validate Required Fields
    if (!requestId || !invoiceAmount || !donorId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Request ID, Invoice Amount, and Donor ID are required.",
        });
    }

    // ✅ Create New Invoice
    const newInvoice = new Invoice({
      requestId,
      subscription: subscription || null, // Attach subscription if provided
      invoiceType: "repair",
      platformFee,
      logisticsFee,
      transactionFee,
      serviceFee,
      gstNumber: gstNumber || "",
      invoiceAmount,
      gstApplicable: !!gstNumber, // ✅ GST applicable only if GST number is provided
      itcClaimable: !!gstNumber, // ✅ ITC Claimable only if GST number is provided
      status: "generated", // Default status
    });

    // ✅ Save Invoice to Database
    await newInvoice.save();

    if (subscription) {
      // ✅ Update Donor's Subscription & Payment Status
      const donor = await donorModel.findById(donorId);
      if (!donor) {
        return res
          .status(404)
          .json({ success: false, message: "Donor not found." });
      }

      donor.subscription = {
        plan: subscription || donor.subscription?.plan, // Keep existing plan if not provided
        paid: false, // ✅ Payment pending
        expiresAt:
          new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) ||
          donor.subscription?.expiresAt, // Keep existing expiry date
      };
      await donor.save();
    }

    const request = await requestModel.findById(requestId);
    if (request) {
      request.invoiceGenerated = true;
    }
    await request.save();

    res.status(201).json({
      success: true,
      message: "Repair Invoice Created & Donor Subscription Updated!",
      data: newInvoice,
    });
  } catch (error) {
    console.error("Error creating repair invoice:", error);
    res.status(500).json({ success: false, message: "Internal Server Error!" });
  }
};

//Generate Allocation doc
export const generateAllocationDoc = async (req, res) => {
  try {
    const { beneficiaryName, laptopDetails } = req.body;

    const doc = {
      beneficiaryName,
      laptopDetails,
      allocationDate: new Date(),
      status: "allocated",
    };

    res.status(200).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Add Disposal Invoice
export const addDisposalDoc = async (req, res) => {
  try {
    const { disposalVendor, invoiceAmount, gstNumber } = req.body;

    const newInvoice = new Invoice({
      donorName: disposalVendor, // Vendor acts as donor in invoice system
      invoiceType: "disposal",
      gstNumber,
      invoiceAmount,
      gstApplicable: invoiceAmount > 0, // GST only if charged
      itcClaimable: false,
    });

    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
