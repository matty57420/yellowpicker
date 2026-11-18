import { useCallback, useEffect, useRef, useState } from 'react';

import { createIntroSound, type IntroSound } from './intro-sound';

/** Durée totale avant de rendre la main au picker. */
const DURATION_MS = 3400;
/** Le flot jaune démarre avant la fin pour recouvrir l'écran au moment du passage. */
const FLOOD_AT_MS = 2600;

/**
 * La crête de la vague. Le remplissage de la vague ET la trajectoire du surfeur
 * en sont tous deux dérivés : impossible qu'ils se désynchronisent.
 */
const CREST = 'M-20,250 C60,243 112,226 172,209 C234,192 302,176 420,156';

/** Sprite 261x420 : on garde son rapport pour ne pas le déformer. */
const SPRITE_H = 46;
const SPRITE_W = SPRITE_H * (261 / 420);

/**
 * L'intro se joue à chaque chargement de page. Seule exception : un appareil
 * réglé pour limiter les animations, qu'on ne force pas.
 */
export function shouldShowIntro(): boolean {
  return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function WaveIntro({ onDone }: { onDone: () => void }) {
  const [flooding, setFlooding] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const sound = useRef<IntroSound | null>(null);

  const finish = useCallback(() => {
    sound.current?.stop();
    sound.current = null;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const audio = createIntroSound();
    sound.current = audio;

    // Le navigateur refuse le son tant que l'invité n'a rien touché. On tente
    // quand même, puis on guette son tout premier geste — n'importe lequel,
    // n'importe où : c'est bien plus sûr que d'espérer qu'il vise un bouton.
    const events = ['pointerdown', 'touchstart', 'keydown'] as const;
    let unlocked = false;

    function unwatch() {
      for (const event of events) {
        document.removeEventListener(event, onGesture);
      }
    }

    function attempt() {
      void audio.play().then((ok) => {
        unlocked = ok;
        setNeedsGesture(!ok);
        if (ok) {
          unwatch();
        }
      });
    }

    function onGesture() {
      if (!unlocked) {
        attempt();
      }
    }

    attempt();
    for (const event of events) {
      document.addEventListener(event, onGesture, { passive: true });
    }

    const flood = setTimeout(() => setFlooding(true), FLOOD_AT_MS);
    const done = setTimeout(finish, DURATION_MS);
    return () => {
      clearTimeout(flood);
      clearTimeout(done);
      unwatch();
      audio.stop();
    };
  }, [finish]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink">
      <div className="absolute inset-x-0 top-[14%] text-center">
        <h1 className="animate-[yp-title_900ms_ease-out_both] font-display bg-gradient-to-b from-yellow-100 via-accent to-orange-500 bg-clip-text text-5xl tracking-wide text-transparent uppercase drop-shadow-[0_0_35px_rgba(250,204,21,0.45)] sm:text-7xl">
          Yellow Party
        </h1>
        <p className="animate-[yp-title_900ms_ease-out_400ms_both] mt-2 text-sm tracking-[0.35em] text-muted uppercase sm:text-base">
          Elle arrive, cette vague…
        </p>
      </div>

      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id="yp-wave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="55%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        {/* Houle d'arrière-plan : de la profondeur, sans voler la vedette. */}
        <path
          d="M-20,262 C70,250 140,268 215,246 C290,224 350,244 420,226 L420,320 L-20,320 Z"
          fill="#1c1a20"
          className="animate-[yp-swell_2400ms_ease-in-out_both]"
        />

        {/* Vague et surfeur dans le même groupe : ils montent ensemble. */}
        <g className="animate-[yp-swell_2400ms_ease-in-out_200ms_both]">
          <path d={`${CREST} L420,320 L-20,320 Z`} fill="url(#yp-wave)" />
          <g className="yp-surfer">
            <g className="animate-[yp-bob_760ms_ease-in-out_infinite]">
              {/* Sprite posé pieds sur la crête : le point du tracé est à y=0. */}
              <image
                href="/brice.png"
                x={-SPRITE_W / 2}
                y={-SPRITE_H}
                width={SPRITE_W}
                height={SPRITE_H}
                imageRendering="pixelated"
              />
            </g>
          </g>
        </g>
      </svg>

      {/* Le flot jaune recouvre l'écran, puis le picker est révélé derrière. */}
      {flooding && (
        <div className="absolute inset-0 animate-[yp-flood_800ms_cubic-bezier(0.6,0,0.2,1)_both] bg-gradient-to-b from-accent to-orange-500" />
      )}

      <div className="absolute inset-x-0 bottom-5 z-10 flex items-center justify-center gap-3">
        {needsGesture && (
          <button
            type="button"
            onClick={() => {
              void sound.current?.play().then((ok) => setNeedsGesture(!ok));
            }}
            className="cursor-pointer rounded-full border border-accent/50 bg-ink/70 px-4 py-2 text-sm text-accent hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent"
          >
            🔊 Le son
          </button>
        )}
        <button
          type="button"
          onClick={finish}
          className="cursor-pointer rounded-full border border-line bg-ink/70 px-4 py-2 text-sm text-muted hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Passer
        </button>
      </div>
    </div>
  );
}
