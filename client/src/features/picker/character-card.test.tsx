import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Character } from '@yellowpicker/shared';
import { describe, expect, it, vi } from 'vitest';

import { CharacterCard } from './character-card';

const staff: Character = {
  id: 1,
  name: 'Staff',
  description: 'Équipe technique',
  imageUrl: null,
  maxSlots: 3,
  picks: [
    { id: 7, firstName: 'Ada', lastName: 'Lovelace', photoUrl: '/uploads/a.jpg', createdAt: '' },
  ],
};

describe('CharacterCard', () => {
  it('affiche les inscrits et déclenche la sélection', async () => {
    const onSelect = vi.fn();
    render(<CharacterCard character={staff} myPickId={null} selectable onSelect={onSelect} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('2 places / 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Choisir Staff' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('n’est pas cliquable quand non sélectionnable', () => {
    render(
      <CharacterCard character={staff} myPickId={null} selectable={false} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Choisir Staff' })).toBeDisabled();
  });
});
