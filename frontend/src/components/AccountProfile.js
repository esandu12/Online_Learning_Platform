"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function AccountProfile() {
  const [user, setUser] = useState(null);
  useEffect(() => { apiRequest("/auth/me").then(({ user: current }) => setUser(current)).catch(() => {}); }, []);
  if (!user) return <section aria-label="Your profile" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" role="status">Loading your profile…</section>;
  return <section aria-label="Your profile" className="panel mt-6">
    <div className="flex items-center gap-3"><span aria-hidden="true" className="grid size-11 place-items-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-800">{(user.name || user.email || "LS").split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("")}</span><div><h2 className="section-title">Your profile</h2><p className="subtle-copy mt-0.5 text-sm">Account details</p></div></div>
    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{user.name || "—"}</dd></div>
      <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
    </dl>
  </section>;
}
