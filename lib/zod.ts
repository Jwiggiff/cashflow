import { boolean, enum as enum_, number, object, string } from "zod";

export const authSchema = object({
  username: string({ required_error: "Username is required" })
    .min(1, "Username is required")
    .min(3, "Username must be more than 3 characters")
    .max(32, "Username must be less than 32 characters"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export const profileSchema = object({
  username: string()
    .min(3, "Username must be more than 3 characters")
    .max(32, "Username must be less than 32 characters")
    .optional(),
  name: string().max(100, "Name is too long").optional(),
  email: string().email("Invalid email address").optional(),
});

export const createTransactionSchema = object({
  description: string().min(1, "Description is required"),
  type: enum_(["INCOME", "EXPENSE"]),
  categoryId: number().nullable().optional(),
  amount: number().positive("Amount must be positive"),
  account: string().min(1, "Account name is required"),
  date: string().datetime().optional(),
  autoCategorize: boolean().optional(),
});
