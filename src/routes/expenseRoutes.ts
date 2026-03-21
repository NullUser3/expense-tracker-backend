import express from "express";
import { createExpense, deleteExpense, updateExpense, getExpenses, getBudgets, getYearBudgets } from "../controllers/expenseController.js";
import protect from "../middleware/protect.js";

const expenseRoutes = express.Router();

expenseRoutes.post("/", protect, createExpense);
expenseRoutes.get("/", protect, getExpenses);
expenseRoutes.get("/getBudgets",protect,getBudgets);
expenseRoutes.get("/getYearSummary",protect,getYearBudgets);
expenseRoutes.delete("/:expenseId", protect, deleteExpense);
expenseRoutes.put("/:expenseId", protect, updateExpense);

export default expenseRoutes;