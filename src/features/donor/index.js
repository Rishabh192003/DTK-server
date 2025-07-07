import { protect } from "../../middlewares/authMiddleware.js";
import routes from "./routes/donorRoutes.js";

const donorModule = (app) => {
  app.use("/api/v1/donor", protect, routes);
};

export default donorModule;
