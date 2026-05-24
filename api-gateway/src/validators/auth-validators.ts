import { z } from "zod";

export const loginRequestDTO = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, "password is required"),
});
export const signupRequestDTO = z.object({
  username: z.string().min(1, "username is required"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, "password is required"),
});
