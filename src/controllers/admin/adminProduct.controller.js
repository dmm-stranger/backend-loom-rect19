import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import Product from "../../models/Product.model.js";

export const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;
  const filter = {};
  if (req.query.search)   filter.$text    = { $search: req.query.search };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.stock === "out")      filter.stock = 0;
  else if (req.query.stock === "low") filter.stock = { $gt: 0, $lte: 5 };
  else if (req.query.stock === "in")  filter.stock = { $gt: 0 };

  const [products, total] = await Promise.all([
    Product.find(filter).populate("category","name slug").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, { products, pagination: { total, page, pages: Math.ceil(total/limit), limit } }, "Products fetched"));
});

export const getProductAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category","name slug");
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json(new ApiResponse(200, { product }, "Product fetched"));
});

export const toggleFeatured = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  product.isFeatured = !product.isFeatured;
  await product.save();
  res.status(200).json(new ApiResponse(200, { isFeatured: product.isFeatured }, `Product ${product.isFeatured ? "marked as featured" : "removed from featured"}`));
});

export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || stock < 0) throw new ApiError(400, "Valid stock quantity is required (minimum 0)");
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  product.stock = stock;
  await product.save();
  res.status(200).json(new ApiResponse(200, { stock: product.stock }, "Stock updated successfully"));
});
