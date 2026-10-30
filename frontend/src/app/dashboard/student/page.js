import Link from "next/link";
import AuthGate from "../../../components/AuthGate";
import AccountMenu from "../../../components/AccountMenu";
import AccountProfile from "../../../components/AccountProfile";

export default function StudentDashboard() {
  return <AuthGate roles={["student"]}><main className="app-page"><div className="app-container">
    <header className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><Link href="/" className="text-sm font-semibold text-indigo-700 no-underline">← Course catalog</Link><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Your learning space</p><h1 className="page-title mt-2">Student dashboard</h1><p className="subtle-copy mt-2">Keep your courses and next steps in one place.</p></div><AccountMenu /></header>
    <AccountProfile />
    <section className="panel mt-7"><h2 className="section-title">Your learning</h2><p className="subtle-copy mt-2">See your courses and choose another course to study.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/my-enrollments" className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-indigo-800">My enrollments</Link><Link href="/" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 no-underline hover:bg-indigo-50/50">Browse courses</Link></div></section>
  </div></main></AuthGate>;
}
