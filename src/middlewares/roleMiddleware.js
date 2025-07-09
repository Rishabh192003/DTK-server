export const isAdmin = (req, res, next) => {
  if (req.user.section !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied: Admins only." });
  }
  next();
};
