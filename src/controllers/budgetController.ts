import type { Request, Response, NextFunction } from "express";
import { BudgetModel } from "../models/Budget.js";
import { CategoryModel } from "../models/Category.js";
import { Types } from "mongoose";
import { calculateBudgetSpent } from "../services/budgetService.js";
import { ExpenseModel } from "../models/Expense.js";
import type { RequestUser } from "../middleware/protect.js";

export const createBudget = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as RequestUser;

    const { categoryId, limit, month, year, recurring } = req.body;

    const monthNum = Number(month);
    const yearNum = Number(year);
    const limitNum = Number(limit);
    const isRecurring = recurring === true || recurring === "true";

    if (!categoryId || !limitNum || !monthNum || !yearNum) {
      return res
        .status(400)
        .json({ message: "categoryId, limit, month, and year are required" });
    }

    if (monthNum < 1 || monthNum > 12) {
      return res
        .status(400)
        .json({ message: "month must be between 1 and 12" });
    }

    if (limitNum <= 0) {
      return res.status(400).json({ message: "limit must be greater than 0" });
    }

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const category = await CategoryModel.findOne({
      _id: categoryId,
      ...userFilter,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const existing = await BudgetModel.findOne({
      categoryId,
      month: monthNum,
      year: yearNum,
      ...userFilter,
    });

    if (existing) {
      return res.status(409).json({
        message:
          "A budget for this category, month, and year already exists",
      });
    }

    const budget = await BudgetModel.create({
      categoryId,
      limit: limitNum,
      month: monthNum,
      year: yearNum,
      recurring: isRecurring,
      ...userFilter,
    });

    return res
      .status(201)
      .json({ message: "Budget created successfully", budget });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const deleteBudget = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as RequestUser;

    const budgetIdParam = req.params.budgetId as string;
    if (!budgetIdParam) {
      return res.status(400).json({ message: "Budget ID is required" });
    }

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const budget = await BudgetModel.findOne({
      _id: budgetIdParam,
      ...userFilter,
    });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const start = new Date(budget.year, budget.month - 1, 1);
    const end = new Date(budget.year, budget.month, 1);

    // Delete all expenses tied to this budget's category in the same month/year
    await ExpenseModel.deleteMany({
      ...userFilter,
      categoryId: budget.categoryId,
      date: { $gte: start, $lt: end },
    });

    await BudgetModel.findByIdAndDelete(budget._id);

    return res.status(200).json({ message: "Budget and related expenses deleted successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const updateBudget = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as RequestUser;

    const budgetIdParam = req.params.budgetId as string;
    if (!budgetIdParam) {
      return res.status(400).json({ message: "Budget ID is required" });
    }

    const budgetId = new Types.ObjectId(budgetIdParam);
    const { limit, month, year, categoryId ,recurring} = req.body;

    const userFilter = user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const budget = await BudgetModel.findOne({ _id: budgetId, ...userFilter });

    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    if (recurring !== undefined) {
  budget.recurring = recurring === true || recurring === "true";
}

    if (limit !== undefined && limit <= 0) {
      return res.status(400).json({ message: "limit must be greater than 0" });
    }

    if (month !== undefined && (month < 1 || month > 12)) {
      return res.status(400).json({ message: "month must be between 1 and 12" });
    }

    // If changing categoryId, ensure new category belongs to user/guest
    if (categoryId && categoryId.toString() !== budget.categoryId.toString()) {
      const category = await CategoryModel.findOne({ _id: categoryId, ...userFilter });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      budget.categoryId = categoryId;
    }

    const newMonth = month ?? budget.month;
    const newYear = year ?? budget.year;
    const newCategoryId = categoryId ?? budget.categoryId;

    const duplicate = await BudgetModel.findOne({
      _id: { $ne: budgetId },
      ...userFilter,
      categoryId: newCategoryId,
      month: newMonth,
      year: newYear,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "A budget for this category, month, and year already exists",
      });
    }

    if (limit !== undefined) budget.limit = limit;
    if (month !== undefined) budget.month = month;
    if (year !== undefined) budget.year = year;

    const updatedBudget = await budget.save();

    return res.status(200).json({ message: "Budget updated successfully", budget: updatedBudget });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const getBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as RequestUser;

    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const budgets = await BudgetModel.find({ ...userFilter, month, year }).populate(
      "categoryId",
      "name"
    );

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const categoryId = (budget.categoryId as any)._id || budget.categoryId;
        const categoryName = (budget.categoryId as any).name || "Unknown";

        const spent = await calculateBudgetSpent(
          categoryId,
          month,
          year,
          userFilter
        );

        return {
          _id: budget._id,
          categoryId,
          categoryName,
          limit: budget.limit,
          month: budget.month,
          year: budget.year,
          recurring: budget.recurring,
          spent,
        };
      })
    );

    return res.status(200).json({ budgets: budgetsWithSpent });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};