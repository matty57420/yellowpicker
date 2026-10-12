import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { HomePage } from './home-page';

describe('HomePage', () => {
  it('affiche l’invitation et mène au choix des personnages', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Vous êtes invité à la Yellow',
    );
    expect(screen.getByRole('link', { name: 'Choisir mon personnage' })).toHaveAttribute(
      'href',
      '/personnages',
    );
  });
});
