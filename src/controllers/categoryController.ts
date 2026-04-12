import type { Request, Response, NextFunction } from "express";
import { CategoryModel } from "../models/Category.js";
import { ExpenseModel } from "../models/Expense.js";
import { BudgetModel } from "../models/Budget.js";
import type { RequestUser } from "../middleware/protect.js";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, icon, color } = req.body;
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as RequestUser;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const filter = user.role==="guest"?{name,guestId:user._id}:{name,userId:user._id};

    const category = await CategoryModel.findOne(filter);

    if (category) {
      return res
        .status(409)
        .json({ message: "a category with this name exists already" });
    }

     const createdCategory = await CategoryModel.create({
      name,
      color,
      icon,
      ...(user.role === "guest" ? { guestId: user._id } : { userId: user._id }),
    });

    res.status(201).json({
      message: "category created succesfully",
      category: createdCategory,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};


export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as RequestUser;

    const { categoryId } = req.params;
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const userFilter = user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const category = await CategoryModel.findOne({ _id: categoryId, ...userFilter });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Cascade delete
    await ExpenseModel.deleteMany({ categoryId: category._id });
    await BudgetModel.deleteMany({ categoryId: category._id });

    await CategoryModel.findByIdAndDelete(category._id);

    return res.status(200).json({
      message: "Category and all related data deleted successfully",
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as RequestUser;

    const { categoryId } = req.params;
    const { name, icon, color } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const userFilter = user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const category = await CategoryModel.findOne({ _id: categoryId, ...userFilter });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Prevent duplicate category names for this user/guest
    if (name && name !== category.name) {
      const existing = await CategoryModel.findOne({ name, ...userFilter });
      if (existing) {
        return res
          .status(409)
          .json({ message: "A category with this name already exists" });
      }
    }

    if (name !== undefined) category.name = name;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;

    const updatedCategory = await category.save();

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
};


export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as RequestUser;

    const userFilter = user.role === "guest" ? { guestId: user._id } : { userId: user._id };

    const categories = await CategoryModel.find(userFilter);

    return res.status(200).json({categories});
  }

  catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
}