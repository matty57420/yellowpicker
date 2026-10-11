import type { Character } from '@yellowpicker/shared';

export function slotsLeft(character: Character): number {
  return Math.max(0, character.maxSlots - character.picks.length);
}

export function slotLabel(character: Character): string {
  const left = slotsLeft(character);
  if (left === 0) {
    return 'Pris';
  }
  if (character.maxSlots === 1) {
    return 'Libre';
  }
  return `${left} place${left > 1 ? 's' : ''} / ${character.maxSlots}`;
}
