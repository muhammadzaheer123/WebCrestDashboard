import jwt, { SignOptions } from "jsonwebtoken";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET not set in .env.local");
  }

  return secret;
}

export function signToken(
  payload: object,
  expiresIn: string | number = "1h",
): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  } as SignOptions);
}
