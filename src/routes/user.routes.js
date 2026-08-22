import express from "express";
import { updateProfile, getAddresses, addAddress, updateAddress, deleteAddress } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();
router.use(protect);
router.patch("/profile", upload.single("image"), updateProfile);
router.get("/addresses", getAddresses);
router.post("/addresses", addAddress);
router.patch("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);
export default router;
