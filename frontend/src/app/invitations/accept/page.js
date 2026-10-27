"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "../../../lib/api";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", specialization: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) { setError("Invitation link is missing its token."); setBusy(false); return; }
    try {
      await apiRequest("/auth/invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, token }) });
      router.push("/dashboard/instructor");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900"><div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm">
    <Link href="/" className="text-sm text-indigo-700">← Course catalog</Link><h1 className="mt-5 text-3xl font-bold">Accept instructor invitation</h1>
    <p className="mt-2 text-slate-600">Set your name and password to activate the invited instructor account.</p>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Full name<input name="name" required maxLength={100} value={form.name} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Specialization (optional)<input name="specialization" maxLength={100} value={form.specialization} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Password (12 characters minimum)<input type="password" name="password" required minLength={12} maxLength={128} value={form.password} onChange={change} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button disabled={busy} className="w-full rounded-lg bg-indigo-700 p-3 font-semibold text-white disabled:opacity-60">{busy ? "Activating…" : "Accept invitation"}</button>
    </form>
  </div></main>;
}
