import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import Coupon from "../models/Coupon.model.js";

// ─────────────────────────────────────────────
//  HELPER — build the full cart response
//  Populates coupon, calculates discount + total
//  and returns a consistent shape every time.
//  Used by every controller so the frontend
//  always receives the same cart object.
// ─────────────────────────────────────────────
const buildCartResponse = async (cart) => {
  await cart.populate("coupon");

  const subtotal = cart.subtotal; // virtual from Cart model
  let discount = 0;
  let couponDetails = null;

  if (cart.coupon) {
    discount = cart.coupon.calculateDiscount(subtotal);
    couponDetails = {
      code: cart.coupon.code,
      discountPercent: cart.coupon.discountPercent,
      discount,
    };
  }

  const total = parseFloat((subtotal - discount).toFixed(2));

  return {
    _id: cart._id,
    items: cart.items,
    itemCount: cart.itemCount, // virtual from Cart model
    subtotal,
    coupon: couponDetails,
    discount,
    total,
  };
};

// ─────────────────────────────────────────────
//  GET CART
//  @route  GET /api/v1/cart
//  @access Private
//  Returns the user's cart. If no cart exists
//  yet, returns an empty cart shape so the
//  frontend doesn't need to handle null.
// ─────────────────────────────────────────────
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });

  // Return empty cart if user hasn't added anything yet
  if (!cart) {
    return res.status(200).json(
      new ApiResponse(200, {
        items: [],
        itemCount: 0,
        subtotal: 0,
        coupon: null,
        discount: 0,
        total: 0,
      }, "Cart is empty")
    );
  }

  const cartData = await buildCartResponse(cart);
  res.status(200).json(new ApiResponse(200, cartData, "Cart fetched"));
});

// ─────────────────────────────────────────────
//  ADD ITEM TO CART
//  @route  POST /api/v1/cart/items
//  @access Private
//
//  Body: { productId, qty }
//
//  Logic:
//  - If product already in cart → increase qty
//  - If new product → add as new item
//  - Checks stock before adding
// ─────────────────────────────────────────────
export const addItem = asyncHandler(async (req, res) => {
  const { productId, qty = 1 } = req.body;

  // Verify product exists and has enough stock
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  if (product.stock < qty) {
    throw new ApiError(400, `Only ${product.stock} unit(s) available in stock`);
  }

  // Find or create cart for this user
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Check if product already exists in cart
  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    // Check combined qty doesn't exceed stock
    const newQty = existingItem.qty + qty;
    if (product.stock < newQty) {
      throw new ApiError(
        400,
        `Cannot add ${qty} more. Only ${product.stock - existingItem.qty} unit(s) can be added`
      );
    }
    existingItem.qty = newQty;
  } else {
    // Add as new cart item — snapshot product details
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.images[ 0 ]?.url || "",
      price: product.discountPrice > 0 ? product.discountPrice : product.price,
      qty,
    });
  }

  await cart.save();
  const cartData = await buildCartResponse(cart);
  res.status(200).json(new ApiResponse(200, cartData, "Item added to cart"));
});

// ─────────────────────────────────────────────
//  UPDATE ITEM QUANTITY
//  @route  PATCH /api/v1/cart/items/:itemId
//  @access Private
//
//  Body: { qty }
//  qty must be >= 1 (use DELETE to remove item)
// ─────────────────────────────────────────────
export const updateItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.id(itemId); // Mongoose subdocument lookup by _id
  if (!item) throw new ApiError(404, "Item not found in cart");

  // Verify stock for the new quantity
  const product = await Product.findById(item.product);
  if (product && product.stock < qty) {
    throw new ApiError(400, `Only ${product.stock} unit(s) available in stock`);
  }

  item.qty = qty;
  await cart.save();

  const cartData = await buildCartResponse(cart);
  res.status(200).json(new ApiResponse(200, cartData, "Cart item updated"));
});

// ─────────────────────────────────────────────
//  REMOVE ITEM FROM CART
//  @route  DELETE /api/v1/cart/items/:itemId
//  @access Private
// ─────────────────────────────────────────────
export const removeItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, "Item not found in cart");

  item.deleteOne(); // remove subdocument
  await cart.save();

  const cartData = await buildCartResponse(cart);
  res.status(200).json(new ApiResponse(200, cartData, "Item removed from cart"));
});

// ─────────────────────────────────────────────
//  CLEAR ENTIRE CART
//  @route  DELETE /api/v1/cart
//  @access Private
//  Used after a successful order is placed
// ─────────────────────────────────────────────
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = [];
  cart.coupon = null;
  await cart.save();

  res.status(200).json(new ApiResponse(200, {
    items: [],
    itemCount: 0,
    subtotal: 0,
    coupon: null,
    discount: 0,
    total: 0,
  }, "Cart cleared"));
});

// ─────────────────────────────────────────────
//  APPLY COUPON
//  @route  POST /api/v1/cart/apply-coupon
//  @access Private
//
//  Body: { code }
//  Validates coupon against current cart subtotal
//  then attaches it to the cart document.
// ─────────────────────────────────────────────
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");
  if (cart.items.length === 0) throw new ApiError(400, "Cannot apply coupon to an empty cart");

  // Find coupon by code (always uppercase)
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new ApiError(404, "Invalid coupon code");

  // Use the validate() instance method from Coupon model
  const { valid, message } = coupon.isValid(cart.subtotal);
  if (!valid) throw new ApiError(400, message);

  cart.coupon = coupon._id;
  await cart.save();

  const cartData = await buildCartResponse(cart);
  res.status(200).json(new ApiResponse(200, cartData, `Coupon "${coupon.code}" applied — ${coupon.discountPercent}% off`));
});

// ─────────────────────────────────────────────
//  REMOVE COUPON
//  @route  DELETE /api/v1/cart/coupon
//  @access Private
// ─────────────────────────────────────────────
export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.coupon = null;
  await cart.save();

  const cartData = await buildCartResponse(cart);
  res.status(200).json(new ApiResponse(200, cartData, "Coupon removed"));
});
