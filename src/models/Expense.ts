import mongoose, { Document, Types } from "mongoose";
import type { Expense } from "../types/models.js";

export interface ExpenseDocument extends Expense, Document {}

const expenseSchema = new mongoose.Schema<ExpenseDocument>({
  userId: { type: Types.ObjectId, ref: "User", required: false },
  guestId: { type: String, required: false },
  amount: { type: Number, required: true },
  categoryId: { type: Types.ObjectId, ref: "Category" },
  description: { type: String },
  date: { type: Date, required: true },
  
},{ timestamps: true });

export const ExpenseModel = mongoose.model<ExpenseDocument>("Expense", expenseSchema);