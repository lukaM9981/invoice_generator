import { z } from "zod";

const emailField = z
  .email({ error: "Enter a valid email address." })
  .trim()
  .max(254, { error: "Email address is too long." });

// Supabase hashes with bcrypt, which silently truncates past 72 bytes.
const passwordField = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })
  .max(72, { error: "Password must be at most 72 characters." });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: "Enter your password." }),
});

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
