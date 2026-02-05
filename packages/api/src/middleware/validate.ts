import type { TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { createMiddleware } from 'hono/factory';
import { ValidationError } from './error-handler';
import type { AppEnv } from '../factory';

export function validateBody<T extends TSchema>(schema: T) {
  const compiled = TypeCompiler.Compile(schema);

  return createMiddleware<AppEnv>(async (c, next) => {
    const body = await c.req.json();

    if (!compiled.Check(body)) {
      const errors = [...compiled.Errors(body)];
      const message = errors.map((e) => `${e.path}: ${e.message}`).join('; ');
      throw new ValidationError(message);
    }

    c.set('validatedBody' as never, body as never);
    await next();
  });
}
