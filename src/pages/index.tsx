import Link from 'next/link';

// Landing page — reachable by visitors (AC: visitors can see landing/login/signup).
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">WhatGameNext</h1>
      <p className="text-slate-600">
        Track your video-game backlog. Sign up or log in to get started.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
