import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Unauthorized role",
        });
      }

      req.user = decoded; // Pass user details to the request object
      next();
    } catch (error) {
      console.error("JWT verification failed:", error);
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired token" });
    }
  };
};
