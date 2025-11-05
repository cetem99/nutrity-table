import express from "express";
import {
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all profile routes; controllers use req.userId
router.get("/", protect, getProfile);
router.put("/", protect, updateProfile);
router.put("/password", protect, updatePassword);
router.delete("/", protect, deleteAccount);

export default router;
