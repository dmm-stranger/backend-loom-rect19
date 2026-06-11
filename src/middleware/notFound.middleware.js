import ApiError from "../utils/ApiError.js";

/**
 * Catches any request that doesn't match a defined route and forwards
 * a 404 ApiError to the centralized error middleware.
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export default notFound;
