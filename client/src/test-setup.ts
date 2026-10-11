import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest tourne sans `globals` : le nettoyage automatique de RTL n'est pas enregistré.
afterEach(cleanup);
