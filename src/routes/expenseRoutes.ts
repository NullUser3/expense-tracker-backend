import express from "express";
import { createExpense, deleteExpense, updateExpense, getExpenses, getBudgets, getYearBudgets, getSummary, getSummaryHistory, getCategoryTotals } from "../controllers/expenseController.js";
import protect from "../middleware/protect.js";

const expenseRoutes = express.Router();

expenseRoutes.post("/", protect, createExpense);
expenseRoutes.get("/", protect, getExpenses);
expenseRoutes.get("/getBudgets",protect,getBudgets);
expenseRoutes.get("/getYearSummary",protect,getYearBudgets);
expenseRoutes.delete("/:expenseId", protect, deleteExpense);
expenseRoutes.put("/:expenseId", protect, updateExpense);
expenseRoutes.get("/getSummary",protect,getSummary);
expenseRoutes.get("/summaryHistory", protect, getSummaryHistory);
expenseRoutes.get("/categoryTotals", protect, getCategoryTotals);

export default expenseRoutes;