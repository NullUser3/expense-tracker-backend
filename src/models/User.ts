import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";
import type { User } from '../types/models.js';

export interface UserDocument extends User, Document {}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema<UserDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: emailRegex,
  },
  passwordHash: {
    type: String,
    required: function() { return !this.googleId },
  },
  googleId: {
    type: String,
    required: false,
  },
  currency: {
    type: String,
    required: true,
    default: "USD",
  },
},{timestamps:true});

userSchema.pre<UserDocument>("save", async function () {
  if (!this.isModified("passwordHash")) return;

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash!, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const UserModel = mongoose.model<UserDocument>("User", userSchema);