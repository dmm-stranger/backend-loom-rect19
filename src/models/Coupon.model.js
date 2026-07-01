import mongoose from "mongoose";

// ─────────────────────────────────────────────
//  COUPON SCHEMA
//  Coupons are created by admin and applied by
//  customers at cart level. The discount is a
//  percentage (e.g. 20 = 20% off the subtotal).
// ─────────────────────────────────────────────
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [ true, "Coupon code is required" ],
      unique: true,
      uppercase: true,   // always stored as uppercase e.g. "SAVE20"
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: [ true, "Discount percentage is required" ],
      min: [ 1, "Discount must be at least 1%" ],
      max: [ 100, "Discount cannot exceed 100%" ],
    },
    // Minimum cart subtotal required to use this coupon
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [ 0, "Minimum order amount cannot be negative" ],
    },
    // How many times this coupon can be used in total (null = unlimited)
    maxUses: {
      type: Number,
      default: null,
    },
    // How many times this coupon has been used so far
    usedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: [ true, "Expiry date is required" ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────
//  INSTANCE METHOD — validate coupon against cart
//  Returns { valid: true } or { valid: false, message }
//  Called inside cart.controller.js applyCoupon
// ─────────────────────────────────────────────
couponSchema.methods.isValid = function (cartSubtotal) {
  if (!this.isActive) {
    return { valid: false, message: "This coupon is no longer active" };
  }

  if (new Date() > this.expiresAt) {
    return { valid: false, message: "This coupon has expired" };
  }

  if (this.maxUses !== null && this.usedCount >= this.maxUses) {
    return { valid: false, message: "This coupon has reached its usage limit" };
  }

  if (cartSubtotal < this.minOrderAmount) {
    return {
      valid: false,
      message: `A minimum order of $${this.minOrderAmount.toFixed(2)} is required to use this coupon`,
    };
  }

  return { valid: true };
};

// ─────────────────────────────────────────────
//  INSTANCE METHOD — calculate discount amount
//  e.g. subtotal $100, discountPercent 20 → $20
// ─────────────────────────────────────────────
couponSchema.methods.calculateDiscount = function (subtotal) {
  return parseFloat(((subtotal * this.discountPercent) / 100).toFixed(2));
};

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
