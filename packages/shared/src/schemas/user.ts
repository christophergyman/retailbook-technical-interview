import { Type, type Static } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  id: Type.String(),
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 1 }),
});

export type User = Static<typeof UserSchema>;
