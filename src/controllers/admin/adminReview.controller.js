import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import Review from "../../models/Review.model.js";

export const getAllReviews = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;
  const filter = {};
  if (req.query.rating)  filter.rating  = Number(req.query.rating);
  if (req.query.product) filter.product = req.query.product;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user",    "name email avatar")
      .populate("product", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      reviews,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    }, "Reviews fetched")
  );
});

export const deleteReviewAdmin = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");
  await review.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Review deleted successfully"));
});
