import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import Product from "../../models/Product.model.js";

// @desc    Get all products for admin (no filters hidden)
// @route   GET /api/v1/admin/products
// @access  Admin
//
// Unlike the public GET /products endpoint which only
// shows in-stock items, this returns everything including:
//   - Out of stock products (stock = 0)
//   - All categories
//   - Full product details
//
// Supported query params:
//   page     → page number (default: 1)
//   limit    → products per page (default: 20)
//   search   → text search on name/brand
//   category → filter by category ObjectId
//   stock    → "out" (stock=0) | "low" (stock<=5) | "in" (stock>0)
export const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = {};

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Stock level filter — useful for inventory management
  if (req.query.stock === "out") {
    filter.stock = 0;
  } else if (req.query.stock === "low") {
    filter.stock = { $gt: 0, $lte: 5 };
  } else if (req.query.stock === "in") {
    filter.stock = { $gt: 0 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    }, "Products fetched")
  );
});
