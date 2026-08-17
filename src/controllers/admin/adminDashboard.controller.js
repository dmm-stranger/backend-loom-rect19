import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import Order from "../../models/Order.model.js";
import Product from "../../models/Product.model.js";
import User from "../../models/User.model.js";
import Category from "../../models/Category.model.js";

// @desc    Get admin dashboard stats
// @route   GET /api/v1/admin/dashboard/stats
// @access  Admin
//
// Returns:
//   - totalRevenue    → sum of all paid orders
//   - totalOrders     → count of all orders
//   - totalUsers      → count of all users
//   - totalProducts   → count of all products
//   - ordersByStatus  → breakdown by processing/shipped/delivered/cancelled
//   - revenueByMonth  → last 6 months revenue chart data
//   - topProducts     → top 5 best selling products
//   - recentOrders    → last 5 orders
export const getDashboardStats = asyncHandler(async (req, res) => {

  // ── Run all queries in parallel for performance ──
  const [
    totalRevenue,
    totalOrders,
    totalUsers,
    totalProducts,
    ordersByStatus,
    revenueByMonth,
    topProducts,
    recentOrders,
  ] = await Promise.all([

    // Total revenue from paid orders only
    Order.aggregate([
      { $match: { "paymentInfo.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),

    // Total order count
    Order.countDocuments(),

    // Total user count (customers only)
    User.countDocuments({ role: "customer" }),

    // Total product count
    Product.countDocuments(),

    // Orders grouped by status
    Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]),

    // Revenue per month for the last 6 months
    Order.aggregate([
      {
        $match: {
          "paymentInfo.status": "paid",
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Top 5 best selling products by quantity sold
    Order.aggregate([
      { $match: { "paymentInfo.status": "paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name:       { $first: "$items.name" },
          image:      { $first: "$items.image" },
          totalSold:  { $sum: "$items.qty" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),

    // 5 most recent orders with user details
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .select("user totalPrice orderStatus paymentInfo createdAt"),
  ]);

  // ── Format ordersByStatus into a clean object ──
  const statusBreakdown = {
    processing: 0,
    shipped:    0,
    delivered:  0,
    cancelled:  0,
  };
  ordersByStatus.forEach(({ _id, count }) => {
    if (_id in statusBreakdown) statusBreakdown[_id] = count;
  });

  // ── Format revenueByMonth for frontend charts ──
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formattedRevenue = revenueByMonth.map(({ _id, revenue, orders }) => ({
    month:   `${monthNames[_id.month - 1]} ${_id.year}`,
    revenue: parseFloat(revenue.toFixed(2)),
    orders,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      totalRevenue: totalRevenue[0]?.total
        ? parseFloat(totalRevenue[0].total.toFixed(2))
        : 0,
      totalOrders,
      totalUsers,
      totalProducts,
      ordersByStatus: statusBreakdown,
      revenueByMonth: formattedRevenue,
      topProducts,
      recentOrders,
    }, "Dashboard stats fetched")
  );
});

// @desc    Get top customers ranked by number of orders placed
// @route   GET /api/v1/admin/dashboard/top-customers
// @access  Admin
//
// Query params:
//   - limit (default 5)
export const getTopCustomers = asyncHandler(async (req, res) => {
  const limit = Math.max(1, Number(req.query.limit) || 5);

  const topCustomers = await Order.aggregate([
    {
      $group: {
        _id: "$user",
        ordersCount: { $sum: 1 },
        totalSpent: {
          $sum: {
            $cond: [ { $eq: [ "$paymentInfo.status", "paid" ] }, "$totalPrice", 0 ],
          },
        },
      },
    },
    { $sort: { ordersCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        name: "$user.name",
        email: "$user.email",
        avatar: "$user.avatar.url",
        ordersCount: 1,
        totalSpent: { $round: [ "$totalSpent", 2 ] },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, { topCustomers }, "Top customers fetched")
  );
});

// @desc    Get revenue breakdown grouped by product category
// @route   GET /api/v1/admin/dashboard/sales-by-category
// @access  Admin
//
// Only counts paid orders. Joins order items → products → categories.
export const getSalesByCategory = asyncHandler(async (req, res) => {
  const salesByCategory = await Order.aggregate([
    { $match: { "paymentInfo.status": "paid" } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$productInfo.category",
        revenue: {
          $sum: { $multiply: [ "$items.price", "$items.qty" ] },
        },
        unitsSold: { $sum: "$items.qty" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: "$category._id",
        name: { $ifNull: [ "$category.name", "Uncategorized" ] },
        revenue: { $round: [ "$revenue", 2 ] },
        unitsSold: 1,
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  res.status(200).json(
    new ApiResponse(200, { salesByCategory }, "Sales by category fetched")
  );
});
