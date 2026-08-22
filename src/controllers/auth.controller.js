import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import generateToken from "../utils/generateToken.js";
import User from "../models/User.model.js";

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
