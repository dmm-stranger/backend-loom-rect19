import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import Coupon from "../../models/Coupon.model.js";

// @desc    Get all coupons (admin)
// @route   GET /api/v1/admin/coupons
// @access  Admin
//
// Supported query params:
//   page     → page number (default: 1)
//   limit    → coupons per page (default: 20)
//   isActive → "true" | "false" filter
export const getAllCoupons = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = {};

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Coupon.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      coupons,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    }, "Coupons fetched")
  );
});

// @desc    Create a new coupon (admin)
// @route   POST /api/v1/admin/coupons
// @access  Admin
//
// Body: { code, discountPercent, minOrderAmount, maxUses, expiresAt }
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountPercent,
    minOrderAmount,
    maxUses,
    expiresAt,
  } = req.body;

  // Check for duplicate coupon code
  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new ApiError(409, `Coupon code "${code.toUpperCase()}" already exists`);
  }

  const coupon = await Coupon.create({
    code,
    discountPercent,
    minOrderAmount: minOrderAmount || 0,
    maxUses: maxUses || null,
    expiresAt,
  });

  res.status(201).json(
    new ApiResponse(201, { coupon }, "Coupon created successfully")
  );
});

// @desc    Update a coupon (admin)
// @route   PATCH /api/v1/admin/coupons/:id
// @access  Admin
//
// Supports partial updates — only provided fields are changed.
// usedCount is NOT updatable — it is managed automatically.
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found");

  const {
    code,
    discountPercent,
    minOrderAmount,
    maxUses,
    expiresAt,
    isActive,
  } = req.body;

  // If code is being changed, check it doesn't conflict with another coupon
  if (code && code.toUpperCase() !== coupon.code) {
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      throw new ApiError(409, `Coupon code "${code.toUpperCase()}" already exists`);
    }
    coupon.code = code;
  }

  if (discountPercent !== undefined) coupon.discountPercent = discountPercent;
  if (minOrderAmount  !== undefined) coupon.minOrderAmount  = minOrderAmount;
  if (maxUses         !== undefined) coupon.maxUses         = maxUses;
  if (expiresAt       !== undefined) coupon.expiresAt       = expiresAt;
  if (isActive        !== undefined) coupon.isActive        = isActive;

  await coupon.save();

  res.status(200).json(
    new ApiResponse(200, { coupon }, "Coupon updated successfully")
  );
});

// @desc    Delete a coupon (admin)
// @route   DELETE /api/v1/admin/coupons/:id
// @access  Admin
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found");

  await coupon.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, "Coupon deleted successfully")
  );
});
