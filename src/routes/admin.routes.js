import express from "express";
import { getDashboardStats } from "../controllers/admin/adminDashboard.controller.js";
import {
  getAllOrders,
  updateOrderStatus,
} from "../controllers/admin/adminOrder.controller.js";
import { getAllProductsAdmin } from "../controllers/admin/adminProduct.controller.js";
import {
  getAllUsers,
  updateUserRole,
} from "../controllers/admin/adminUser.controller.js";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/admin/adminCoupon.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
//  GLOBAL MIDDLEWARE
//  Every admin route requires:
//  1. Valid JWT (protect)
//  2. Admin role (authorize)
//  Applied once here — no need to repeat on each route
// ─────────────────────────────────────────────
router.use(protect);
router.use(authorize("admin"));

// ─────────────────────────────────────────────
//  DASHBOARD
//  GET /api/v1/admin/dashboard/stats
// ─────────────────────────────────────────────
router.get("/dashboard/stats", getDashboardStats);

// ─────────────────────────────────────────────
//  ORDERS
//  GET   /api/v1/admin/orders
//  PATCH /api/v1/admin/orders/:id/status
// ─────────────────────────────────────────────
router.get("/orders", getAllOrders);
router.patch("/orders/:id/status", updateOrderStatus);

// ─────────────────────────────────────────────
//  PRODUCTS
//  GET /api/v1/admin/products
//  Note: Create/Update/Delete are on the public
//  product router with admin protection already:
//  POST   /api/v1/products       (admin only)
//  PUT    /api/v1/products/:id   (admin only)
//  DELETE /api/v1/products/:id   (admin only)
// ─────────────────────────────────────────────
router.get("/products", getAllProductsAdmin);

// ─────────────────────────────────────────────
//  USERS
//  GET   /api/v1/admin/users
//  PATCH /api/v1/admin/users/:id/role
// ─────────────────────────────────────────────
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);

// ─────────────────────────────────────────────
//  COUPONS
//  GET    /api/v1/admin/coupons
//  POST   /api/v1/admin/coupons
//  PATCH  /api/v1/admin/coupons/:id
//  DELETE /api/v1/admin/coupons/:id
// ─────────────────────────────────────────────
router.get("/coupons", getAllCoupons);
router.post("/coupons", createCoupon);
router.patch("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

export default router;
