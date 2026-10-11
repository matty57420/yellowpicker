import type { Character } from '@yellowpicker/shared';
import clsx from 'clsx';

import { Avatar } from '../../components/ui';

import { slotLabel, slotsLeft } from './slots';

interface CharacterCardProps {
  character: Character;
  /** Id du choix fait depuis cet appareil s'il porte sur ce personnage. */
  myPickId: number | null;
  /** L'utilisateur peut-il encore choisir ce personnage ? */
  selectable: boolean;
  onSelect: () => void;
}

export function CharacterCard({ character, myPickId, selectable, onSelect }: CharacterCardProps) {
  const full = slotsLeft(character) === 0;
  const isMine = myPickId !== null;

  return (
    <article
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-panel transition',
        isMine ? 'border-accent ring-2 ring-accent/40' : 'border-line',
        full && !isMine && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={!selectable}
        aria-label={`Choisir ${character.name}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-ink text-left enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
      >
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt=""
            className="size-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center font-display text-7xl text-line">
            {character.name.charAt(0)}
          </span>
        )}
        <span
          className={clsx(
            'absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
            isMine
              ? 'bg-accent text-accent-ink'
              : full
                ? 'bg-black/70 text-muted'
                : 'bg-black/70 text-accent',
          )}
        >
          {isMine ? 'Mon perso' : slotLabel(character)}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-2xl tracking-wide">{character.name}</h3>
          {character.description && <p className="text-sm text-muted">{character.description}</p>}
        </div>

        {character.picks.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-2" aria-label="Choisi par">
            {character.picks.map((pick) => (
              <li
                key={pick.id}
                className="flex items-center gap-2 rounded-full bg-ink py-1 pr-3 pl-1"
              >
                <Avatar src={pick.photoUrl} alt="" size="sm" />
                <span className="text-sm">
                  {pick.firstName} {pick.lastName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
