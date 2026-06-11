import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.model.js";

/**
 * Protects a route by requiring a valid JWT.
 * Reads the token from (in order of priority):
 *   1. httpOnly cookie set by generateToken()
 *   2. `Authorization: Bearer <token>` header
 *
 * On success attaches the authenticated user (without password) to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "Not authorized, user no longer exists");
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles. Must be used AFTER `protect`.
 *
 * Usage:
 *   router.get("/admin/users", protect, authorize("admin"), getUsers);
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user?.role}' is not permitted to access this resource`
      );
    }
    next();
  };
};
