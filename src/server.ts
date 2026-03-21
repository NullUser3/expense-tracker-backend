import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./connect.js";
import userRoutes from "./routes/userRoutes.js";
import protect from "./middleware/protect.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import cron from "node-cron";
import { deleteGuestData } from "./services/userService.js";

dotenv.config();

const app = express();

connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use("/api/users",userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/expenses", expenseRoutes);

app.get("/api/init", protect, (req, res) => {
  res.status(200).json({ user: req.user });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
    cron.schedule("0 * * * *", () => {
    deleteGuestData().catch(err => console.error("Guest cleanup error:", err));
    console.log("Guest cleanup cron scheduled: runs every hour");
  });
});
