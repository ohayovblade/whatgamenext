import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

// AC-8: /signup form (email, password, optional name) with inline server errors.
// Discord-style dark theme.

const inputClass =
  'w-full rounded-[3px] bg-[#1e1f22] px-3 py-2.5 text-white outline-none ' +
  'border border-transparent focus:border-[#00a8fc] transition-colors';
const labelClass =
  'text-xs font-bold uppercase tracking-wide text-[#b5bac1]';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? 'Something went wrong.');
      setSubmitting(false);
      return;
    }

    // On success, sign the user in and send them to the dashboard (AC-13 flow).
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.ok) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }

  return (
    <main className="auth-gradient flex min-h-screen items-center justify-center p-4">
      <div className="animate-card-in w-full max-w-[480px] rounded-md bg-[#313338] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Create an account</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>
              Email <span className="text-[#f23f42]">*</span>
            </span>
            <input
              type="email"
              data-testid="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className={labelClass}>Display Name</span>
            <input
              type="text"
              data-testid="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className={labelClass}>
              Password <span className="text-[#f23f42]">*</span>
            </span>
            <input
              type="password"
              data-testid="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
            <span className="text-xs text-[#949ba4]">At least 8 characters.</span>
          </label>

          {error && (
            <p data-testid="signup-error" className="text-sm text-[#fa777c]">
              {error}
            </p>
          )}

          <button
            type="submit"
            data-testid="signup-submit"
            disabled={submitting}
            className="rounded-[3px] bg-[#5865F2] py-2.5 font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Continue'}
          </button>

          <p className="text-sm text-[#949ba4]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#00a8fc] hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
