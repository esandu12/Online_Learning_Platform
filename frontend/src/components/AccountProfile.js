"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function AccountProfile() {
  const [user, setUser] = useState(null);
  useEffect(() => { apiRequest("/auth/me").then(({ user: current }) => setUser(current)).catch(() => {}); }, []);
  if (!user) return null;
  return <section aria-label="Your profile" className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold">Your profile</h2>
    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{user.name || "—"}</dd></div>
      <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
    </dl>
  </section>;
}
