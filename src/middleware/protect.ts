import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.js";

type GuestUser = {
  _id: string;
  name: string;
  currency: string;
  role: "guest";
};

type AuthUser = {
  _id: string;
  name: string;
  email: string;
  currency: string;
  role: "user";
  avatar?:string;
};

export type RequestUser = GuestUser | AuthUser;

export type JwtPayload = {
  id: string;
  role: "user" | "guest";
  currency: string;
  iat: number;
  exp: number;
};

const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ") &&
        req.headers.authorization.split(" ")[1]);

    if (!token) {
      // No token → create guest JWT
      const guestId = "guest_" + Date.now();
      const guestPayload = {
        id: guestId,
        role: "guest" as const,
        currency: "USD", // default
      };
      token = jwt.sign(guestPayload, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      });
      req.user = {
        _id: guestId,
        name: guestId,
        currency: "USD",
        role: "guest",
      };
      return next();
    }

    // Verify existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded.role === "guest") {
      req.user = {
        _id: decoded.id,
        name: decoded.id,
        currency: decoded.currency,
        role: "guest",
      };
      return next();
    }

    // Logged-in user → fetch from DB
    const user = await UserModel.findById(decoded.id).select("-passwordHash");
    if (!user) return next(new Error("User not found"));

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      currency: user.currency,
      avatar:user.avatar,
      role: "user",
    };

    next();
  } catch (error) {
    next(new Error("Token invalid or expired"));
  }
};

export default protect;
