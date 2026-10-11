import type { Character } from '@yellowpicker/shared';
import { useState, type FormEvent } from 'react';

import { useSaveCharacter } from '../../api/admin';
import { Button, ErrorMessage, TextField } from '../../components/ui';
import { resizeImage } from '../../lib/resize-image';

interface CharacterFormProps {
  /** Personnage à modifier ; absent pour une création. */
  character?: Character;
  onDone: () => void;
}

export function CharacterForm({ character, onDone }: CharacterFormProps) {
  const save = useSaveCharacter();
  const [image, setImage] = useState<File | null>(null);
  const [shared, setShared] = useState((character?.maxSlots ?? 1) > 1);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save.mutateAsync({
      id: character?.id,
      name: String(form.get('name')),
      description: String(form.get('description') ?? ''),
      maxSlots: shared ? Number(form.get('maxSlots')) : 1,
      image: image ? await resizeImage(image, 1200) : null,
    });
    onDone();
  }

  return (
    <form
      onSubmit={(event) => {
        handleSubmit(event).catch(() => undefined); // l'erreur est affichée via save.error
      }}
      className="flex flex-col gap-4"
    >
      <TextField
        label="Nom du personnage"
        name="name"
        required
        maxLength={80}
        defaultValue={character?.name}
      />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Description (optionnelle)</span>
        <textarea
          name="description"
          maxLength={500}
          rows={3}
          defaultValue={character?.description}
          className="rounded-lg border border-line bg-ink px-3 py-2 text-zinc-100 outline-none focus:border-accent"
        />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
          className="size-4 accent-yellow-400"
        />
        Rôle partagé (plusieurs personnes, ex. STAFF)
      </label>
      {shared && (
        <TextField
          label="Nombre de places"
          name="maxSlots"
          type="number"
          min={Math.max(2, character?.picks.length ?? 0)}
          max={500}
          required
          defaultValue={Math.max(2, character?.maxSlots ?? 2)}
        />
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">
          Image {character?.imageUrl ? '(laisser vide pour conserver l’actuelle)' : ''}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:font-semibold file:text-accent-ink"
        />
      </label>

      <ErrorMessage error={save.error} />
      <Button type="submit" disabled={save.isPending}>
        {character ? 'Enregistrer' : 'Ajouter le personnage'}
      </Button>
    </form>
  );
}
