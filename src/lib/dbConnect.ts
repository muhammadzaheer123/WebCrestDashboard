// src/lib/dbConnect.ts
import { connectDB } from "@/lib/db";

export default async function dbConnect() {
  return connectDB();
}
