import type { Character, CreatedPick } from '@yellowpicker/shared';
import { useState, type FormEvent } from 'react';

import { useCreatePick } from '../../api/characters';
import { Button, ErrorMessage, TextField } from '../../components/ui';
import { resizeImage } from '../../lib/resize-image';

interface PickFormProps {
  character: Character;
  onPicked: (created: CreatedPick) => void;
}

export function PickForm({ character, onPicked }: PickFormProps) {
  const createPick = useCreatePick();
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handlePhotoChange(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPhoto(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!photo) {
      return;
    }
    const created = await createPick.mutateAsync({
      characterId: character.id,
      firstName: String(form.get('firstName')),
      lastName: String(form.get('lastName')),
      photo: await resizeImage(photo),
    });
    onPicked(created);
  }

  return (
    <form
      onSubmit={(event) => {
        handleSubmit(event).catch(() => undefined); // l'erreur est affichée via createPick.error
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Prénom"
          name="firstName"
          required
          maxLength={50}
          autoComplete="given-name"
        />
        <TextField label="Nom" name="lastName" required maxLength={50} autoComplete="family-name" />
      </div>

      <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-line p-4 hover:border-accent">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Aperçu de ta photo"
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-ink text-3xl text-muted">
            +
          </span>
        )}
        <span className="text-sm">
          <span className="block font-semibold">Ta photo</span>
          <span className="text-muted">Un selfie suffit, il sera affiché sur la carte.</span>
        </span>
        <input
          type="file"
          accept="image/*"
          required
          className="sr-only"
          onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
        />
      </label>

      <ErrorMessage error={createPick.error} />

      <Button type="submit" disabled={createPick.isPending || !photo}>
        {createPick.isPending ? 'Envoi…' : `Je serai ${character.name}`}
      </Button>
    </form>
  );
}
