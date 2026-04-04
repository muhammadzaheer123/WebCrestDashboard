import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../jwt";

export type AuthUser = {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "hr" | "employee";
  id?: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}
