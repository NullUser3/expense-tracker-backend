import mongoose, { Document, Types } from "mongoose";
import type { Budget } from "../types/models.js";

export interface BudgetDocument extends Budget, Document {}

const budgetSchema = new mongoose.Schema<BudgetDocument>({
  userId: { type: Types.ObjectId, ref: "User", required: false },
  guestId: { type: String, required: false },
  categoryId: { type: Types.ObjectId, ref: "Category", required: true },
  limit: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
});

budgetSchema.index({ categoryId: 1, month: 1, year: 1, userId: 1 }, { unique: true });

export const BudgetModel = mongoose.model<BudgetDocument>("Budget", budgetSchema);