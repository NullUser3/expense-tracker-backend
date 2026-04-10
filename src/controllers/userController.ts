import type { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

interface JwtPayload {
  id: string;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, passwordHash } = req.body;

  try {
    if (!email || !passwordHash) {
      return res
        .status(400)
        .json({ message: "email, and password are required" });
    }

    const emailFound = await UserModel.findOne({ email });

    if (emailFound) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = await UserModel.create({ name, email, passwordHash });

    const { passwordHash: _, ...safeUser } = user.toObject();

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set!");
    }


    const payload = { id: user.id, role: "user" as const };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "user registered succesfully",
      safeUser,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash!);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set!");
    }

    const payload = { id: user.id, role: "user" as const };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...safeUser } = user.toObject();



    return res.status(200).json({
      message: "logged in successfully",
      safeUser,
    });
    
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({ message: "logged out successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};


// export const loginAsGuest = async (req: Request, res: Response) => {
//   try {
//     if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set!");

//     const guestId = "guest_" + Date.now();
//     const token = jwt.sign(
//       { id: guestId, role: "guest" as const },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//       maxAge: 1 * 24 * 60 * 60 * 1000,
//     });

//     return res.status(200).json({ message: "guest session started" });
//   } catch (error: any) {
//     return res.status(500).json({ message: error.message || "An unexpected error occurred" });
//   }
// };

export const getMe = async (req: Request, res: Response) => {
  
try {
    if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }


  return res.status(200).json({ user: req.user, token: req.token });
} catch (error:any) {
      return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
}
};




export const changeCurrency = async (req: Request, res: Response) => {

  try {
    const { currency } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!currency) {
      return res.status(400).json({ message: "No currency selected" });
    }

    const user = req.user;


    if (user.role === "guest") {
      const payload = {
        id: user._id,
        role: "guest" as const,
        currency,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      });

      return res.json({ currency });
    }


    if (user.role === "user") {
      await UserModel.findByIdAndUpdate(user._id, { currency });

      return res.json({ currency });
    }

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};