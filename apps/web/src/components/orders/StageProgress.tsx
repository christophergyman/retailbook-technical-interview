'use client';

import { PIPELINE_STAGES, STAGE_LABELS, getStageIndex, type OrderStage } from '@trading/shared';

const STAGE_COLORS = {
  completed: 'bg-emerald text-white',
  current: 'bg-blue text-white ring-2 ring-blue/30',
  future: 'bg-slate-200 text-slate-400',
  rejected: 'bg-red text-white',
};

export function StageProgress({ currentStage }: { currentStage: OrderStage }) {
  const isRejected = currentStage === 'REJECTED';
  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STAGES.map((stage, i) => {
        let variant: keyof typeof STAGE_COLORS;
        if (isRejected) {
          variant = 'future';
        } else if (i < currentIndex) {
          variant = 'completed';
        } else if (i === currentIndex) {
          variant = 'current';
        } else {
          variant = 'future';
        }

        return (
          <div key={stage} className="flex items-center">
            <div
              className={`flex h-7 items-center rounded-full px-2.5 text-xs font-medium ${STAGE_COLORS[variant]}`}
              title={STAGE_LABELS[stage]}
            >
              {i < currentIndex && !isRejected ? (
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : null}
              <span className="hidden sm:inline">{STAGE_LABELS[stage]}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div
                className={`mx-0.5 h-0.5 w-3 sm:w-4 ${
                  i < currentIndex && !isRejected ? 'bg-emerald' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="ml-2 flex h-7 items-center rounded-full bg-red px-2.5 text-xs font-medium text-white">
          Rejected
        </div>
      )}
    </div>
  );
}
