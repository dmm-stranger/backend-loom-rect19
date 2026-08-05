import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import User from "../../models/User.model.js";
import Order from "../../models/Order.model.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name:  { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password"),
    User.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, { users, pagination: { total, page, pages: Math.ceil(total/limit), limit } }, "Users fetched"));
});

export const getUserAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).select("totalPrice orderStatus paymentInfo createdAt items");
  const totalSpent = orders.filter((o) => o.paymentInfo.status === "paid").reduce((sum, o) => sum + o.totalPrice, 0);
  res.status(200).json(new ApiResponse(200, { user, orders, stats: { totalOrders: orders.length, totalSpent: parseFloat(totalSpent.toFixed(2)) } }, "User fetched"));
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ["customer","admin"];
  if (!validRoles.includes(role)) throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(", ")}`);
  if (req.params.id === req.user._id.toString()) throw new ApiError(400, "You cannot change your own role");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  user.role = role;
  await user.save();
  res.status(200).json(new ApiResponse(200, { user: { id: user._id, name: user.name, email: user.email, role: user.role } }, `User role updated to "${role}"`));
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) throw new ApiError(400, "You cannot delete your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(400, "Cannot delete an admin account. Demote to customer first.");
  await user.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

export const banUser = asyncHandler(async (req, res) => {
  const { isBanned } = req.body;
  if (isBanned === undefined) throw new ApiError(400, "isBanned field is required (true or false)");
  if (req.params.id === req.user._id.toString()) throw new ApiError(400, "You cannot ban your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(400, "Cannot ban an admin account");
  user.isBanned = isBanned;
  await user.save();
  res.status(200).json(new ApiResponse(200, { user: { id: user._id, name: user.name, email: user.email, role: user.role, isBanned: user.isBanned } }, `User ${isBanned ? "banned" : "unbanned"} successfully`));
});
