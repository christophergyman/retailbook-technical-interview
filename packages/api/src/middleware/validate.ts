import type { TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { factory } from '../factory';
import { ValidationError } from './error-handler';

export function validateBody<T extends TSchema>(schema: T) {
  const compiled = TypeCompiler.Compile(schema);

  return factory.createMiddleware(async (c, next) => {
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
