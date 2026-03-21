import { BudgetModel } from "../models/Budget.js";
import { CategoryModel } from "../models/Category.js";
import { ExpenseModel } from "../models/Expense.js";
import { UserModel } from "../models/User.js";

export const deleteGuestData = async () => {
  const dueDate = new Date(Date.now() - 24 * 60 * 60 * 1000);


  const checkCategories = await CategoryModel.find({
    guestId: { $exists: true},
    createdAt: { $lt:  dueDate  },
  });

  for(const cat of checkCategories){
    
    await BudgetModel.deleteMany({categoryId:cat._id});
    await ExpenseModel.deleteMany({categoryId:cat._id});
    await CategoryModel.deleteOne({_id:cat._id});
  }

  console.log(`Deleted ${checkCategories.length} old guest categories and their children`);
};
