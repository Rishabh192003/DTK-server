import express from "express";
import { upload } from "../../../middlewares/multer.js";
import {
  addProduct,
  getAllProducts,
  getAllUploads,
  getDonorsProductUploadsById,
  getProductUploads,
  getProductUploadsById,
} from "../controllers/addProductController.js";
import {
  createRequest,
  getAcceptedRequests,
  getAllRequests,
  getDonerRequests,
  getDonerRequestsById,
  getDonerRequestsBy_Id,
  getRequests,
} from "../controllers/createRequestController.js";
import {
  getAllDonor,
  getDonorById,
  getDonorDetails,
} from "../controllers/donorController.js";
import { authenticateToken } from "../middelwere/authenticateToken.js";
import { addAddress, addGstDetails } from "../controllers/addGstInfo.js";
import { trackOrder } from "../controllers/trackOrder.js";
import {
  checkout,
  paymentVarification,
} from "../controllers/paymentController.js";
// import {
//   getAllDonors,
//   createDonor,
//   updateDonor,
//   deleteDonor,
// } from "../controllers/donorController.js";

const router = express.Router();

// // GET: Retrieve all donors
// router.get("/", getAllDonors);

// // POST: Add a new donor
// router.post("/", createDonor);

// // PUT: Update donor details
// router.put("/:id", updateDonor);

// // DELETE: Remove a donor
// router.delete("/:id", deleteDonor);

// Add product (Single with image upload, Bulk with URL)
// router.post("/add-product", authenticateToken, upload.single("image"), addProduct);

router.get("/", authenticateToken, getDonorDetails);
router.post("/getDonorById", authenticateToken, getDonorById);
router.get("/allDonor", authenticateToken, getAllDonor);
router.post(
  "/add-product",
  authenticateToken,
  upload.single("images"),
  addProduct
);
router.get("/products", authenticateToken, getAllProducts);
router.get("/get-myUploads", authenticateToken, getProductUploads);
router.get("/getallUploads", authenticateToken, getAllUploads);
router.post("/get-myUploadsById", getProductUploadsById);
router.post("/getDonorUploadsById", getDonorsProductUploadsById);

router.post("/create-requests", createRequest); // Create request
router.get("/requests", authenticateToken, getRequests); // get requests
router.get("/allRequest", authenticateToken, getAllRequests); // get requests

//this both are same one is taking form token and in is body
router.get("/requests/donor", authenticateToken, getDonerRequests); // get doner request by token
router.get("/acceptedRequests", authenticateToken, getAcceptedRequests); // Create request
router.post("/requests/donor", authenticateToken, getDonerRequestsById); // get doner request by Id

//for admin basis on request id
router.post("/requests", authenticateToken, getDonerRequestsBy_Id); // get doner request by Id

//adding gst rout
router.post("/gstInfo/add", authenticateToken, addGstDetails);
router.post("/addAdress", authenticateToken, addAddress);

// trackOrder
router.get("/track-order", authenticateToken, trackOrder);

// payment routes
router.post("/checkout", authenticateToken, checkout);
router.post("/verification", authenticateToken, paymentVarification);

export default router;
