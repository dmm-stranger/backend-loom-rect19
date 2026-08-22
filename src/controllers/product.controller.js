import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Product from "../models/Product.model.js";
import {
  uploadImage,
  getImageUrl,
  deleteImage,
} from "../middleware/upload.middleware.js";

// ─── helper: build image object from uploaded file ───
const buildImageObject = async (file, folder = "techstore/products") => {
  if (uploadImage) {
    // Cloudinary — stream buffer to CDN
    return await uploadImage(file.buffer, folder);
  }
  // Local — multer already saved file, just build path
  return { url: getImageUrl(file.filename), public_id: file.filename };
};

// ── PUBLIC ────────────────────────────────────────────

export const getProducts = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 12);
  const skip  = (page - 1) * limit;
  const filter = {};
  if (req.query.search)   filter.$text     = { $search: req.query.search };
  if (req.query.category) filter.category  = req.query.category;
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
    Product.find(filter).populate("category", "name slug").sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, { products, pagination: { total, page, pages: Math.ceil(total / limit), limit } }, "Products fetched"));
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const products = await Product.find({ isFeatured: true })
    .populate("category", "name slug").sort({ createdAt: -1 }).limit(limit);
  res.status(200).json(new ApiResponse(200, { products }, "Featured products fetched"));
});

export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findOne({
    $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : null }, { slug: id }],
  }).populate("category", "name slug");
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json(new ApiResponse(200, { product }, "Product fetched"));
});

// ── ADMIN ─────────────────────────────────────────────

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, brand, category, price, discountPrice, stock, isFeatured, specs } = req.body;
  const files = req.files || [];
  if (files.length > 5) throw new ApiError(400, "Maximum 5 images allowed per product");
  const images = await Promise.all(files.map((f) => buildImageObject(f)));
  let parsedSpecs = {};
  if (specs) {
    try { parsedSpecs = JSON.parse(specs); }
    catch { throw new ApiError(400, "specs must be a valid JSON string"); }
  }
  const product = await Product.create({
    name, description, brand, category, price,
    discountPrice: discountPrice || 0, stock,
    isFeatured: isFeatured === "true" || isFeatured === true,
    images, specs: parsedSpecs,
  });
  await product.populate("category", "name slug");
  res.status(201).json(new ApiResponse(201, { product }, "Product created"));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  const { name, description, brand, category, price, discountPrice, stock, isFeatured, specs, removeImages } = req.body;
  if (name        !== undefined) product.name        = name;
  if (description !== undefined) product.description = description;
  if (brand       !== undefined) product.brand       = brand;
  if (category    !== undefined) product.category    = category;
  if (price       !== undefined) product.price       = price;
  if (discountPrice !== undefined) product.discountPrice = discountPrice;
  if (stock       !== undefined) product.stock       = stock;
  if (isFeatured  !== undefined) product.isFeatured  = isFeatured === "true" || isFeatured === true;
  if (specs) {
    try { product.specs = JSON.parse(specs); }
    catch { throw new ApiError(400, "specs must be a valid JSON string"); }
  }
  if (removeImages) {
    let toRemove = [];
    try { toRemove = JSON.parse(removeImages); }
    catch { throw new ApiError(400, "removeImages must be a valid JSON array"); }
    await Promise.all(toRemove.map((pub_id) => deleteImage(product.images.find(i => i.public_id === pub_id)?.url)));
    product.images = product.images.filter((img) => !toRemove.includes(img.public_id));
  }
  const newFiles = req.files || [];
  if (product.images.length + newFiles.length > 5) {
    throw new ApiError(400, `Adding ${newFiles.length} image(s) would exceed the 5-image limit.`);
  }
  if (newFiles.length > 0) {
    const newImages = await Promise.all(newFiles.map((f) => buildImageObject(f)));
    product.images.push(...newImages);
  }
  await product.save();
  await product.populate("category", "name slug");
  res.status(200).json(new ApiResponse(200, { product }, "Product updated"));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  await Promise.all(product.images.map((img) => deleteImage(img.url)));
  await product.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Product deleted"));
});
