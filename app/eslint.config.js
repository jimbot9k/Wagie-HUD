import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules (non-type-checked for speed)
  ...tseslint.configs.recommended,

  // Svelte recommended rules
  ...sveltePlugin.configs['flat/recommended'],

  // Global browser + node environments
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Svelte files: use Svelte parser with TS inside <script>
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // TypeScript source files
  {
    files: ['**/*.ts', '**/*.svelte.ts'],
    languageOptions: {
      parser: tseslint.parser,
    },
  },

  // Rule overrides
  {
    rules: {
      // Allow `_` prefixed unused vars (e.g. _tick)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      // Allow explicit `any` in tests and utility code with a warning
      '@typescript-eslint/no-explicit-any': 'warn',
      // new Date() in computation methods is fine; this rule is for reactive state only
      'svelte/prefer-svelte-reactivity': 'off',
    },
  },

  // Ignore build output, coverage, and node_modules
  {
    ignores: ['dist/**', 'dist-desktop/**', 'coverage/**', 'node_modules/**'],
  },
];
