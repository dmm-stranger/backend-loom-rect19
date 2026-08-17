import express from "express";
import { getDashboardStats, getTopCustomers, getSalesByCategory } from "../controllers/admin/adminDashboard.controller.js";
import { getAllOrders, getOrderAdmin, updateOrderStatus, deleteOrder } from "../controllers/admin/adminOrder.controller.js";
import { getAllProductsAdmin, getProductAdmin, toggleFeatured, updateStock } from "../controllers/admin/adminProduct.controller.js";
import { getAllUsers, getUserAdmin, updateUserRole, deleteUser, banUser } from "../controllers/admin/adminUser.controller.js";
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from "../controllers/admin/adminCoupon.controller.js";
import { getAllReviews, deleteReviewAdmin } from "../controllers/admin/adminReview.controller.js";
import { getSettings, updateSettings } from "../controllers/admin/adminSettings.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/top-customers", getTopCustomers);
router.get("/dashboard/sales-by-category", getSalesByCategory);

// Orders
router.get("/orders",              getAllOrders);
router.get("/orders/:id",          getOrderAdmin);
router.patch("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id",       deleteOrder);

// Products
router.get("/products",                getAllProductsAdmin);
router.get("/products/:id",            getProductAdmin);
router.patch("/products/:id/featured", toggleFeatured);
router.patch("/products/:id/stock",    updateStock);

// Users
router.get("/users",             getAllUsers);
router.get("/users/:id",         getUserAdmin);
router.patch("/users/:id/role",  updateUserRole);
router.patch("/users/:id/ban",   banUser);
router.delete("/users/:id",      deleteUser);

// Coupons
router.get("/coupons",        getAllCoupons);
router.post("/coupons",       createCoupon);
router.patch("/coupons/:id",  updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

// Reviews
router.get("/reviews",        getAllReviews);
router.delete("/reviews/:id", deleteReviewAdmin);

// Settings
router.get("/settings",   getSettings);
router.patch("/settings", updateSettings);

export default router;
