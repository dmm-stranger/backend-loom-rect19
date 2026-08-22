import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/User.model.js";
import { uploadImage, getImageUrl, deleteImage } from "../middleware/upload.middleware.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  const { name } = req.body;
  if (name) user.name = name;
  if (req.file) {
    await deleteImage(user.avatar?.url);
    if (uploadImage) {
      user.avatar = await uploadImage(req.file.buffer, "techstore/avatars");
    } else {
      user.avatar = { url: getImageUrl(req.file.filename), public_id: req.file.filename };
    }
  }
  await user.save();
  res.status(200).json(new ApiResponse(200, {
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar?.url || null, role: user.role },
  }, "Profile updated successfully"));
});

export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, { addresses: user.addresses }, "Addresses fetched"));
});

export const addAddress = asyncHandler(async (req, res) => {
  const { label, line1, city, state, postalCode, country, isDefault } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.addresses.length >= 5) throw new ApiError(400, "Maximum of 5 addresses allowed.");
  if (isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  user.addresses.push({ label: label || "Home", line1, city, state, postalCode, country, isDefault: isDefault || user.addresses.length === 0 });
  await user.save();
  res.status(201).json(new ApiResponse(201, { addresses: user.addresses }, "Address added"));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, "Address not found");
  const { label, line1, city, state, postalCode, country, isDefault } = req.body;
  if (label      !== undefined) address.label      = label;
  if (line1      !== undefined) address.line1      = line1;
  if (city       !== undefined) address.city       = city;
  if (state      !== undefined) address.state      = state;
  if (postalCode !== undefined) address.postalCode = postalCode;
  if (country    !== undefined) address.country    = country;
  if (isDefault) { user.addresses.forEach((a) => { a.isDefault = false; }); address.isDefault = true; }
  await user.save();
  res.status(200).json(new ApiResponse(200, { addresses: user.addresses }, "Address updated"));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, "Address not found");
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
  await user.save();
  res.status(200).json(new ApiResponse(200, { addresses: user.addresses }, "Address deleted"));
});

// @desc    Permanently delete the logged-in user's own account
// @route   DELETE /api/v1/users/account
// @access  Private
//
// Requires the current password as confirmation (body: { password }) so a
// hijacked session token alone can't be used to destroy the account.
// Clears the auth cookie afterward since the account no longer exists.
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new ApiError(400, "Password is required to delete your account");

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  if (!(await user.matchPassword(password))) {
    throw new ApiError(401, "Incorrect password");
  }

  await deleteImage(user.avatar?.url);
  await user.deleteOne();

  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });

  res.status(200).json(new ApiResponse(200, null, "Account deleted successfully"));
});
