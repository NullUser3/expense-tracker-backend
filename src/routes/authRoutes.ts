import express from "express";
import passport from "../passport.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * 1. Start Google OAuth
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * 2. Google OAuth callback
 *    → Generate JWT
 *    → Redirect to frontend with token
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;

    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
        currency: user.currency || "USD",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    if (!process.env.FRONTEND_URL) {
      throw new Error("FRONTEND_URL is not defined");
    }

    // Redirect to frontend callback page with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;

    return res.redirect(redirectUrl);
  }
);

/**
 * 3. Set cookie from frontend (IMPORTANT STEP)
 *    → This replaces insecure OAuth cookie setting
 */
router.post("/set-cookie", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({ message: "Cookie set successfully" });
});

/**
 * 4. Logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json({ message: "Logged out successfully" });
});

export default router;