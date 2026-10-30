"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = await apiRequest("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const dashboardPaths = {
        student: "/student/dashboard",
        instructor: "/instructor/dashboard",
        admin: "/admin/dashboard",
      };
      router.replace(dashboardPaths[user.role] || "/");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <main className="app-page flex items-center justify-center"><div className="panel w-full max-w-md p-7 sm:p-9">
    <Link href="/" className="text-sm font-semibold text-indigo-700 no-underline hover:text-indigo-900">← Course catalog</Link>
    <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Welcome back</p>
    <h1 className="page-title mt-2">Sign in</h1>
    <p className="subtle-copy mt-2 leading-6">Use your student, instructor, or administrator account.</p>
    {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Email<input type="email" autoComplete="username" required maxLength={100} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button disabled={busy} className="w-full rounded-xl bg-indigo-700 p-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className="mt-5 text-sm text-slate-600">New student or instructor? <Link href="/signup" className="font-semibold text-indigo-700">Create an account</Link></p>
  </div></main>;
}
