import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Category from "../models/Category.model.js";
import {
  uploadImage,
} from "../middleware/upload.middleware.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate("parent", "name slug");
  res.status(200).json(new ApiResponse(200, { categories }, "Categories fetched"));
});

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

export const createCategory = asyncHandler(async (req, res) => {
  const { name, parent } = req.body;

  let image = { url: "", public_id: "" };
  if (req.file) {
    // Cloudinary: upload buffer → get url + public_id
    // Local: multer saved to disk → just build the url from filename
    if (uploadImage) {
      image = await uploadImage(req.file.buffer, "techstore/categories");
    } else {
      image = { url: getImageUrl(req.file.filename), public_id: req.file.filename };
    }
  }

  const category = await Category.create({ name, parent: parent || null, image });
  res.status(201).json(new ApiResponse(201, { category }, "Category created"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const { name, parent } = req.body;
  if (name) category.name = name;
  if (parent !== undefined) category.parent = parent || null;

  if (req.file) {
    await deleteImage(category.image?.url);
    if (uploadImage) {
      category.image = await uploadImage(req.file.buffer, "techstore/categories");
    } else {
      category.image = { url: getImageUrl(req.file.filename), public_id: req.file.filename };
    }
  }

  await category.save();
  res.status(200).json(new ApiResponse(200, { category }, "Category updated"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  await deleteImage(category.image?.url);
  await category.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Category deleted"));
});
