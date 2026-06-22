import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Product from "../models/Product.model.js";
import { getImageUrl, deleteLocalImage } from "../middleware/upload.middleware.js";

// ─────────────────────────────────────────────
//  PUBLIC CONTROLLERS
// ─────────────────────────────────────────────

// @desc    Get all products (paginated, filterable, searchable)
// @route   GET /api/v1/products
// @access  Public
//
// Query params:
//   page, limit, search, category, minPrice, maxPrice
//   sort: "price_asc" | "price_desc" | "rating" | "newest"
export const getProducts = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 12);
  const skip  = (page - 1) * limit;

  const filter = {};

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  const sortMap = {
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    rating:     { ratingsAverage: -1 },
    newest:     { createdAt: -1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    }, "Products fetched")
  );
});

// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const products = await Product.find({ isFeatured: true })
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json(new ApiResponse(200, { products }, "Featured products fetched"));
});

// @desc    Get single product by id or slug
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findOne({
    $or: [
      { _id: id.match(/^[a-f\d]{24}$/i) ? id : null },
      { slug: id },
    ],
  }).populate("category", "name slug");

  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json(new ApiResponse(200, { product }, "Product fetched"));
});

// ─────────────────────────────────────────────
//  ADMIN CONTROLLERS
// ─────────────────────────────────────────────

// @desc    Create a product
// @route   POST /api/v1/products
// @access  Admin
//
// Expects multipart/form-data:
//   fields : name, description, brand, category, price,
//            discountPrice, stock, isFeatured, specs (JSON string)
//   files  : images[] (up to 5)
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name, description, brand, category,
    price, discountPrice, stock, isFeatured, specs,
  } = req.body;

  const files = req.files || [];
  if (files.length > 5) {
    throw new ApiError(400, "Maximum 5 images allowed per product");
  }

  // Each saved file becomes { url: "/uploads/filename.jpg", public_id: "filename.jpg" }
  const images = files.map((file) => ({
    url: getImageUrl(file.filename),
    public_id: file.filename,
  }));

  let parsedSpecs = {};
  if (specs) {
    try {
      parsedSpecs = JSON.parse(specs);
    } catch {
      throw new ApiError(400, "specs must be a valid JSON string");
    }
  }

  const product = await Product.create({
    name, description, brand, category,
    price,
    discountPrice: discountPrice || 0,
    stock,
    isFeatured: isFeatured === "true" || isFeatured === true,
    images,
    specs: parsedSpecs,
  });

  await product.populate("category", "name slug");
  res.status(201).json(new ApiResponse(201, { product }, "Product created"));
});

// @desc    Update a product
// @route   PUT /api/v1/products/:id
// @access  Admin
//
// To remove specific images pass:
//   removeImages: JSON array of public_ids (filenames)
//   e.g. '["images-123.jpg","images-456.jpg"]'
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  const {
    name, description, brand, category,
    price, discountPrice, stock, isFeatured,
    specs, removeImages,
  } = req.body;

  if (name        !== undefined) product.name        = name;
  if (description !== undefined) product.description = description;
  if (brand       !== undefined) product.brand       = brand;
  if (category    !== undefined) product.category    = category;
  if (price       !== undefined) product.price       = price;
  if (discountPrice !== undefined) product.discountPrice = discountPrice;
  if (stock       !== undefined) product.stock       = stock;
  if (isFeatured  !== undefined)
    product.isFeatured = isFeatured === "true" || isFeatured === true;

  if (specs) {
    try { product.specs = JSON.parse(specs); }
    catch { throw new ApiError(400, "specs must be a valid JSON string"); }
  }

  // Remove specific images by public_id (filename) and delete from disk
  if (removeImages) {
    let toRemove = [];
    try { toRemove = JSON.parse(removeImages); }
    catch { throw new ApiError(400, "removeImages must be a valid JSON array"); }

    toRemove.forEach((filename) => deleteLocalImage(`/uploads/${filename}`));
    product.images = product.images.filter(
      (img) => !toRemove.includes(img.public_id)
    );
  }

  // Append new uploaded images
  const newFiles = req.files || [];
  if (product.images.length + newFiles.length > 5) {
    throw new ApiError(
      400,
      `Adding ${newFiles.length} image(s) would exceed the 5-image limit. ` +
      `This product currently has ${product.images.length} image(s).`
    );
  }

  if (newFiles.length > 0) {
    const newImages = newFiles.map((file) => ({
      url: getImageUrl(file.filename),
      public_id: file.filename,
    }));
    product.images.push(...newImages);
  }

  await product.save();
  await product.populate("category", "name slug");
  res.status(200).json(new ApiResponse(200, { product }, "Product updated"));
});

// @desc    Delete a product
// @route   DELETE /api/v1/products/:id
// @access  Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  // Delete all images from disk before removing the DB document
  product.images.forEach((img) => deleteLocalImage(img.url));
  await product.deleteOne();

  res.status(200).json(new ApiResponse(200, null, "Product deleted"));
});

// ─────────────────────────────────────────────
//  CLOUDINARY ALTERNATIVE (commented out)
//  Replace getImageUrl/deleteLocalImage with:
//
//  CREATE:
//  const images = await Promise.all(
//    files.map((f) => uploadToCloudinary(f.buffer, "techstore/products"))
//  );
//
//  UPDATE (remove):
//  await Promise.all(toRemove.map(deleteFromCloudinary));
//
//  UPDATE (add):
//  const newImages = await Promise.all(
//    newFiles.map((f) => uploadToCloudinary(f.buffer, "techstore/products"))
//  );
//
//  DELETE:
//  await Promise.all(product.images.map((img) => deleteFromCloudinary(img.public_id)));
// ─────────────────────────────────────────────
