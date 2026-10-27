"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGate from "../../../components/AuthGate";
import AccountMenu from "../../../components/AccountMenu";
import AccountProfile from "../../../components/AccountProfile";
import { apiRequest } from "../../../lib/api";

function AdminContent() {
  const [instructors, setInstructors] = useState([]);
  const [email, setEmail] = useState("");
  const [invitation, setInvitation] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminInvitation, setAdminInvitation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() { try { setInstructors(await apiRequest("/auth/admin/instructors")); } catch (err) { setError(err.message); } }
  useEffect(() => {
    apiRequest("/auth/admin/instructors").then(setInstructors).catch((err) => setError(err.message));
  }, []);
  async function approve(accountId) {
    setError(""); setMessage("");
    try { await apiRequest(`/auth/admin/instructors/${encodeURIComponent(accountId)}/approve`, { method: "POST" }); setMessage("Instructor approved."); await load(); }
    catch (err) { setError(err.message); }
  }
  async function invite(event) {
    event.preventDefault(); setError(""); setInvitation("");
    try { const result = await apiRequest("/auth/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); setInvitation(result.invitation); setEmail(""); }
    catch (err) { setError(err.message); }
  }
  async function inviteAdmin(event) {
    event.preventDefault(); setError(""); setAdminInvitation("");
    try {
      const result = await apiRequest("/auth/admin/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: adminEmail }) });
      setAdminInvitation(result.invitation); setAdminEmail("");
    } catch (err) { setError(err.message); }
  }
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-5xl">
    <header className="flex items-center justify-between"><div><Link href="/" className="text-sm text-indigo-700">Course catalog</Link><h1 className="mt-2 text-3xl font-bold">Administrator dashboard</h1></div><AccountMenu /></header>
    <AccountProfile />
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{message && <p role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-green-800">{message}</p>}
    <section className="mt-7 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Instructor applications</h2><div className="mt-4 divide-y">{instructors.map((item) => <div key={item.account_id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{item.instructor_name} <span className="text-sm text-slate-500">({item.status})</span></p><p className="text-sm text-slate-600">{item.email}{item.specialization ? ` · ${item.specialization}` : ""}</p></div>{item.status === "pending" && <button onClick={() => approve(item.account_id)} className="rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white">Approve</button>}</div>)}{instructors.length === 0 && <p className="py-4 text-slate-600">No instructor accounts yet.</p>}</div></section>
    <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Invite an instructor</h2><p className="mt-1 text-sm text-slate-600">The one-time invitation expires after 7 days.</p><form onSubmit={invite} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={100} placeholder="instructor@example.com" className="min-w-0 flex-1 rounded-lg border p-3"/><button className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white">Create invitation</button></form>{invitation && <div className="mt-4 rounded-lg bg-indigo-50 p-4"><p className="text-sm font-medium">Copy this private invitation link:</p><input readOnly value={invitation} className="mt-2 w-full rounded border bg-white p-2 text-sm" onFocus={(e) => e.target.select()} /></div>}</section>
    <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Invite an administrator</h2><p className="mt-1 text-sm text-slate-600">Only administrators can create invitations. The link expires after 7 days and can be used once.</p><form onSubmit={inviteAdmin} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required maxLength={100} placeholder="admin@example.com" className="min-w-0 flex-1 rounded-lg border p-3"/><button className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white">Create invitation</button></form>{adminInvitation && <div className="mt-4 rounded-lg bg-indigo-50 p-4"><p className="text-sm font-medium">Share this private administrator invitation link:</p><input readOnly value={adminInvitation} className="mt-2 w-full rounded border bg-white p-2 text-sm" onFocus={(e) => e.target.select()} /></div>}</section>
    <Link href="/admin/courses" className="mt-6 inline-block rounded-lg border bg-white px-5 py-3 font-semibold">Manage courses</Link>
  </div></main>;
}

export default function AdminDashboard() { return <AuthGate roles={["admin"]}><AdminContent /></AuthGate>; }
