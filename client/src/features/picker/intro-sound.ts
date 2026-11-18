/**
 * Musique de l'intro.
 *
 * Les navigateurs refusent de démarrer un son tant que l'utilisateur n'a pas
 * interagi avec la page. On tente donc la lecture, et `play()` indique si elle
 * a été acceptée : l'appelant propose un bouton dans le cas contraire.
 */

const SRC = '/intro.mp3';

export interface IntroSound {
  /** Tente la lecture. `false` si le navigateur l'a refusée. */
  play: () => Promise<boolean>;
  stop: () => void;
}

export function createIntroSound(): IntroSound {
  const audio = new Audio(SRC);
  audio.volume = 0.7;
  audio.preload = 'auto';

  return {
    async play() {
      try {
        await audio.play();
        return true;
      } catch {
        return false;
      }
    },
    stop() {
      audio.pause();
      // Libère le téléchargement en cours si l'intro est passée tout de suite.
      audio.removeAttribute('src');
      audio.load();
    },
  };
}
