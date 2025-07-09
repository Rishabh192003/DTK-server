import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { errorHandler } from "./middlewares/errorHandler.js";
import { protect } from "./middlewares/authMiddleware.js";
import authModule from "./features/auth/index.js";
import beneficiaryModule from "./features/beneficiary/index.js";
import donorModule from "./features/donor/index.js";
import adminModule from "./features/admin/index.js";
import partnerModule from "./features/partner/index.js";
import { isAdmin } from "./middlewares/roleMiddleware.js";

const app = express();

// Middleware
// app.use(
//   cors({
//     origin: ["https://your-frontend-domain.com"],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true, // For cookies or authorization headers
//   })
// );

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

// Authentication Module
authModule(app); // Routes for login and authentication (e.g., /api/auth)

// Feature Modules
// app.use("/api/v1/beneficiary", protect, beneficiaryModule);
// app.use("/api/v1/donor", protect, donorModule);
// app.use("/api/v1/admin", protect, isAdmin, adminModule);
adminModule(app);
// app.use("/api/v1/partner", protect, partnerModule);
partnerModule(app);
donorModule(app);
beneficiaryModule(app);

// Error Handler
app.use(errorHandler);

app.get("/api/v1/getKey", (req, res) =>
  res
    .status(200)
    .json({ message: "success", data: { key: process.env.RAZORPAY_KEY_ID } })
);

export default app;
