import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

/**
 * Runs after express-validator chains (e.g. body("email").isEmail()).
 * If any validation errors exist, throws a 400 ApiError with all
 * messages joined together.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(", ");
    throw new ApiError(400, message);
  }
  next();
};

export default validate;
