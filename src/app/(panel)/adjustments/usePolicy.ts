"use client";
import { useContext } from "react";
import { PolicyContext } from "./PolicyProvider";

export function usePolicy() {
  const ctx = useContext(PolicyContext);
  if (!ctx) throw new Error("usePolicy must be used inside <PolicyProvider />");
  return ctx;
}
