import type { Request, Response } from "express";
import {
  loginRequestDTO,
  signupRequestDTO,
} from "../validators/auth-validators";
import { sendValidationError } from "../utils/validation";
import { prisma } from "../config/db";
import bcrypt from "bcryptjs";
import { createToken } from "../middlewares/auth-middleware";

export const login = async (req: Request, res: Response) => {
  const parsedBody = loginRequestDTO.safeParse(req.body);
  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }

  const { email, password } = parsedBody.data;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "invalid credentials" });
    }
    const authenticate = await bcrypt.compare(password, user.password);
    if (!authenticate) {
      return res.status(404).json({ error: "invalid credentials" });
    }
    const token = createToken({ userId: user.id.toString() });
    return res.status(200).json({
      success: true,
      token: token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("An error occurred", error);
    return res.status(500).json({
      message: "error",
      error,
    });
  }
};
export const signup = async (req: Request, res: Response) => {
  const parsedBody = signupRequestDTO.safeParse(req.body);
  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }
  const { username, email, password } = parsedBody.data;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const createUser = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });
    const token = createToken({ userId: createUser.id.toString() });
    return res.status(201).json({
      success: true,
      token,
      message: `User has been created successfully.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `There was an error creating user.`,
    });
  }
};
