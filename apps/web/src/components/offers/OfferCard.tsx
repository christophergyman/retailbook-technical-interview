import Link from 'next/link';
import type { Offer } from '@trading/shared';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export function OfferCard({ offer }: { offer: Offer }) {
  const pct = Math.round((offer.availableShares / offer.totalShares) * 100);
  const closingSoon =
    offer.status === 'open' &&
    new Date(offer.ipoDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Link
      href={`/offers/${offer.id}`}
      className="group block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-blue dark:text-slate-100">
            {offer.companyName}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              {offer.ticker}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{offer.sector}</span>
          </div>
        </div>
        {closingSoon && (
          <span className="rounded-full bg-amber/10 px-2 py-0.5 text-xs font-medium text-amber dark:bg-amber/20">
            Closing Soon
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500 dark:text-slate-400">Price/Share</p>
          <p className="font-semibold">{formatCurrency(offer.pricePerShare)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">IPO Date</p>
          <p className="font-semibold">{offer.ipoDate}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{formatNumber(offer.availableShares)} available</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div className="h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
