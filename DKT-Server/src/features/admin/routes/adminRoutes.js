import express from "express";
import { authenticateToken } from "../../donor/middelwere/authenticateToken.js";
import { getAllReports } from "../../beneficiary/controllers/reportController.js";
import { approveOrRejetUploads } from "../controllers/approveOrRejectUploads.js";
import { approveUser } from "../controllers/approvedOrRejectUser.js";
import assignedAssetsToBeneficiary from "../controllers/assigendAssetsToBeneficiary.js";
import { assetAcceptOrReject } from "../controllers/assetController.js";
import { creatAssetDeleveryRequest } from "../controllers/creatAssetDeleveryRequest.js";
import assignedAssetsToPartner from "../controllers/assignAssetsToPartner.js";
import { verifyAddressToDonor } from "../../donor/controllers/addGstInfo.js";
import { verifyAddressToBeneficiary } from "../../beneficiary/controllers/addGstInfo.js";
import {
  getAllBeneficiary,
  getAllDonor,
  getAllPartner,
} from "../controllers/userController.js";
import { verifyAddressToPartner } from "../../partner/controllers/addGstinfo.js";
import {
  addDisposalDoc,
  addRepaireInvoice,
  generateAllocationDoc,
  generateInvoice,
  getAllInvoice,
  getInvoiceByrequestId,
} from "../controllers/invoiceController.js";
import { createPricingPlan, deletePricingPlan, getPricingPlanById, getPricingPlans, updatePricingPlan } from "../controllers/pricingPlanController.js";


const router = express.Router();

router.get("/reports", authenticateToken, getAllReports);
router.get("/getAllDonor", authenticateToken, getAllDonor);
router.get("/getAllBeneficiary", authenticateToken, getAllBeneficiary);
router.get("/getAllPartner", authenticateToken, getAllPartner);

router.post(
  "/approveOrRejectAssetUploads",
  authenticateToken,
  approveOrRejetUploads
);
router.post("/approveOrRejectUsers", approveUser);
router.post("/assignedAssetsToBeneficiary", assignedAssetsToBeneficiary);

//asset request assign to partner
router.post("/assignAssetToPartner", assignedAssetsToPartner);

//assets request managment
//asset accept or rejet
router.post(
  "/acceptOrRejectAssetRequest",
  authenticateToken,
  assetAcceptOrReject
);

// create asset delevery request for partner
router.post(
  "/creatAccetDeleveryRequest",
  authenticateToken,
  creatAssetDeleveryRequest
);

// Verify Address Route
router.post(
  "/verify-address-beneficiary",
  authenticateToken,
  verifyAddressToBeneficiary
);
router.post("/verify-address-donor", authenticateToken, verifyAddressToDonor);
router.post(
  "/verify-address-partner",
  authenticateToken,
  verifyAddressToPartner
);

//GST Compilance
router.post("/generate", generateInvoice);
router.get("/", getAllInvoice);
router.get("/invoiceByrequestId/:requestId", getInvoiceByrequestId);
router.post("/add-repair-invoice", addRepaireInvoice);
router.post("/generate-allocation-doc", generateAllocationDoc);
router.post("/add-disposal-invoice", addDisposalDoc);

//subscription plan
router.get("/pricing-plans", getPricingPlans);
router.get("/pricing-plans/:id", getPricingPlanById);
router.post("/pricing-plans", createPricingPlan);
router.put("/pricing-plans/:id", updatePricingPlan);
router.delete("/pricing-plans/:id", deletePricingPlan);



export default router;
