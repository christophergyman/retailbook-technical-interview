'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message || 'Registration failed');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Account</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Sign up to start trading pre-IPO shares.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue focus:ring-1 focus:ring-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue focus:ring-1 focus:ring-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue focus:ring-1 focus:ring-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">At least 8 characters</p>
        </div>

        {error && (
          <div className="rounded-md bg-red/10 px-3 py-2 text-sm text-red dark:bg-red/20">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-md bg-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue/90 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-blue hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
