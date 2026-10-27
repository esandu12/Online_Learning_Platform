import Link from "next/link";

export default function InstructorPendingPage() {
  return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900"><section className="mx-auto max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
    <Link href="/" className="text-sm text-indigo-700">← Course catalog</Link>
    <h1 className="mt-5 text-3xl font-bold">Application submitted</h1>
    <p className="mt-3 text-slate-600">Your instructor account is pending administrator approval. You can sign in with the same email and password after it is approved.</p>
    <Link href="/login" className="mt-6 inline-block rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white">Go to sign in</Link>
  </section></main>;
}
