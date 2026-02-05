export const ORDER_STAGES = [
  'PENDING_REVIEW',
  'COMPLIANCE_CHECK',
  'APPROVED',
  'ALLOCATED',
  'SETTLED',
  'REJECTED',
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

export const STAGE_LABELS: Record<OrderStage, string> = {
  PENDING_REVIEW: 'Pending Review',
  COMPLIANCE_CHECK: 'Compliance Check',
  APPROVED: 'Approved',
  ALLOCATED: 'Allocated',
  SETTLED: 'Settled',
  REJECTED: 'Rejected',
};

export const PIPELINE_STAGES = ORDER_STAGES.filter((s) => s !== 'REJECTED') as readonly Exclude<
  OrderStage,
  'REJECTED'
>[];

export const VALID_TRANSITIONS: Record<OrderStage, OrderStage[]> = {
  PENDING_REVIEW: ['COMPLIANCE_CHECK', 'REJECTED'],
  COMPLIANCE_CHECK: ['APPROVED', 'REJECTED'],
  APPROVED: ['ALLOCATED', 'REJECTED'],
  ALLOCATED: ['SETTLED', 'REJECTED'],
  SETTLED: [],
  REJECTED: [],
};

export function isValidTransition(from: OrderStage, to: OrderStage): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function getStageIndex(stage: OrderStage): number {
  const idx = PIPELINE_STAGES.indexOf(stage as (typeof PIPELINE_STAGES)[number]);
  return stage === 'REJECTED' ? -1 : idx;
}

export function isTerminalStage(stage: OrderStage): boolean {
  return stage === 'SETTLED' || stage === 'REJECTED';
}
