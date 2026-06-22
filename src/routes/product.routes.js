import express from "express";
import {
  getProducts,
  getFeaturedProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  createProductValidator,
  updateProductValidator,
} from "../validators/product.validator.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
//  PUBLIC ROUTES
// ─────────────────────────────────────────────

// GET /api/v1/products/featured
// ⚠️  MUST be defined BEFORE /:id — otherwise Express matches
//     "featured" as an :id param and hits getProduct instead
router.get("/featured", getFeaturedProducts);

// GET /api/v1/products          → paginated + filterable product list
// GET /api/v1/products/:id      → single product by id or slug
router.get("/", getProducts);
router.get("/:id", getProduct);

// ─────────────────────────────────────────────
//  ADMIN ROUTES
//  Chain: protect → authorize → upload → validate → controller
//  Upload runs before validate because multer must parse the
//  multipart body before express-validator can read req.body fields.
// ─────────────────────────────────────────────

// POST /api/v1/products         → create product (up to 5 images)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("images", 5),    // reads files from the "images" field (max 5)
  createProductValidator,
  validate,
  createProduct
);

// PUT /api/v1/products/:id      → update product (append/remove images)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.array("images", 5),
  updateProductValidator,
  validate,
  updateProduct
);

// DELETE /api/v1/products/:id   → delete product + all Cloudinary images
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;
