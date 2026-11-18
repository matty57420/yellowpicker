import type { Character } from '@yellowpicker/shared';
import { useState } from 'react';

import { useCancelPick, useCharacters } from '../../api/characters';
import { Modal } from '../../components/modal';
import { Button, ErrorMessage, PageHeader } from '../../components/ui';
import { EVENT_DATE_SHORT } from '../../lib/event';
import { loadMyPick, saveMyPick, type MyPick } from '../../lib/my-pick';

import { CharacterCard } from './character-card';
import { PickConfirmation } from './pick-confirmation';
import { PickForm } from './pick-form';
import { slotsLeft } from './slots';
import { shouldShowIntro, WaveIntro } from './wave-intro';

export function PickerPage() {
  const characters = useCharacters();
  const cancelPick = useCancelPick();
  const [storedPick, setStoredPick] = useState<MyPick | null>(loadMyPick);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [intro, setIntro] = useState(shouldShowIntro);
  const [confirmed, setConfirmed] = useState<{ character: Character; firstName: string } | null>(
    null,
  );

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
      {intro && <WaveIntro onDone={() => setIntro(false)} />}

      <PageHeader>
        <div className="w-full text-center">
          <h1 className="font-display bg-gradient-to-b from-yellow-100 via-accent to-orange-500 bg-clip-text text-5xl leading-[0.9] tracking-wide text-transparent uppercase drop-shadow-[0_0_35px_rgba(250,204,21,0.45)] sm:text-7xl lg:text-8xl">
            Yellow Party
          </h1>
          <p className="font-display indent-[0.3em] text-2xl leading-tight tracking-[0.3em] text-muted uppercase sm:text-4xl">
            Yellow Picker
          </p>
          <p className="mt-2 font-display indent-[0.25em] text-3xl tracking-[0.25em] text-accent sm:text-5xl">
            {EVENT_DATE_SHORT}
          </p>
        </div>
        {myPick && myCharacter && (
          <div className="mx-auto flex items-center gap-3 rounded-xl border border-accent/40 bg-panel px-4 py-2">
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
              setConfirmed({ character: selected, firstName: created.pick.firstName });
              setSelectedId(null);
            }}
          />
        )}
      </Modal>

      {confirmed && (
        <PickConfirmation
          character={confirmed.character}
          firstName={confirmed.firstName}
          onClose={() => setConfirmed(null)}
        />
      )}
    </>
  );
}
