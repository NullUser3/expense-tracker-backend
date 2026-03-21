import express from "express";
import { createBudget, deleteBudget, updateBudget } from "../controllers/budgetController.js";
import protect from "../middleware/protect.js";

const budgetRoutes = express.Router();

budgetRoutes.post("/", protect, createBudget);
budgetRoutes.delete("/:budgetId", protect, deleteBudget);
budgetRoutes.put("/:budgetId", protect, updateBudget);

export default budgetRoutes;