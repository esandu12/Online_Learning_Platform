"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "../../../../lib/api";

export default function AcceptAdminInvitationPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) return setError("This invitation link is missing its token.");
    if (password !== confirmation) return setError("The passwords do not match.");
    setBusy(true);
    try {
      await apiRequest("/auth/admin/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      router.replace("/dashboard/admin");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900"><section className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm">
    <Link href="/" className="text-sm text-indigo-700">← Course catalog</Link>
    <h1 className="mt-5 text-3xl font-bold">Set up administrator account</h1>
    <p className="mt-2 text-slate-600">Choose a private password to accept this one-time invitation.</p>
    {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Password (12 characters minimum)<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Confirm password<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button disabled={busy} className="w-full rounded-lg bg-indigo-700 p-3 font-semibold text-white disabled:opacity-60">{busy ? "Creating account…" : "Accept invitation"}</button>
    </form>
  </section></main>;
}
