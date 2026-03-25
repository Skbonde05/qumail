import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 *  GET USER PROFILE
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        role: "user",
        isVerified: true,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        settings: user.settings || {
          emailNotifications: true,
          autoSaveDrafts: true,
          twoFactorEnabled: false,
          signature: "",
          timezone: "UTC"
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Profile fetch failed" });
  }
});

/**
 *  UPLOAD AVATAR (Base64)
 * POST /api/profile/upload-avatar
 */
router.post("/upload-avatar", authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: "Avatar image is required"
      });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.avatar = avatar;
    await user.save();

    res.json({
      success: true,
      avatar: user.avatar
    });

  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to upload avatar"
    });
  }
});

/**
 *  UPDATE PROFILE (name, email)
 */
router.post("/update", authMiddleware, async (req, res) => {
  const { name, email } = req.body;

  try {
    await User.findByIdAndUpdate(req.user.id, {
      name,
      email
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Profile update failed" });
  }
});

/**
 *  UPDATE SETTINGS
 */
router.post("/settings", authMiddleware, async (req, res) => {
  const { settings } = req.body;

  try {
    await User.findByIdAndUpdate(req.user.id, {
      settings
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Settings update failed" });
  }
});

/**
 *  CHANGE PASSWORD
 */
router.post("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Wrong password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password change failed" });
  }
});

export default router;
