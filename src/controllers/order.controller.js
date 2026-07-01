import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Order from "../models/Order.model.js";
import Cart from "../models/Cart.model.js";
import Coupon from "../models/Coupon.model.js";
import Product from "../models/Product.model.js";
import calculateOrderTotals from "../utils/calculateOrderTotals.js";

// @desc    Create a new order from the user's cart
// @route   POST /api/v1/orders
// @access  Private
//
// Flow:
// 1. Get user's cart (must have items)
// 2. Verify all products still exist + have enough stock
// 3. Calculate totals (items, shipping, tax, discount)
// 4. Create Order document with paymentInfo.status = "pending"
// 5. Stock is reduced ONLY after payment confirmed by Stripe webhook
// 6. Cart is cleared ONLY after payment confirmed by Stripe webhook
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;

  // ── Step 1: Get cart ────────────────────────
  const cart = await Cart.findOne({ user: req.user._id }).populate("coupon");
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // ── Step 2: Verify stock ────────────────────
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new ApiError(404, `Product "${item.name}" is no longer available`);
    }
    if (product.stock < item.qty) {
      throw new ApiError(
        400,
        `Insufficient stock for "${item.name}". Available: ${product.stock}, requested: ${item.qty}`
      );
    }
  }

  // ── Step 3: Calculate totals ────────────────
  let discount = 0;
  let couponCode = "";

  if (cart.coupon) {
    const { valid, message } = cart.coupon.isValid(cart.subtotal);
    if (valid) {
      discount = cart.coupon.calculateDiscount(cart.subtotal);
      couponCode = cart.coupon.code;
    } else {
      // Coupon is no longer valid (expired/deactivated since it was applied)
      // Proceed without discount rather than blocking the order
      console.warn(`Coupon "${cart.coupon.code}" invalid at checkout: ${message}`);
    }
  }

  const { itemsPrice, shippingPrice, taxPrice, totalPrice } =
    calculateOrderTotals(cart.items, discount);

  // ── Step 4: Create order ────────────────────
  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map((item) => ({
      product: item.product,
      name: item.name,
      image: item.image,
      price: item.price,
      qty: item.qty,
    })),
    shippingAddress,
    paymentInfo: {
      provider: "stripe",
      status: "pending",
    },
    couponCode,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discount,
    totalPrice,
  });

  // NOTE:
  // Stock reduction and cart clearing happen in payment.controller.js
  // after Stripe confirms payment via webhook.
  // This prevents stock being reserved for unpaid orders.

  res.status(201).json(
    new ApiResponse(201, { order }, "Order created — complete payment to confirm")
  );
});

// @desc    Get current user's order history
// @route   GET /api/v1/orders/my
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 }) // newest first
    .select("-__v");          // exclude version key

  res.status(200).json(
    new ApiResponse(200, { orders, count: orders.length }, "Orders fetched")
  );
});

// @desc    Get single order by ID
// @route   GET /api/v1/orders/:id
// @access  Private (owner or admin)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) throw new ApiError(404, "Order not found");

  // Only the order owner or an admin can view it
  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Not authorized to view this order");
  }

  res.status(200).json(new ApiResponse(200, { order }, "Order fetched"));
});
