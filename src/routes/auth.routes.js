import express from "express";
import { registerUser, loginUser, logoutUser, getMe } from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import validate from "../middleware/validate.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();
router.post("/register", authLimiter, registerValidator, validate, registerUser);
router.post("/login",    authLimiter, loginValidator,    validate, loginUser);
router.post("/logout",   protect, logoutUser);
router.get("/me",        protect, getMe);
export default router;
