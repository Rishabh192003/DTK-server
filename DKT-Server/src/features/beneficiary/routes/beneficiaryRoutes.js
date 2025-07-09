import express from "express";
import {
  createAssetRequest,
  updateAssetRequestStatus,
} from "../controllers/assetRequestController.js";
import { authenticateToken } from "../../donor/middelwere/authenticateToken.js";
import {
  addAddress,
  addBeneficaryGstDetails,
} from "../controllers/addGstInfo.js";
import {
  getAllAssetRequests,
  getAllBeneficiary,
  getAssetRequestsByBeneficiary,
  getAssetRequestsByBeneficiaryToken,
  getAssetRequestsById,
  getBeneficiaryById,
  getBeneficiaryDetails,
} from "../controllers/beneficiaryController.js";
import { reportToAdmin } from "../controllers/reportController.js";

// import {
//   getBeneficiaries,
//   createBeneficiary,
// } from "../controllers/beneficiaryController.js";

const router = express.Router();

// // GET: Retrieve all beneficiaries
// router.get('/', getAllBeneficiaries);

// // POST: Create a new beneficiary
// router.post('/', createBeneficiary);

// // PUT: Update a specific beneficiary
// router.put('/:id', updateBeneficiary);

// // DELETE: Delete a specific beneficiary
// router.delete('/:id', deleteBeneficiary);

router.get("/detail", authenticateToken, getBeneficiaryDetails);
router.get("/allBeneficiary", authenticateToken, getAllBeneficiary);
router.get("/allAssetsRequests", authenticateToken, getAllAssetRequests);
router.post("/getBeneficiaryById", authenticateToken, getBeneficiaryById);
router.get(
  "/getBeneficiaryRequestsById/:id",
  authenticateToken,
  getAssetRequestsByBeneficiary
);
router.get(
  "/getBeneficiaryRequestsByToken",
  authenticateToken,
  getAssetRequestsByBeneficiaryToken
);
router.get(
  "/getBeneficiaryRequestById/:id",
  authenticateToken,
  getAssetRequestsById
);
router.post("/createAssetRequest", authenticateToken, createAssetRequest);
router.post("/gstInfo/add", authenticateToken, addBeneficaryGstDetails); // Create request
router.post("/addAdress", authenticateToken, addAddress);
router.post(
  "/acceptRequest/:requestId",
  authenticateToken,
  updateAssetRequestStatus
);

router.post("/reportToAdmin", authenticateToken, reportToAdmin);

export default router;
