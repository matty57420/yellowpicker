// Contrat de l'API REST partagé entre le serveur et le client.
// Types uniquement : ce paquet ne doit rien exporter à l'exécution.

export interface Pick {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl: string;
  createdAt: string;
}

export interface Character {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  /** 1 = personnage exclusif ; > 1 = rôle partagé (ex. STAFF). */
  maxSlots: number;
  picks: Pick[];
}

/** Retourné une seule fois à la création : le token permet d'annuler son choix. */
export interface CreatedPick {
  pick: Pick;
  characterId: number;
  editToken: string;
}

export interface AdminSession {
  username: string;
}

/** Corps d'erreur RFC 7807 (application/problem+json). */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
}
