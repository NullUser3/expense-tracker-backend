import type { Request, Response, NextFunction } from "express";
import { BudgetModel } from "../models/Budget.js";
import { CategoryModel } from "../models/Category.js";
import { Types } from "mongoose";

export const createBudget = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    const { categoryId, limit, month, year } = req.body;

    if (!categoryId || !limit || !month || !year) {
      return res
        .status(400)
        .json({ message: "categoryId, limit, month, and year are required" });
    }

    if (month < 1 || month > 12) {
      return res
        .status(400)
        .json({ message: "month must be between 1 and 12" });
    }

    if (limit <= 0) {
      return res.status(400).json({ message: "limit must be greater than 0" });
    }
    // Build user filter based on role
    const userFilter = user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    // Ensure the category exists and belongs to the user/guest
    const category = await CategoryModel.findOne({ _id: categoryId, ...userFilter });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if budget already exists
    const existing = await BudgetModel.findOne({
      categoryId,
      month,
      year,
      ...userFilter,
    });
    if (existing) {
      return res.status(409).json({
        message: "A budget for this category, month, and year already exists",
      });
    }

    // Create budget
    const budget = await BudgetModel.create({
      categoryId,
      limit,
      month,
      year,
      ...userFilter, // sets either userId or guestId
    });

    return res.status(201).json({ message: "Budget created successfully", budget });
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
    const user = req.user;

    const budgetIdParam = req.params.budgetId as string;
    if (!budgetIdParam) {
      return res.status(400).json({ message: "Budget ID is required" });
    }

    const userFilter = user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const budget = await BudgetModel.findOne({ _id: budgetIdParam, ...userFilter });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    await BudgetModel.findByIdAndDelete(budget._id);

    return res.status(200).json({ message: "Budget deleted successfully" });
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
    const user = req.user;

    const budgetIdParam = req.params.budgetId as string;
    if (!budgetIdParam) {
      return res.status(400).json({ message: "Budget ID is required" });
    }

    const budgetId = new Types.ObjectId(budgetIdParam);
    const { limit, month, year, categoryId } = req.body;

    const userFilter = user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const budget = await BudgetModel.findOne({ _id: budgetId, ...userFilter });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
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