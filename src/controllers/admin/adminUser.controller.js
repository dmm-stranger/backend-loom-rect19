import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import User from "../../models/User.model.js";

// @desc    Get all users (admin)
// @route   GET /api/v1/admin/users
// @access  Admin
//
// Supported query params:
//   page   → page number (default: 1)
//   limit  → users per page (default: 20)
//   role   → filter by "customer" or "admin"
//   search → search by name or email
export const getAllUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  // Search by name or email using regex
  if (req.query.search) {
    filter.$or = [
      { name:  { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password"), // never return hashed password
    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    }, "Users fetched")
  );
});

// @desc    Update user role (admin)
// @route   PATCH /api/v1/admin/users/:id/role
// @access  Admin
//
// Promotes customer → admin or demotes admin → customer
// Admin cannot change their own role (prevents accidental lockout)
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const validRoles = ["customer", "admin"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  // Prevent admin from changing their own role
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "You cannot change your own role");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  user.role = role;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    }, `User role updated to "${role}"`)
  );
});
