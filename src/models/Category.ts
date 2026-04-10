import mongoose, { Document, Types } from "mongoose";
import type { Category } from "../types/models.js";

export interface CategoryDocument extends Category, Document {}

const categorySchema = new mongoose.Schema<CategoryDocument>({
  userId: { type: Types.ObjectId, ref: "User", required: false },
  guestId: { type: String, required: false },
  name: { type: String, required: true, trim: true },
  color: { type: String },
  icon: { type: String },
},{timestamps:true});

export const CategoryModel = mongoose.model<CategoryDocument>("Category", categorySchema);