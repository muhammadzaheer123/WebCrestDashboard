import React from "react";
import { requireRole } from "@/lib/server/roleGuard";
import PayrollClient from "./PayrollClient";

export default async function PayrollPage() {
  await requireRole(["admin", "hr", "employee"]);

  return <PayrollClient />;
}
