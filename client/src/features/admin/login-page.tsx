import type { FormEvent } from 'react';
import { Navigate } from 'react-router';

import { useAdminSession, useLogin } from '../../api/admin';
import { Button, ErrorMessage, TextField } from '../../components/ui';

export function LoginPage() {
  const session = useAdminSession();
  const login = useLogin();

  if (session.data) {
    return <Navigate to="/admin" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    login.mutate({
      username: String(form.get('username')),
      password: String(form.get('password')),
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-line bg-panel p-6"
      >
        <h1 className="font-display text-4xl tracking-wide text-accent">Administration</h1>
        <TextField label="Identifiant" name="username" required autoComplete="username" />
        <TextField
          label="Mot de passe"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <ErrorMessage error={login.error} />
        <Button type="submit" disabled={login.isPending}>
          Se connecter
        </Button>
      </form>
    </main>
  );
}
