'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';

export function Header() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight">
            TradeFlow
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/offers"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              Offers
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isPending ? (
            <div className="h-4 w-20 animate-pulse rounded bg-slate-600" />
          ) : user ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:inline">{user.name}</span>
              <button
                onClick={async () => {
                  await signOut();
                  router.push('/');
                  router.refresh();
                }}
                className="rounded-md bg-slate-700 px-3 py-1.5 text-sm transition-colors hover:bg-slate-600"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-md bg-blue px-3 py-1.5 text-sm font-medium transition-colors hover:bg-blue/90"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
