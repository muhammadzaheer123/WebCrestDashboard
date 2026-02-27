"use client";

import React, { createContext, useEffect, useMemo, useState } from "react";
import type { PolicyState } from "@/types/policy";

type PolicyCtx = {
  state: PolicyState | null;
  setState: React.Dispatch<React.SetStateAction<PolicyState | null>>;
  loading: boolean;
  dirty: boolean;
  savedAt: number | null;
  save: () => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const PolicyContext = createContext<PolicyCtx | null>(null);

export function PolicyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PolicyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverSnapshot, setServerSnapshot] = useState<string>("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/policies/adjustments", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load policy");
      const data = (await res.json()) as PolicyState;
      setState(data);
      setServerSnapshot(JSON.stringify(data));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const dirty = useMemo(() => {
    if (!state) return false;
    return JSON.stringify(state) !== serverSnapshot;
  }, [state, serverSnapshot]);

  async function save() {
    if (!state) return;
    const res = await fetch("/api/policies/adjustments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!res.ok) throw new Error("Failed to save policy");
    const saved = (await res.json()) as PolicyState;
    setState(saved);
    setServerSnapshot(JSON.stringify(saved));
    setSavedAt(Date.now());
  }

  async function reset() {
    const res = await fetch("/api/policies/adjustments/reset", {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to reset policy");
    const saved = (await res.json()) as PolicyState;
    setState(saved);
    setServerSnapshot(JSON.stringify(saved));
    setSavedAt(Date.now());
  }

  return (
    <PolicyContext.Provider
      value={{ state, setState, loading, dirty, savedAt, save, reset, refresh }}
    >
      {children}
    </PolicyContext.Provider>
  );
}
