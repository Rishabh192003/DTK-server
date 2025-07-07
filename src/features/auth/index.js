import authRoutes from "./routes/authRoutes.js";

const authModule = (app) => {
  app.use("/api/v1/auth", authRoutes);
};

export default authModule;
