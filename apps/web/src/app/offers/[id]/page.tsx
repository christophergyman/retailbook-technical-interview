'use client';

import { use } from 'react';
import Link from 'next/link';
import { useOffer } from '@/hooks/useOffer';
import { BuyForm } from '@/components/offers/BuyForm';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: offer, isLoading, error } = useOffer(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 text-center">
        <p className="text-slate-500">Offer not found.</p>
        <Link href="/offers" className="mt-2 inline-block text-sm text-blue hover:underline">
          Back to Offers
        </Link>
      </div>
    );
  }

  if (!offer) return null;

  const pct = Math.round((offer.availableShares / offer.totalShares) * 100);

  return (
    <div>
      <Link href="/offers" className="text-sm text-slate-500 hover:text-slate-700">
        &larr; Back to Offers
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{offer.companyName}</h1>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-600">
                {offer.ticker}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  offer.status === 'open'
                    ? 'bg-emerald/10 text-emerald'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {offer.status === 'open' ? 'Open' : 'Closed'}
              </span>
            </div>

            <p className="mt-3 text-slate-600">{offer.description}</p>

            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Price/Share</p>
                <p className="text-lg font-semibold">{formatCurrency(offer.pricePerShare)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Shares</p>
                <p className="text-lg font-semibold">{formatNumber(offer.totalShares)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Available</p>
                <p className="text-lg font-semibold">{formatNumber(offer.availableShares)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">IPO Date</p>
                <p className="text-lg font-semibold">{offer.ipoDate}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Availability</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-500">Sector: {offer.sector}</div>
          </div>
        </div>

        <div>
          <BuyForm offer={offer} />
        </div>
      </div>
    </div>
  );
}
