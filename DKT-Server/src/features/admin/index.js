import routes from "./routes/adminRoutes.js";

const adminModule = (app) => {
  app.use("/api/v1/admin", routes);
};

export default adminModule;
