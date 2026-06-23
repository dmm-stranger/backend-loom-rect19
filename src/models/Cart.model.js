import mongoose from "mongoose";

// ─────────────────────────────────────────────
//  CART ITEM SUB-SCHEMA
//  We snapshot name, price and image at the time
//  the item is added. This way if the product is
//  updated or deleted, the cart still displays
//  correct info to the user.
// ─────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String, // stores the /uploads/filename.jpg URL
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    qty: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
  },
  { _id: true } // each item gets its own _id (used in PATCH/DELETE /:itemId)
);

// ─────────────────────────────────────────────
//  CART SCHEMA
//  One cart per user (enforced by unique index).
//  Totals are calculated on every read via a
//  virtual — never stored in DB so they stay
//  accurate even if prices change.
// ─────────────────────────────────────────────
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user
    },
    items: [cartItemSchema],
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },   // include virtuals when sending JSON response
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────
//  VIRTUALS — calculated totals (not stored in DB)
// ─────────────────────────────────────────────

// Total number of items in cart (sum of all quantities)
cartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});

// Subtotal before any discount
cartSchema.virtual("subtotal").get(function () {
  return parseFloat(
    this.items.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2)
  );
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
