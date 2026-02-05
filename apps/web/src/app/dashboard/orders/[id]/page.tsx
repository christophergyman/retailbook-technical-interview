'use client';

import { use } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { useAdvanceStage } from '@/hooks/useAdvanceStage';
import { StageProgress } from '@/components/orders/StageProgress';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { VALID_TRANSITIONS, STAGE_LABELS, isTerminalStage, type OrderStage } from '@trading/shared';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function OrderDetailContent({ id }: { id: string }) {
  const { data: order, isLoading, error } = useOrderDetail(id);
  const advanceStage = useAdvanceStage(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mt-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">Order not found.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm text-blue hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentStage = order.stage as OrderStage;
  const nextStages = VALID_TRANSITIONS[currentStage]?.filter((s) => s !== 'REJECTED') ?? [];
  const canReject =
    !isTerminalStage(currentStage) && VALID_TRANSITIONS[currentStage]?.includes('REJECTED');

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
      >
        &larr; Back to Dashboard
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Order Details</h1>
            <div className="mt-4">
              <StageProgress currentStage={currentStage} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Shares</p>
                <p className="font-semibold">{order.sharesRequested.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Cost</p>
                <p className="font-semibold">{formatCurrency(order.totalCost)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Stage</p>
                <p className="font-semibold">{STAGE_LABELS[currentStage]}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {!isTerminalStage(currentStage) && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                {nextStages.map((stage) => (
                  <button
                    key={stage}
                    disabled={advanceStage.isPending}
                    onClick={() => advanceStage.mutate({ toStage: stage })}
                    className="rounded-md bg-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue/90 disabled:opacity-50"
                  >
                    Advance to {STAGE_LABELS[stage]}
                  </button>
                ))}
                {canReject && (
                  <button
                    disabled={advanceStage.isPending}
                    onClick={() =>
                      advanceStage.mutate({ toStage: 'REJECTED', note: 'Manually rejected' })
                    }
                    className="rounded-md bg-red/10 px-3 py-1.5 text-sm font-medium text-red transition-colors hover:bg-red/20 disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
                {advanceStage.error && (
                  <p className="w-full text-sm text-red">
                    {advanceStage.error instanceof Error
                      ? advanceStage.error.message
                      : 'Failed to update stage'}
                  </p>
                )}
              </div>
            )}
          </div>

          {order.offer && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Offer Info</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Company</p>
                  <p className="font-medium">{order.offer.companyName}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Ticker</p>
                  <p className="font-medium">{order.offer.ticker}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Price/Share</p>
                  <p className="font-medium">{formatCurrency(order.offer.pricePerShare)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Sector</p>
                  <p className="font-medium">{order.offer.sector}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Stage History</h2>
            <div className="mt-4">
              <OrderTimeline history={order.stageHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <OrderDetailContent id={id} />
    </AuthGuard>
  );
}
