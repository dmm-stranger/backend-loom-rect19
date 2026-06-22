import { body, param } from "express-validator";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid category ID");
  }
  return true;
};

const isValidJSON = (value) => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    throw new Error("Must be a valid JSON string (e.g. {\"RAM\":\"16GB\"})");
  }
};

// ─────────────────────────────────────────────
//  CREATE PRODUCT — all required fields
// ─────────────────────────────────────────────
export const createProductValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 200 })
    .withMessage("Product name cannot exceed 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),

  body("brand")
    .trim()
    .notEmpty()
    .withMessage("Brand is required"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .custom(isValidObjectId),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("discountPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be a positive number")
    .custom((value, { req }) => {
      if (Number(value) >= Number(req.body.price)) {
        throw new Error("Discount price must be less than the original price");
      }
      return true;
    }),

  body("stock")
    .notEmpty()
    .withMessage("Stock quantity is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false"),

  body("specs")
    .optional()
    .custom(isValidJSON),
];

// ─────────────────────────────────────────────
//  UPDATE PRODUCT — all fields optional
//  (only validates what is present in the body)
// ─────────────────────────────────────────────
export const updateProductValidator = [
  param("id")
    .custom(isValidObjectId)
    .withMessage("Invalid product ID in URL"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Product name cannot exceed 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),

  body("brand")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Brand cannot be empty"),

  body("category")
    .optional()
    .custom(isValidObjectId),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("discountPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be a positive number")
    .custom((value, { req }) => {
      // Only validate against price if price is also being updated
      if (req.body.price && Number(value) >= Number(req.body.price)) {
        throw new Error("Discount price must be less than the original price");
      }
      return true;
    }),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false"),

  body("specs")
    .optional()
    .custom(isValidJSON),

  body("removeImages")
    .optional()
    .custom(isValidJSON)
    .withMessage("removeImages must be a valid JSON array of public_ids"),
];
