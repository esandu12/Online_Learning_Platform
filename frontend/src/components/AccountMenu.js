"use client";

import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";

export default function AccountMenu() {
  const router = useRouter();
  async function signOut() {
    try { await apiRequest("/auth/logout", { method: "POST" }); } finally { router.replace("/login"); }
  }
  return <button onClick={signOut} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Sign out</button>;
}
