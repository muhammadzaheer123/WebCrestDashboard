import User from "../models/user.model";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set");

export function signToken(
  payload: object,
  expiresIn: string | number = "1h"
): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn } as SignOptions);
}

const SignupSchema = z
  .object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z
      .string()
      .min(6)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Weak password"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signupUser(req: Request, res: Response) {
  try {
    const { name, email, password } = await SignupSchema.parseAsync(req.body);

    if (!name || !email || !password) {
      return res.status(400).send({ messgae: "All fields are required!" });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    const token = signToken({ sub: user._id, email: user.email });

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
      message: "Signup successful",
    });
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = await LoginSchema.parseAsync(req.body);

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ sub: user._id, email: user.email });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
      message: "Login successful",
    });
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
