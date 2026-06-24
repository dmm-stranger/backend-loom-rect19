import mongoose from "mongoose";

// ─────────────────────────────────────────────
//  WISHLIST SCHEMA
//  One wishlist per user (enforced by unique index).
//  Stores only product references — full product
//  details are populated on read so the wishlist
//  always shows current prices and images.
// ─────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one wishlist per user
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
