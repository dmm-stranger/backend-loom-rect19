import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import generateToken from "../utils/generateToken.js";
import User from "../models/User.model.js";
import sendEmail, { passwordResetTemplate, passwordChangedTemplate } from "../utils/sendEmail.js";

/**
 * Shapes a User document into the object the frontend authSlice expects:
 *   { id, name, email, avatar, role }
 */
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar?.url || null,
  role: user.role,
});

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({ name, email, password });

  const token = generateToken(res, user._id);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: formatUser(user), token },
        "Registration successful"
      )
    );
});

// @desc    Login user & set token cookie
// @route   POST /api/v1/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has `select: false` on the schema, so explicitly include it
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(res, user._id);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: formatUser(user), token },
        "Login successful"
      )
    );
});

// @desc    Logout user & clear token cookie
// @route   POST /api/v1/auth/logout
// @access  Private
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });

  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

// @desc    Get current authenticated user's profile
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the `protect` middleware
  res
    .status(200)
    .json(new ApiResponse(200, { user: formatUser(req.user) }, "Current user"));
});

// @desc    Request a password reset email
// @route   POST /api/v1/auth/forgot-password
// @access  Public
//
// Always responds with the same generic message whether or not the email
// exists, so this endpoint can't be used to enumerate registered accounts.
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const genericResponse = () =>
    res.status(200).json(
      new ApiResponse(200, null, "If an account with that email exists, a reset link has been sent")
    );

  const user = await User.findOne({ email });
  if (!user) return genericResponse();

  // Raw token goes in the email link; only its SHA-256 hash is stored,
  // mirroring how the password itself is never stored in plain text.
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/auth/reset-password/${rawToken}`;

  try {
    const { subject, html } = passwordResetTemplate(user.name, resetUrl);
    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    // Don't leak email-sending failures to the client — roll back the
    // token so a broken SMTP config can't leave a valid token stranded.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send reset email. Please try again later.");
  }

  return genericResponse();
});

// @desc    Reset password using the token emailed to the user
// @route   PATCH /api/v1/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    throw new ApiError(400, "Reset link is invalid or has expired");
  }

  user.password = password; // re-hashed by the pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(res, user._id);

  res.status(200).json(
    new ApiResponse(200, { user: formatUser(user), token }, "Password reset successful")
  );
});

// @desc    Change password while logged in
// @route   PATCH /api/v1/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword; // re-hashed by the pre-save hook
  await user.save();

  // Best-effort notification email — don't fail the request if SMTP is down.
  try {
    const { subject, html } = passwordChangedTemplate(user.name);
    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    // Intentionally swallowed — password change already succeeded.
  }

  res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});
