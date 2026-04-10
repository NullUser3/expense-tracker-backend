import type { Request, Response, NextFunction } from "express";
import { ExpenseModel } from "../models/Expense.js";
import { CategoryModel } from "../models/Category.js";
import { calculateBudgetSpent, calculateFinancialSummary } from "../services/budgetService.js";
import { BudgetModel } from "../models/Budget.js";

export const createExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    const { amount, categoryId, description, date } = req.body;

    if (!amount || !date) {
      return res.status(400).json({ message: "amount and date are required" });
    }

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    if (categoryId) {
      const category = await CategoryModel.findOne({
        _id: categoryId,
        ...userFilter,
      });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    const expense = await ExpenseModel.create({
      ...userFilter,
      amount,
      categoryId: categoryId || null,
      description,
      date: new Date(date),
    });

    return res
      .status(201)
      .json({ message: "Expense created successfully", expense });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const deleteExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    const expenseIdParam = req.params.expenseId as string;
    if (!expenseIdParam) {
      return res.status(400).json({ message: "Expense ID is required" });
    }

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const expense = await ExpenseModel.findOne({
      _id: expenseIdParam,
      ...userFilter,
    });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await ExpenseModel.findByIdAndDelete(expense._id);

    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const updateExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    const expenseIdParam = req.params.expenseId as string;
    if (!expenseIdParam) {
      return res.status(400).json({ message: "Expense ID is required" });
    }

    const { amount, categoryId, description, date } = req.body;

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const expense = await ExpenseModel.findOne({
      _id: expenseIdParam,
      ...userFilter,
    });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (
      categoryId &&
      categoryId.toString() !== expense.categoryId?.toString()
    ) {
      const category = await CategoryModel.findOne({
        _id: categoryId,
        ...userFilter,
      });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      expense.categoryId = categoryId;
    }

    if (amount !== undefined) expense.amount = amount;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = new Date(date);

    const updatedExpense = await expense.save();

    return res
      .status(200)
      .json({
        message: "Expense updated successfully",
        expense: updatedExpense,
      });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    const { categoryId, month, year } = req.query;

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const filter: any = { ...userFilter };

    if (categoryId) filter.categoryId = categoryId;

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      filter.date = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const expenses = await ExpenseModel.find(filter).sort({ date: -1 });

    return res.status(200).json({ expenses });
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
    const user = req.user;

    const { month, year }: any = req.query;

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const budgets = await BudgetModel.find({ ...userFilter, month, year }).populate('categoryId', 'name');

    const calculateAll = await Promise.all(
      budgets.map(async (budget) => {
        const categoryId = (budget.categoryId as any)._id || budget.categoryId;
        const categoryName = (budget.categoryId as any).name || "Unknown";

        const spent = await calculateBudgetSpent(
          categoryId,
          budget.month,
          budget.year,
          userFilter,
        );

        return {
          ...budget.toObject(),
          categoryName,
          spent,
          remainingBudget: budget.limit + spent,
        };
      }),
    );
    return res.status(200).json({ budgets: calculateAll });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const getYearBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    const { year }: any = req.query;

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const budgets = await BudgetModel.find({ ...userFilter, year });

    const calculateAll = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateBudgetSpent(
          budget.categoryId,
          budget.month,
          budget.year,
          userFilter,
        );

        return {
          month: budget.month,
          year: budget.year,
          spent,
          limit:budget.limit,
          remainingBudget: budget.limit + spent,
        };
      }),
    );
    return res.status(200).json({ Budgets: calculateAll });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};



export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    // Convert query params to numbers
    const month = Number(req.query.month); // 1-12
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const summary = await calculateFinancialSummary(month, year, userFilter);

    return res.status(200).json(summary);

  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
}

export const getSummaryHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;
 
    // Default to last 6 months if not specified
    const months = Math.min(Number(req.query.months) || 6, 12);
 
    if (isNaN(months) || months < 1) {
      return res.status(400).json({ message: "Invalid months parameter" });
    }
 
    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };
 
    const now = new Date();
 
    // Build array of { month, year } pairs going back N months from current
    const monthYearPairs = Array.from({ length: months }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return { month: date.getMonth() + 1, year: date.getFullYear() };
    });
 
    const history = await Promise.all(
      monthYearPairs.map(async ({ month, year }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
 
        const [budgets, expenses] = await Promise.all([
          BudgetModel.find({ ...userFilter, month, year }),
          ExpenseModel.find({ ...userFilter, date: { $gte: start, $lt: end } }),
        ]);
 
        const totalIncome = budgets.reduce((sum, b) => sum + b.limit, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
 
        return {
          month,
          year,
          label: new Date(year, month - 1, 1).toLocaleString("default", { month: "short" }),
          income: totalIncome,
          expenses: totalExpenses,
          netSavings: totalIncome - totalExpenses,
        };
      }),
    );
 
    return res.status(200).json({ history });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const getCategoryTotals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const userFilter =
      user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const expenses = await ExpenseModel.find({
      ...userFilter,
      date: { $gte: start, $lt: end },
    });

    const totals: Record<string, number> = {};
    expenses.forEach((expense) => {
      if (expense.categoryId) {
        const catId = expense.categoryId.toString();
        totals[catId] = (totals[catId] || 0) + expense.amount;
      }
    });

    return res.status(200).json({ totals });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

