import { describe, expect, it } from 'vitest';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { CreateOrderSchema, UpdateOrderStageSchema } from '../schemas/order';

const createOrderCheck = TypeCompiler.Compile(CreateOrderSchema);
const updateStageCheck = TypeCompiler.Compile(UpdateOrderStageSchema);

describe('CreateOrderSchema', () => {
  it('accepts valid input', () => {
    expect(createOrderCheck.Check({ offerId: 'abc-123', sharesRequested: 10 })).toBe(true);
  });

  it('accepts sharesRequested = 1 (minimum)', () => {
    expect(createOrderCheck.Check({ offerId: 'abc', sharesRequested: 1 })).toBe(true);
  });

  it('rejects sharesRequested = 0', () => {
    expect(createOrderCheck.Check({ offerId: 'abc', sharesRequested: 0 })).toBe(false);
  });

  it('rejects negative sharesRequested', () => {
    expect(createOrderCheck.Check({ offerId: 'abc', sharesRequested: -5 })).toBe(false);
  });

  it('rejects non-integer sharesRequested', () => {
    expect(createOrderCheck.Check({ offerId: 'abc', sharesRequested: 2.5 })).toBe(false);
  });

  it('rejects missing offerId', () => {
    expect(createOrderCheck.Check({ sharesRequested: 10 })).toBe(false);
  });

  it('rejects missing sharesRequested', () => {
    expect(createOrderCheck.Check({ offerId: 'abc' })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(createOrderCheck.Check({})).toBe(false);
  });
});

describe('UpdateOrderStageSchema', () => {
  it('accepts valid stage', () => {
    expect(updateStageCheck.Check({ toStage: 'COMPLIANCE_CHECK' })).toBe(true);
  });

  it('accepts stage with note', () => {
    expect(updateStageCheck.Check({ toStage: 'REJECTED', note: 'Failed compliance' })).toBe(true);
  });

  it('rejects invalid stage value', () => {
    expect(updateStageCheck.Check({ toStage: 'INVALID_STAGE' })).toBe(false);
  });

  it('rejects missing toStage', () => {
    expect(updateStageCheck.Check({})).toBe(false);
  });
});
