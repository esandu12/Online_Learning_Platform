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

  return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900"><div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm">
    <Link href="/" className="text-sm text-indigo-700">← Course catalog</Link>
    <h1 className="mt-5 text-3xl font-bold">Sign in</h1>
    <p className="mt-2 text-slate-600">Use your student, instructor, or administrator account.</p>
    {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Email<input type="email" autoComplete="username" required maxLength={100} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button disabled={busy} className="w-full rounded-lg bg-indigo-700 p-3 font-semibold text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className="mt-5 text-sm text-slate-600">New student or instructor? <Link href="/signup" className="font-semibold text-indigo-700">Create an account</Link></p>
  </div></main>;
}
