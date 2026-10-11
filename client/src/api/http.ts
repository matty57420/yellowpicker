import type { Problem } from '@yellowpicker/shared';

/** Erreur d'API portant le corps RFC 7807 renvoyé par le serveur. */
export class ApiError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
  }

  get status(): number {
    return this.problem.status;
  }
}

export async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (typeof init.body === 'string') {
    headers.set('content-type', 'application/json');
  }
  const res = await fetch(url, { ...init, headers, credentials: 'same-origin' });
  if (!res.ok) {
    const problem: Problem = res.headers.get('content-type')?.includes('json')
      ? ((await res.json()) as Problem)
      : { type: 'about:blank', title: res.statusText || 'Erreur réseau', status: res.status };
    throw new ApiError(problem);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
