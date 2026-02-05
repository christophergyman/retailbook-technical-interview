'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useDashboard } from '@/hooks/useDashboard';
import { useOrders } from '@/hooks/useOrders';
import { StageProgress } from '@/components/orders/StageProgress';
import { STAGE_LABELS, type OrderStage } from '@trading/shared';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = useDashboard();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  const isLoading = statsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div>
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalOrders}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Invested</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(stats.totalInvested)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Orders by Stage</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(stats.ordersByStage).map(([stage, count]) => (
                <span
                  key={stage}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                >
                  {STAGE_LABELS[stage as OrderStage] ?? stage}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Orders</h2>

        {orders && orders.length === 0 ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-slate-400">No orders yet.</p>
            <Link
              href="/offers"
              className="mt-2 inline-block text-sm font-medium text-blue hover:underline"
            >
              Browse offers to get started
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left dark:border-slate-700">
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                    Order ID
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                    Shares
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                    Stage
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">{order.sharesRequested.toLocaleString()}</td>
                    <td className="px-4 py-3">{formatCurrency(order.totalCost)}</td>
                    <td className="px-4 py-3">
                      <StageProgress currentStage={order.stage as OrderStage} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-blue hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Track your investments and order progress
      </p>
      <div className="mt-6">
        <DashboardContent />
      </div>
    </AuthGuard>
  );
}
