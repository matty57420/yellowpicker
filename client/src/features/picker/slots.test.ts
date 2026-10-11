import type { Character } from '@yellowpicker/shared';
import { describe, expect, it } from 'vitest';

import { slotLabel, slotsLeft } from './slots';

function character(maxSlots: number, taken: number): Character {
  return {
    id: 1,
    name: 'Test',
    description: '',
    imageUrl: null,
    maxSlots,
    picks: Array.from({ length: taken }, (_, i) => ({
      id: i,
      firstName: 'A',
      lastName: 'B',
      photoUrl: '',
      createdAt: '',
    })),
  };
}

describe('slots', () => {
  it('perso exclusif : Libre puis Pris', () => {
    expect(slotLabel(character(1, 0))).toBe('Libre');
    expect(slotLabel(character(1, 1))).toBe('Pris');
  });

  it('rôle partagé : affiche les places restantes', () => {
    expect(slotLabel(character(5, 2))).toBe('3 places / 5');
    expect(slotLabel(character(5, 4))).toBe('1 place / 5');
    expect(slotsLeft(character(2, 3))).toBe(0);
  });
});
