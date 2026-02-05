'use client';

import { useOffers } from '@/hooks/useOffers';
import { OfferCard } from '@/components/offers/OfferCard';

export default function OffersPage() {
  const { data: offers, isLoading, error } = useOffers();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Open Offers</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Browse upcoming IPO opportunities
      </p>

      {isLoading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-md bg-red/10 px-4 py-3 text-sm text-red dark:bg-red/20">
          Failed to load offers. Please try again.
        </div>
      )}

      {offers && offers.length === 0 && (
        <div className="mt-8 text-center text-slate-500 dark:text-slate-400">
          No offers currently available.
        </div>
      )}

      {offers && offers.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
