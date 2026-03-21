import { Types } from "mongoose";

export interface User {
  _id: Types.ObjectId
  name: string
  email: string
  passwordHash?: string 
  googleId?: string       
  currency: string
  role: "user" | "guest"
  createdAt: Date
}

export interface Expense {
  _id: Types.ObjectId
  userId: Types.ObjectId
  guestId:string
  amount: number
  categoryId?: Types.ObjectId
  description?: string
  date: Date
}

export interface Category {
  _id: Types.ObjectId
  userId: Types.ObjectId
  guestId:string
  name: string
  color?: string
  icon?: string
}

export interface Budget {
  _id: Types.ObjectId
  userId: Types.ObjectId
  guestId:string
  categoryId: Types.ObjectId
  limit: number
  month: number
  year: number
}
