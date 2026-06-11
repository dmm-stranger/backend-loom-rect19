/**
 * Standard success response shape for all controllers.
 * Keeps the frontend RTK Query response handling consistent.
 *
 * Usage:
 *   res.status(200).json(new ApiResponse(200, user, "Login successful"));
 */
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
