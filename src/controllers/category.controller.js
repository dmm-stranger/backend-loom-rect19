import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Category from "../models/Category.model.js";
import { getImageUrl, deleteLocalImage } from "../middleware/upload.middleware.js";

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate("parent", "name slug");
  res.status(200).json(new ApiResponse(200, { categories }, "Categories fetched"));
});

// @desc    Get single category by id or slug
// @route   GET /api/v1/categories/:id
// @access  Public
export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findOne({
    $or: [
      { _id: id.match(/^[a-f\d]{24}$/i) ? id : null },
      { slug: id },
    ],
  }).populate("parent", "name slug");

  if (!category) throw new ApiError(404, "Category not found");
  res.status(200).json(new ApiResponse(200, { category }, "Category fetched"));
});

// @desc    Create a new category
// @route   POST /api/v1/categories
// @access  Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, parent } = req.body;

  // If a file was uploaded, build its public URL from the saved filename
  // e.g. req.file.filename = "image-1718234400000-123.jpg"
  //      → stored as "/uploads/image-1718234400000-123.jpg" in MongoDB
  const image = req.file
    ? { url: getImageUrl(req.file.filename), public_id: req.file.filename }
    : { url: "", public_id: "" };

  const category = await Category.create({
    name,
    parent: parent || null,
    image,
  });

  res.status(201).json(new ApiResponse(201, { category }, "Category created"));
});

// @desc    Update a category
// @route   PUT /api/v1/categories/:id
// @access  Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const { name, parent } = req.body;

  if (name) category.name = name;
  if (parent !== undefined) category.parent = parent || null;

  // If a new image was uploaded, delete the old one from disk first
  if (req.file) {
    deleteLocalImage(category.image?.url);
    category.image = {
      url: getImageUrl(req.file.filename),
      public_id: req.file.filename,
    };
  }

  await category.save();
  res.status(200).json(new ApiResponse(200, { category }, "Category updated"));
});

// @desc    Delete a category
// @route   DELETE /api/v1/categories/:id
// @access  Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  // Remove the image file from disk before deleting the DB document
  deleteLocalImage(category.image?.url);
  await category.deleteOne();

  res.status(200).json(new ApiResponse(200, null, "Category deleted"));
});

// ─────────────────────────────────────────────
//  CLOUDINARY ALTERNATIVE (commented out)
//  Swap getImageUrl/deleteLocalImage for
//  uploadToCloudinary/deleteFromCloudinary
//  and change image = req.file? block to:
//
//  const image = req.file
//    ? await uploadToCloudinary(req.file.buffer, "techstore/categories")
//    : { url: "", public_id: "" };
// ─────────────────────────────────────────────
