import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import Order from "../../models/Order.model.js";

export const getAllOrders = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;
  const filter = {};
  if (req.query.status)        filter.orderStatus          = req.query.status;
  if (req.query.paymentStatus) filter["paymentInfo.status"] = req.query.paymentStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter).populate("user","name email").sort({ createdAt: -1 }).skip(skip).limit(limit).select("-__v"),
    Order.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, { orders, pagination: { total, page, pages: Math.ceil(total/limit), limit } }, "Orders fetched"));
});

export const getOrderAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user","name email avatar");
  if (!order) throw new ApiError(404, "Order not found");
  res.status(200).json(new ApiResponse(200, { order }, "Order fetched"));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["processing","shipped","delivered","cancelled"];
  if (!validStatuses.includes(status)) throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.orderStatus === "delivered") throw new ApiError(400, "Cannot update a delivered order");
  if (order.orderStatus === "cancelled") throw new ApiError(400, "Cannot update a cancelled order");
  order.orderStatus = status;
  if (status === "delivered") order.deliveredAt = new Date();
  await order.save();
  await order.populate("user","name email");
  res.status(200).json(new ApiResponse(200, { order }, `Order status updated to "${status}"`));
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.orderStatus !== "cancelled") throw new ApiError(400, `Cannot delete an order with status "${order.orderStatus}". Only cancelled orders can be deleted.`);
  await order.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Order deleted successfully"));
});
