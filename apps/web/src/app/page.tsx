'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.push('/dashboard');
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        Pre-IPO Trading Dashboard
      </h1>
      <p className="mt-4 max-w-md text-lg text-slate-500">
        Browse upcoming IPO offers and manage your investment orders through a streamlined pipeline.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/offers"
          className="rounded-md bg-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue/90"
        >
          Browse Offers
        </Link>
        <Link
          href="/auth/login"
          className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
