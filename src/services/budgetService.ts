import { Types } from "mongoose";
import { ExpenseModel } from "../models/Expense.js"
import { BudgetModel } from "../models/Budget.js";

export interface MetricComparison {
  improved: boolean;
  changePercent: number;
}

export interface MonthComparison {
  totalIncome: MetricComparison;
  totalExpenses: MetricComparison; // true = spent less than last month (positive)
  netSavings: MetricComparison;
  savingsRate: MetricComparison;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  totalBalance: number;
  savingsRate: number;
  vsLastMonth: MonthComparison | null; // null if no last month data exists
}

export const calculateBudgetSpent = async (
  categoryId: Types.ObjectId,
  month: number,
  year: number,
  userFilter: { guestId: string } | { userId: string } 
): Promise<number> => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const expenses = await ExpenseModel.find({
    ...userFilter,
    categoryId,
    date: { $gte: start, $lt: end },
  });


  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

const copyRecurringBudgets = async (userFilter: any, month: number, year: number) => {
  const recurringBudgets = await BudgetModel.find({ ...userFilter, recurring: true });
  
  for (const b of recurringBudgets) {
    // Skip if budget already exists for that month
    const exists = await BudgetModel.findOne({
      ...userFilter,
      categoryId: b.categoryId,
      month,
      year
    });
    if (!exists) {
      await BudgetModel.create({
        ...userFilter,
        categoryId: b.categoryId,
        limit: b.limit,
        month,
        year,
        recurring: true
      });
    }
  }
};

const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current === 0 ? 0 : current > 0 ? 100 : -100;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export const calculateFinancialSummary = async (
  month: number,
  year: number,
  userFilter: { guestId: string } | { userId: string }
): Promise<FinancialSummary> => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  await copyRecurringBudgets(userFilter, month, year);

  // Last month (handles January → December of previous year)
  const lastMonthDate = new Date(year, month - 2, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthStart = new Date(lastMonthYear, lastMonth - 1, 1);
  const lastMonthEnd = new Date(lastMonthYear, lastMonth, 1);

  const [budgets, expenses, lastMonthBudgets, lastMonthExpenses] =
    await Promise.all([
      BudgetModel.find({ ...userFilter, month, year }),
      ExpenseModel.find({ ...userFilter, date: { $gte: start, $lt: end } }),
      BudgetModel.find({ ...userFilter, month: lastMonth, year: lastMonthYear }),
      ExpenseModel.find({
        ...userFilter,
        date: { $gte: lastMonthStart, $lt: lastMonthEnd },
      }),
    ]);

  // Current month
  const totalIncome = budgets.reduce((total, b) => total + b.limit, 0);
  const totalExpenses = expenses.reduce((total, e) => total + e.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const totalBalance = netSavings;
  const savingsRate =
    totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Last month
  const hasLastMonthData =
    lastMonthBudgets.length > 0 || lastMonthExpenses.length > 0;

  let vsLastMonth: MonthComparison | null = null;

  if (hasLastMonthData) {
    const lastIncome = lastMonthBudgets.reduce((total, b) => total + b.limit, 0);
    const lastExpenses = lastMonthExpenses.reduce((total, e) => total + e.amount, 0);
    const lastNetSavings = lastIncome - lastExpenses;
    const lastSavingsRate =
      lastIncome > 0 ? Math.round((lastNetSavings / lastIncome) * 100) : 0;

    vsLastMonth = {
      totalIncome: {
        improved: totalIncome >= lastIncome,
        changePercent: calculatePercentChange(totalIncome, lastIncome),
      },
      totalExpenses: {
        improved: totalExpenses <= lastExpenses, // spending less is positive
        changePercent: calculatePercentChange(totalExpenses, lastExpenses),
      },
      netSavings: {
        improved: netSavings >= lastNetSavings,
        changePercent: calculatePercentChange(netSavings, lastNetSavings),
      },
      savingsRate: {
        improved: savingsRate >= lastSavingsRate,
        changePercent: calculatePercentChange(savingsRate, lastSavingsRate),
      },
    };
  }

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    totalBalance,
    savingsRate,
    vsLastMonth,
  };
};