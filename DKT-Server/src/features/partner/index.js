import routes from "./routes/partnerRoutes.js";

const partnerModule = (app) => {
  app.use("/api/v1/partner", routes);
};

export default partnerModule;
