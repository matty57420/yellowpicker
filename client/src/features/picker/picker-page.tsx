import { useState } from 'react';

import { useCancelPick, useCharacters } from '../../api/characters';
import { Modal } from '../../components/modal';
import { Button, ErrorMessage, PageHeader } from '../../components/ui';
import { loadMyPick, saveMyPick, type MyPick } from '../../lib/my-pick';

import { CharacterCard } from './character-card';
import { PickForm } from './pick-form';
import { slotsLeft } from './slots';

export function PickerPage() {
  const characters = useCharacters();
  const cancelPick = useCancelPick();
  const [storedPick, setStoredPick] = useState<MyPick | null>(loadMyPick);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const list = characters.data ?? [];
  // Le choix mémorisé n'est valable que s'il existe encore côté serveur (l'admin a pu le retirer).
  const myPick =
    storedPick && list.some((c) => c.picks.some((p) => p.id === storedPick.pickId))
      ? storedPick
      : null;
  const myCharacter = myPick ? list.find((c) => c.id === myPick.characterId) : undefined;
  const selected = list.find((c) => c.id === selectedId);

  function updateMyPick(pick: MyPick | null) {
    saveMyPick(pick);
    setStoredPick(pick);
  }

  return (
    <>
      <PageHeader>
        <div>
          <h1 className="font-display text-5xl tracking-wide text-accent">Yellow Picker</h1>
          <p className="text-muted">Choisis ton personnage pour la soirée déguisée.</p>
        </div>
        {myPick && myCharacter && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-panel px-4 py-2">
            <span className="text-sm">
              Tu seras <strong className="text-accent">{myCharacter.name}</strong>
            </span>
            <Button
              variant="ghost"
              disabled={cancelPick.isPending}
              onClick={() => cancelPick.mutate(myPick, { onSuccess: () => updateMyPick(null) })}
            >
              Changer
            </Button>
          </div>
        )}
      </PageHeader>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <ErrorMessage error={characters.error ?? cancelPick.error} />
        {characters.isPending && <p className="text-muted">Chargement des personnages…</p>}
        {characters.isSuccess && list.length === 0 && (
          <p className="text-muted">Aucun personnage pour l’instant. Reviens bientôt !</p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              myPickId={myPick?.characterId === character.id ? myPick.pickId : null}
              selectable={!myPick && slotsLeft(character) > 0}
              onSelect={() => setSelectedId(character.id)}
            />
          ))}
        </div>
      </main>

      <Modal
        open={selected !== undefined}
        title={selected ? `Incarner ${selected.name}` : ''}
        onClose={() => setSelectedId(null)}
      >
        {selected && (
          <PickForm
            character={selected}
            onPicked={(created) => {
              updateMyPick({
                pickId: created.pick.id,
                characterId: created.characterId,
                editToken: created.editToken,
              });
              setSelectedId(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}
