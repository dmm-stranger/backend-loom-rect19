import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Wishlist from "../models/Wishlist.model.js";
import Product from "../models/Product.model.js";

// @desc    Get user's wishlist with full product details
// @route   GET /api/v1/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
    "products",
    "name price discountPrice images ratingsAverage ratingsCount stock slug"
  );

  // Return empty wishlist if user hasn't added anything yet
  if (!wishlist) {
    return res.status(200).json(
      new ApiResponse(200, { products: [], productIds: [] }, "Wishlist is empty")
    );
  }

  // Also return a flat array of productIds so the frontend
  // can quickly check if a product is wishlisted
  // e.g. wishlist icon filled/unfilled on product cards
  const productIds = wishlist.products.map((p) => p._id);

  res.status(200).json(
    new ApiResponse(200, { products: wishlist.products, productIds }, "Wishlist fetched")
  );
});

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist/:productId
// @access  Private
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // Find or create wishlist for this user
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  // Check if product is already in wishlist
  const alreadyAdded = wishlist.products.some(
    (id) => id.toString() === productId
  );
  if (alreadyAdded) {
    throw new ApiError(400, "Product is already in your wishlist");
  }

  wishlist.products.push(productId);
  await wishlist.save();

  const productIds = wishlist.products.map((id) => id.toString());

  res.status(200).json(
    new ApiResponse(200, { productIds }, "Product added to wishlist")
  );
});

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) throw new ApiError(404, "Wishlist not found");

  const existingProduct = wishlist.products.some(
    (id) => id.toString() === productId
  );
  if (!existingProduct) {
    throw new ApiError(404, "Product not found in wishlist");
  }

  // Filter out the product
  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId
  );
  await wishlist.save();

  const productIds = wishlist.products.map((id) => id.toString());

  res.status(200).json(
    new ApiResponse(200, { productIds }, "Product removed from wishlist")
  );
});
