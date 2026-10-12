import type { Character } from '@yellowpicker/shared';
import { useState } from 'react';
import { Link, Navigate } from 'react-router';

import {
  useAdminSession,
  useDeleteCharacter,
  useDeletePickAsAdmin,
  useLogout,
} from '../../api/admin';
import { useCharacters } from '../../api/characters';
import { Modal } from '../../components/modal';
import { Avatar, Button, ErrorMessage, PageHeader } from '../../components/ui';
import { slotLabel } from '../picker/slots';

import { CharacterForm } from './character-form';

type Editing = { mode: 'create' } | { mode: 'edit'; character: Character } | null;

export function AdminPage() {
  const session = useAdminSession();
  const characters = useCharacters();
  const logout = useLogout();
  const deleteCharacter = useDeleteCharacter();
  const deletePick = useDeletePickAsAdmin();
  const [editing, setEditing] = useState<Editing>(null);

  if (session.isPending) {
    return <p className="p-8 text-muted">Chargement…</p>;
  }
  if (!session.data) {
    return <Navigate to="/admin/login" replace />;
  }

  const list = characters.data ?? [];
  const totalPicks = list.reduce((sum, c) => sum + c.picks.length, 0);

  return (
    <>
      <PageHeader>
        <div>
          <h1 className="font-display text-5xl tracking-wide text-accent">Administration</h1>
          <p className="text-muted">
            {list.length} personnage(s) · {totalPicks} inscrit(s) ·{' '}
            <Link to="/personnages" className="underline hover:text-zinc-100">
              voir le site
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditing({ mode: 'create' })}>+ Personnage</Button>
          <Button variant="ghost" onClick={() => logout.mutate()}>
            Déconnexion
          </Button>
        </div>
      </PageHeader>

      <main className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-16">
        <ErrorMessage error={characters.error ?? deleteCharacter.error ?? deletePick.error} />
        {list.map((character) => (
          <section
            key={character.id}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-4 sm:flex-row sm:items-center"
          >
            {character.imageUrl ? (
              <img src={character.imageUrl} alt="" className="size-16 rounded-xl object-cover" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-xl bg-ink font-display text-3xl text-line">
                {character.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl tracking-wide">
                {character.name}{' '}
                <span className="align-middle font-sans text-xs text-muted">
                  {slotLabel(character)}
                </span>
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {character.picks.map((pick) => (
                  <li
                    key={pick.id}
                    className="flex items-center gap-2 rounded-full bg-ink py-1 pr-1 pl-1 text-sm"
                  >
                    <Avatar src={pick.photoUrl} alt="" size="sm" />
                    {pick.firstName} {pick.lastName}
                    <button
                      type="button"
                      aria-label={`Retirer ${pick.firstName} ${pick.lastName}`}
                      onClick={() => {
                        if (
                          confirm(
                            `Retirer ${pick.firstName} ${pick.lastName} de ${character.name} ?`,
                          )
                        ) {
                          deletePick.mutate(pick.id);
                        }
                      }}
                      className="rounded-full px-2 text-muted hover:bg-red-500/20 hover:text-red-300"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing({ mode: 'edit', character })}>
                Modifier
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    confirm(
                      `Supprimer ${character.name} et ses ${character.picks.length} inscription(s) ?`,
                    )
                  ) {
                    deleteCharacter.mutate(character.id);
                  }
                }}
              >
                Supprimer
              </Button>
            </div>
          </section>
        ))}
      </main>

      <Modal
        open={editing !== null}
        title={
          editing?.mode === 'edit' ? `Modifier ${editing.character.name}` : 'Nouveau personnage'
        }
        onClose={() => setEditing(null)}
      >
        {editing && (
          <CharacterForm
            character={editing.mode === 'edit' ? editing.character : undefined}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}
