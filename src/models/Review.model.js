import mongoose from "mongoose";

// ─────────────────────────────────────────────
//  REVIEW SCHEMA
//  One review per user per product (enforced by
//  compound unique index below).
//  After every save/delete the post hook fires
//  and recalculates the product's ratingsAverage
//  and ratingsCount automatically.
// ─────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────
//  COMPOUND UNIQUE INDEX
//  Prevents one user from leaving multiple
//  reviews on the same product.
//  The controller handles updates by finding
//  and modifying the existing review instead.
// ─────────────────────────────────────────────
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// ─────────────────────────────────────────────
//  STATIC METHOD — recalculate product ratings
//  Called after every save and delete.
//  Aggregates all reviews for the product and
//  updates ratingsAverage + ratingsCount on
//  the Product document.
// ─────────────────────────────────────────────
reviewSchema.statics.recalculateRatings = async function (productId) {
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        ratingsAverage: { $avg: "$rating" },
        ratingsCount: { $sum: 1 },
      },
    },
  ]);

  // Import Product here to avoid circular dependency at module load time
  const Product = mongoose.model("Product");

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: result[0].ratingsAverage,
      ratingsCount: result[0].ratingsCount,
    });
  } else {
    // No reviews left — reset to defaults
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsCount: 0,
    });
  }
};

// ─────────────────────────────────────────────
//  HOOKS — trigger recalculation automatically
// ─────────────────────────────────────────────

// After a review is saved (created or updated)
reviewSchema.post("save", async function () {
  await this.constructor.recalculateRatings(this.product);
});

// After a review is deleted via deleteOne()
reviewSchema.post("deleteOne", { document: true, query: false }, async function () {
  await this.constructor.recalculateRatings(this.product);
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
