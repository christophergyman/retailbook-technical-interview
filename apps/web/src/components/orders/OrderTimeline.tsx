'use client';

import { STAGE_LABELS, type OrderStage } from '@trading/shared';
import type { StageHistoryEntry } from '@trading/shared';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OrderTimeline({ history }: { history: StageHistoryEntry[] }) {
  const entries = [...history].reverse();

  return (
    <div className="relative pl-6">
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />
      {entries.map((entry, i) => {
        const isRejected = entry.toStage === 'REJECTED';
        const dotColor = isRejected ? 'bg-red' : 'bg-emerald';

        return (
          <div key={entry.id} className="relative pb-6 last:pb-0">
            <div
              className={`absolute -left-3.5 top-1.5 h-3 w-3 rounded-full ${dotColor} ring-2 ring-white`}
            />
            <div>
              <p className="font-medium text-slate-900">
                {STAGE_LABELS[entry.toStage as OrderStage] ?? entry.toStage}
              </p>
              <p className="text-sm text-slate-500">{formatDate(entry.changedAt)}</p>
              {entry.note && <p className="mt-1 text-sm text-slate-600 italic">{entry.note}</p>}
              {entry.fromStage && i < entries.length - 1 && (
                <p className="mt-0.5 text-xs text-slate-400">
                  from {STAGE_LABELS[entry.fromStage as OrderStage] ?? entry.fromStage}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
