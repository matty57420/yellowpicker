// ESLint config — base TypeScript (flat config, ESLint v9)
// A copier en `eslint.config.mjs` à la racine. Extensible par les configs React/Vue.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import promise from 'eslint-plugin-promise';

export default [
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  {
    files: ['**/*.{ts,tsx,mts,cts,js,mjs,cjs}'],
    plugins: {
      import: importPlugin,
      unicorn,
      promise,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // Imports
      'import/order': ['warn', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      }],
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error',

      // TypeScript strict
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',

      // Promises
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',

      // Unicorn (sélection conservatrice)
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off',         // null est utile
      'unicorn/prevent-abbreviations': 'off',  // trop verbeux

      // Sécurité — pas de console en prod (warn seulement, à activer en CI)
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // Style général
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Tests : règles relâchées
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '*.config.{js,mjs,cjs,ts}',
      '__generated__/**',
    ],
  },
];
