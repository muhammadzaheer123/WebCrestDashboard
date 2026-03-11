import "server-only";
import { redirect } from "next/navigation";
import { getAuthUser } from "./auth";

export async function requireRole(roles: string[]) {
  const user = await getAuthUser();

  if (!user) redirect("/login");

  if (!roles.includes(user.role)) {
    redirect("/attendance");
  }

  return user;
}
