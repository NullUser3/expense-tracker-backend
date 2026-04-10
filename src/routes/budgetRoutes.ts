import express from "express";
import { createBudget, deleteBudget, updateBudget, getBudgets } from "../controllers/budgetController.js";
import protect from "../middleware/protect.js";

const budgetRoutes = express.Router();

budgetRoutes.post("/", protect, createBudget);
budgetRoutes.get("/", protect, getBudgets);
budgetRoutes.delete("/:budgetId", protect, deleteBudget);
budgetRoutes.put("/:budgetId", protect, updateBudget);

export default budgetRoutes;