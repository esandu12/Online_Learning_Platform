"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "../../lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ firstName: "", lastName: "", birthDate: "", name: "", specialization: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const endpoint = role === "student" ? "/auth/students/signup" : "/auth/instructors/signup";
      const body = role === "student"
        ? { firstName: form.firstName, lastName: form.lastName, birthDate: form.birthDate, email: form.email, password: form.password }
        : { name: form.name, specialization: form.specialization, email: form.email, password: form.password };
      await apiRequest(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (role === "student") router.push("/dashboard/student");
      else router.push("/signup/pending");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <main className="app-page"><div className="panel mx-auto max-w-xl p-7 sm:p-9">
    <Link href="/" className="text-sm font-semibold text-indigo-700 no-underline hover:text-indigo-900">← Course catalog</Link>
    <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Join LearnSpace</p>
    <h1 className="page-title mt-2">Create an account</h1>
    <p className="subtle-copy mt-2 leading-6">Administrators are created separately and cannot register here.</p>
    <label className="mt-6 block text-sm font-semibold text-slate-700">Account type<select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full px-3.5 py-3"><option value="student">Student</option><option value="instructor">Instructor</option></select></label>
    {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
    <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
      {role === "student" ? <>
        <label className="text-sm font-medium">First name<input name="firstName" required maxLength={50} value={form.firstName} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="text-sm font-medium">Last name<input name="lastName" required maxLength={50} value={form.lastName} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="text-sm font-medium sm:col-span-2">Date of birth<input type="date" name="birthDate" required value={form.birthDate} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
      </> : <>
        <label className="text-sm font-medium sm:col-span-2">Full name<input name="name" required maxLength={100} value={form.name} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="text-sm font-medium sm:col-span-2">Specialization (optional)<input name="specialization" maxLength={100} value={form.specialization} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
      </>}
      <label className="text-sm font-medium sm:col-span-2">Email<input type="email" name="email" autoComplete="email" required maxLength={100} value={form.email} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="text-sm font-medium sm:col-span-2">Password (12 characters minimum)<input type="password" name="password" autoComplete="new-password" required minLength={12} maxLength={128} value={form.password} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button disabled={busy} className="rounded-xl bg-indigo-700 p-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:opacity-60 sm:col-span-2">{busy ? "Creating account…" : role === "student" ? "Create student account" : "Apply as instructor"}</button>
    </form>
    <p className="mt-5 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-indigo-700">Sign in</Link></p>
  </div></main>;
}
