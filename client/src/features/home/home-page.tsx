import { Link } from 'react-router';

import briceParty from '../../assets/brice-party.jpg';

export function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Invitation</p>
      <h1 className="font-display text-6xl leading-none tracking-wide sm:text-8xl">
        Vous êtes invité à la <span className="text-accent">Yellow</span>
      </h1>
      <img
        src={briceParty}
        alt="Brice, en t-shirt jaune, au milieu d’une fête de nuit"
        width={1280}
        height={668}
        className="w-full max-w-3xl rounded-2xl border border-accent/30 shadow-[0_0_80px_-20px] shadow-accent/50"
      />
      <p className="max-w-md text-lg text-muted">
        Vous pouvez choisir votre personnage : ce système évitera les doublons.
      </p>
      <Link
        to="/personnages"
        className="rounded-xl bg-accent px-8 py-4 text-lg font-bold text-accent-ink transition hover:bg-yellow-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        Choisir mon personnage
      </Link>
    </main>
  );
}
