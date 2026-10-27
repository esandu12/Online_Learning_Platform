import Link from "next/link";
import AuthGate from "../../../components/AuthGate";
import AccountMenu from "../../../components/AccountMenu";

export default function StudentDashboard() {
  return <AuthGate roles={["student"]}><main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-4xl">
    <header className="flex items-center justify-between"><div><Link href="/" className="text-sm text-indigo-700">Course catalog</Link><h1 className="mt-2 text-3xl font-bold">Student dashboard</h1></div><AccountMenu /></header>
    <section className="mt-8 rounded-2xl border bg-white p-7 shadow-sm"><h2 className="text-xl font-semibold">Your learning</h2><p className="mt-2 text-slate-600">See your courses and choose another course to study.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/my-enrollments" className="rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white">My enrollments</Link><Link href="/" className="rounded-lg border px-4 py-3 font-semibold">Browse courses</Link></div></section>
  </div></main></AuthGate>;
}
