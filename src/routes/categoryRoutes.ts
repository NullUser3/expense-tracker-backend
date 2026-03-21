import express from "express";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../controllers/categoryController.js";
import protect from "../middleware/protect.js";

const categoryRoutes = express.Router();

categoryRoutes.post("/", protect, createCategory);
categoryRoutes.get("/", protect, getCategories);
categoryRoutes.delete("/:categoryId", protect, deleteCategory);
categoryRoutes.put("/:categoryId", protect, updateCategory);

export default categoryRoutes;