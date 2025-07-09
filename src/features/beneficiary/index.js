import routes from "./routes/beneficiaryRoutes.js";

const beneficiaryModule = (app) => {
  app.use("/api/v1/beneficiary", routes);
};

export default beneficiaryModule;
