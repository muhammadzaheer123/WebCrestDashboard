import { requireRole } from "@/lib/server/roleGuard";
import React from "react";

export default async function page() {
  const authUser = await requireRole(["admin", "hr"]);
  return <div>page</div>;
}
