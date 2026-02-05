import { describe, expect, it } from 'vitest';
import {
  ORDER_STAGES,
  PIPELINE_STAGES,
  isValidTransition,
  getStageIndex,
  isTerminalStage,
} from '../constants/stages';

describe('ORDER_STAGES', () => {
  it('has 6 entries', () => {
    expect(ORDER_STAGES).toHaveLength(6);
  });
});

describe('isValidTransition', () => {
  it('allows all valid forward paths', () => {
    expect(isValidTransition('PENDING_REVIEW', 'COMPLIANCE_CHECK')).toBe(true);
    expect(isValidTransition('COMPLIANCE_CHECK', 'APPROVED')).toBe(true);
    expect(isValidTransition('APPROVED', 'ALLOCATED')).toBe(true);
    expect(isValidTransition('ALLOCATED', 'SETTLED')).toBe(true);
  });

  it('allows rejection from any non-terminal stage', () => {
    expect(isValidTransition('PENDING_REVIEW', 'REJECTED')).toBe(true);
    expect(isValidTransition('COMPLIANCE_CHECK', 'REJECTED')).toBe(true);
    expect(isValidTransition('APPROVED', 'REJECTED')).toBe(true);
    expect(isValidTransition('ALLOCATED', 'REJECTED')).toBe(true);
  });

  it('rejects skipped stages', () => {
    expect(isValidTransition('PENDING_REVIEW', 'APPROVED')).toBe(false);
    expect(isValidTransition('PENDING_REVIEW', 'ALLOCATED')).toBe(false);
    expect(isValidTransition('PENDING_REVIEW', 'SETTLED')).toBe(false);
    expect(isValidTransition('COMPLIANCE_CHECK', 'ALLOCATED')).toBe(false);
  });

  it('rejects transitions from terminal stages', () => {
    expect(isValidTransition('SETTLED', 'PENDING_REVIEW')).toBe(false);
    expect(isValidTransition('SETTLED', 'REJECTED')).toBe(false);
    expect(isValidTransition('REJECTED', 'PENDING_REVIEW')).toBe(false);
    expect(isValidTransition('REJECTED', 'APPROVED')).toBe(false);
  });
});

describe('getStageIndex', () => {
  it('returns correct index for each pipeline stage', () => {
    PIPELINE_STAGES.forEach((stage, i) => {
      expect(getStageIndex(stage)).toBe(i);
    });
  });

  it('returns -1 for REJECTED', () => {
    expect(getStageIndex('REJECTED')).toBe(-1);
  });
});

describe('isTerminalStage', () => {
  it('returns true for SETTLED and REJECTED', () => {
    expect(isTerminalStage('SETTLED')).toBe(true);
    expect(isTerminalStage('REJECTED')).toBe(true);
  });

  it('returns false for all other stages', () => {
    expect(isTerminalStage('PENDING_REVIEW')).toBe(false);
    expect(isTerminalStage('COMPLIANCE_CHECK')).toBe(false);
    expect(isTerminalStage('APPROVED')).toBe(false);
    expect(isTerminalStage('ALLOCATED')).toBe(false);
  });
});
