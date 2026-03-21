import express from "express";
import { getMe, login, logout, register } from "../controllers/userController.js";
import protect from "../middleware/protect.js";

const userRoutes = express.Router();

userRoutes.post("/register",register);
userRoutes.post("/login", login);
userRoutes.post("/logout", logout);
userRoutes.get("/me", protect, getMe);

export default userRoutes;