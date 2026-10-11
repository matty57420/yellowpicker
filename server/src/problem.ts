import type { Problem } from '@yellowpicker/shared';
import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

/** Erreur métier sérialisée en application/problem+json (RFC 7807). */
export class HttpProblem extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail?: string,
  ) {
    super(detail ?? title);
  }
}

export function registerProblemHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | HttpProblem | ZodError, request, reply) => {
    let problem: Problem;
    if (error instanceof HttpProblem) {
      problem = {
        type: 'about:blank',
        title: error.title,
        status: error.status,
        detail: error.detail,
      };
    } else if (error instanceof ZodError) {
      problem = {
        type: 'about:blank',
        title: 'Données invalides',
        status: 400,
        detail: error.issues.map((issue) => issue.message).join(' · '),
      };
    } else if (error.statusCode !== undefined && error.statusCode < 500) {
      problem = { type: 'about:blank', title: error.message, status: error.statusCode };
    } else {
      request.log.error(error);
      problem = { type: 'about:blank', title: 'Erreur interne', status: 500 };
    }
    return reply.status(problem.status).type('application/problem+json').send(problem);
  });
}
