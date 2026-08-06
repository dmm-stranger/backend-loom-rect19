import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Notification from "../models/Notification.model.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;
  const filter = { user: req.user._id };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === "true";

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.status(200).json(new ApiResponse(200, { notifications, unreadCount, pagination: { total, page, pages: Math.ceil(total/limit), limit } }, "Notifications fetched"));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, "Notification not found");
  notification.isRead = true;
  await notification.save();
  res.status(200).json(new ApiResponse(200, { notification }, "Notification marked as read"));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, "Notification not found");
  await notification.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Notification deleted"));
});

export const clearReadNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ user: req.user._id, isRead: true });
  res.status(200).json(new ApiResponse(200, { deletedCount: result.deletedCount }, "Read notifications cleared"));
});
