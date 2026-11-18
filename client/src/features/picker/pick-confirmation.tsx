import type { Character } from '@yellowpicker/shared';
import { useMemo } from 'react';

import { Button } from '../../components/ui';
import { EVENT_DATE_LONG } from '../../lib/event';

const CONFETTI_COUNT = 30;
const COLORS = ['#facc15', '#fde68a', '#f97316', '#ffffff'];

/** Confettis : calculés une fois, sinon chaque rendu relancerait l'animation. */
function useConfetti() {
  return useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        key: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 900}ms`,
        duration: `${2200 + Math.random() * 1600}ms`,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.round(Math.random() * 7),
        round: Math.random() > 0.6,
      })),
    [],
  );
}

interface PickConfirmationProps {
  character: Character;
  firstName: string;
  onClose: () => void;
}

export function PickConfirmation({ character, firstName, onClose }: PickConfirmationProps) {
  const confetti = useConfetti();
  const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Choix confirmé : ${character.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-ink/95 p-4 backdrop-blur-sm"
    >
      {!calm &&
        confetti.map((c) => (
          <span
            key={c.key}
            aria-hidden="true"
            className={`absolute top-0 animate-[yp-confetti_linear_both] ${c.round ? 'rounded-full' : 'rounded-[2px]'}`}
            style={{
              left: c.left,
              width: c.size,
              height: c.size * (c.round ? 1 : 1.6),
              background: c.color,
              animationDelay: c.delay,
              animationDuration: c.duration,
            }}
          />
        ))}

      <div className="relative w-full max-w-sm animate-[yp-pop_420ms_cubic-bezier(0.2,0.9,0.3,1.2)_both] rounded-3xl border border-accent/40 bg-panel p-6 text-center shadow-[0_0_60px_rgba(250,204,21,0.18)]">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt=""
            className="mx-auto size-36 rounded-2xl object-cover ring-4 ring-accent"
          />
        ) : (
          <span className="mx-auto flex size-36 items-center justify-center rounded-2xl bg-ink font-display text-6xl text-accent">
            {character.name.charAt(0)}
          </span>
        )}

        <p className="mt-5 font-display bg-gradient-to-b from-yellow-100 via-accent to-orange-500 bg-clip-text text-5xl tracking-wide text-transparent uppercase drop-shadow-[0_0_25px_rgba(250,204,21,0.4)]">
          Cassé !
        </p>

        <p className="mt-2 text-lg">
          {firstName}, tu seras <strong className="text-accent">{character.name}</strong>
        </p>

        <p className="mt-5 border-t border-line pt-4 font-display text-2xl tracking-[0.18em] text-accent uppercase">
          {EVENT_DATE_LONG}
        </p>
        <p className="mt-1 text-sm text-muted">On se voit là-bas. Prépare le costume.</p>

        <Button onClick={onClose} className="mt-6 w-full">
          Voir les autres
        </Button>
      </div>
    </div>
  );
}
