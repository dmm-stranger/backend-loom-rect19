import express from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
//  PUBLIC ROUTES
// ─────────────────────────────────────────────

// GET /api/v1/categories        → all categories (used by frontend nav/filter)
// GET /api/v1/categories/:id    → single category by id or slug
router.get("/", getCategories);
router.get("/:id", getCategory);

// ─────────────────────────────────────────────
//  ADMIN ROUTES
//  All require: valid JWT (protect) + admin role (authorize)
// ─────────────────────────────────────────────

// POST /api/v1/categories       → create category (optional image upload)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),   // multer reads one file from the "image" field
  createCategory
);

// PUT /api/v1/categories/:id    → update category (optional new image)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  updateCategory
);

// DELETE /api/v1/categories/:id → delete category + Cloudinary image
router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;
