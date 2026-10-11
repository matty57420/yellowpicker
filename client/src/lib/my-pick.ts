// Mémorise dans le navigateur le choix fait depuis cet appareil, pour pouvoir l'annuler.
// Le stockage peut être indisponible (navigation privée) : on dégrade sans planter.

const KEY = 'yellowpicker.my-pick';

export interface MyPick {
  pickId: number;
  characterId: number;
  editToken: string;
}

export function loadMyPick(): MyPick | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyPick) : null;
  } catch {
    return null;
  }
}

export function saveMyPick(pick: MyPick | null): void {
  try {
    if (pick) {
      localStorage.setItem(KEY, JSON.stringify(pick));
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // stockage indisponible : le choix reste enregistré côté serveur
  }
}
