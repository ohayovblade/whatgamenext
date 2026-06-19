import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

// AC-12 / AC-13: /login form; single generic error on failure; redirect to
// /dashboard on success. Discord-style dark theme.

// Shared input styling (Discord-like dark field).
const inputClass =
  'w-full rounded-[3px] bg-[#1e1f22] px-3 py-2.5 text-white outline-none ' +
  'border border-transparent focus:border-[#00a8fc] transition-colors';
const labelClass =
  'text-xs font-bold uppercase tracking-wide text-[#b5bac1]';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push('/dashboard');
      return;
    }

    // AC-10: one generic message — never reveal which field was wrong.
    setError('Invalid email or password.');
    setSubmitting(false);
  }

  return (
    <main className="auth-gradient flex min-h-screen items-center justify-center p-4">
      <div className="animate-card-in w-full max-w-[480px] rounded-md bg-[#313338] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Welcome back!</h1>
          <p className="mt-1 text-[#b5bac1]">We&apos;re so excited to see you again!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className={labelClass}>
                Email <span className="text-[#f23f42]">*</span>
              </span>
              <input
                type="email"
                data-testid="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>
                Password <span className="text-[#f23f42]">*</span>
              </span>
              <input
                type="password"
                data-testid="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
              {/* Discord shows this beneath the password field. No reset flow yet. */}
              <Link href="/login" className="mt-0.5 text-sm text-[#00a8fc] hover:underline">
                Forgot your password?
              </Link>
            </label>

            {error && (
              <p data-testid="login-error" className="text-sm text-[#fa777c]">
                {error}
              </p>
            )}

            <button
              type="submit"
              data-testid="login-submit"
              disabled={submitting}
              className="rounded-[3px] bg-[#5865F2] py-2.5 font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
            >
              {submitting ? 'Logging in…' : 'Log In'}
            </button>

            <p className="text-sm text-[#949ba4]">
              Need an account?{' '}
              <Link href="/signup" className="text-[#00a8fc] hover:underline">
                Register
              </Link>
            </p>
          </form>
      </div>
    </main>
  );
}
