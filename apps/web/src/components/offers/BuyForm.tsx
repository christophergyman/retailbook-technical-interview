'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import type { Offer } from '@trading/shared';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function BuyForm({ offer }: { offer: Offer }) {
  const router = useRouter();
  const { data: session } = useSession();
  const createOrder = useCreateOrder();
  const [shares, setShares] = useState(1);
  const [error, setError] = useState('');

  const totalCost = shares * offer.pricePerShare;
  const isClosed = offer.status === 'closed';
  const noShares = offer.availableShares === 0;
  const disabled = isClosed || noShares;

  if (!session?.user) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-400">Sign in to place an order</p>
        <a
          href="/auth/login"
          className="mt-2 inline-block text-sm font-medium text-blue hover:underline"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="font-medium text-slate-500 dark:text-slate-400">
          {isClosed ? 'This offer is closed' : 'Fully Subscribed'}
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (shares < 1 || shares > offer.availableShares) {
      setError(`Enter between 1 and ${offer.availableShares.toLocaleString()} shares`);
      return;
    }

    try {
      await createOrder.mutateAsync({ offerId: offer.id, sharesRequested: shares });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
    >
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Place Order</h3>
      <div className="mt-4">
        <label htmlFor="shares" className="block text-sm text-slate-600 dark:text-slate-400">
          Number of Shares
        </label>
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShares((s) => Math.max(1, s - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            -
          </button>
          <input
            id="shares"
            type="number"
            min={1}
            max={offer.availableShares}
            value={shares}
            onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-9 w-24 rounded-md border border-slate-200 px-3 text-center text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => setShares((s) => Math.min(offer.availableShares, s + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-700">
        <span className="text-slate-500 dark:text-slate-400">
          {shares.toLocaleString()} shares x {formatCurrency(offer.pricePerShare)} ={' '}
        </span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(totalCost)}
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-red">{error}</p>}

      <button
        type="submit"
        disabled={createOrder.isPending}
        className="mt-4 flex w-full items-center justify-center rounded-md bg-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue/90 disabled:opacity-50"
      >
        {createOrder.isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          'Place Order'
        )}
      </button>
    </form>
  );
}
