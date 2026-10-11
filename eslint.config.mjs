// ESLint config — monorepo Yellow Picker (base config-dev + React pour client/).

import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

import baseConfig from './eslint.base.config.mjs';

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.config.{js,mjs,cjs,ts}', 'server/data/**'],
  },

  ...baseConfig,

  // Lint typé (requis par no-floating-promises)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js'] } },
    },
    rules: {
      // TypeScript résout déjà les imports ; eslint-plugin-import ne sait pas lire les workspaces .ts
      'import/no-unresolved': 'off',
    },
  },

  {
    files: ['server/**/*.ts', 'shared/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['client/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-key': 'error',
      'react/no-danger': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/self-closing-comp': 'warn',
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
];
