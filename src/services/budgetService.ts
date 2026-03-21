import { Types } from "mongoose";
import { ExpenseModel } from "../models/Expense.js"

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