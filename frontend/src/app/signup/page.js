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

  return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900"><div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
    <Link href="/" className="text-sm text-indigo-700">← Course catalog</Link>
    <h1 className="mt-5 text-3xl font-bold">Create an account</h1>
    <p className="mt-2 text-slate-600">Administrators are created separately and cannot register here.</p>
    <label className="mt-6 block text-sm font-medium">Account type<select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-3"><option value="student">Student</option><option value="instructor">Instructor</option></select></label>
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
      <button disabled={busy} className="rounded-lg bg-indigo-700 p-3 font-semibold text-white disabled:opacity-60 sm:col-span-2">{busy ? "Creating account…" : role === "student" ? "Create student account" : "Apply as instructor"}</button>
    </form>
    <p className="mt-5 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-indigo-700">Sign in</Link></p>
  </div></main>;
}
