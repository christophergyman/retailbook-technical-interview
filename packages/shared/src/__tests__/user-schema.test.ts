import { describe, expect, it } from 'vitest';
import { FormatRegistry } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { UserSchema } from '../schemas/user';

// Register format validators so TypeCompiler recognizes format annotations
if (!FormatRegistry.Has('email')) {
  FormatRegistry.Set('email', (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
}

const userCheck = TypeCompiler.Compile(UserSchema);

describe('UserSchema', () => {
  it('accepts a valid user', () => {
    expect(userCheck.Check({ id: 'u1', email: 'alice@example.com', name: 'Alice' })).toBe(true);
  });

  it('rejects missing email', () => {
    expect(userCheck.Check({ id: 'u1', name: 'Alice' })).toBe(false);
  });

  it('rejects missing name', () => {
    expect(userCheck.Check({ id: 'u1', email: 'alice@example.com' })).toBe(false);
  });

  it('rejects empty name (minLength: 1)', () => {
    expect(userCheck.Check({ id: 'u1', email: 'alice@example.com', name: '' })).toBe(false);
  });

  it('rejects missing id', () => {
    expect(userCheck.Check({ email: 'alice@example.com', name: 'Alice' })).toBe(false);
  });

  it('rejects invalid email format', () => {
    expect(userCheck.Check({ id: 'u1', email: 'not-an-email', name: 'Alice' })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(userCheck.Check({})).toBe(false);
  });
});
