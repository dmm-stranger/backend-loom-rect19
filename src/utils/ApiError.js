/**
 * Custom error class used throughout controllers/middleware.
 * The centralized error middleware reads `statusCode` and `message`
 * to build the JSON error response.
 *
 * Usage:
 *   throw new ApiError(404, "Product not found");
 */
class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong") {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
