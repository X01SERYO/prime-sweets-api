/* eslint-env node */
'use strict';

/**
 * Base ESLint config for Node.js + TypeScript.
 * Each section describes what it does and why it is configured that way.
 */
module.exports = {
  // Marks this file as the config root (no .eslintrc lookup in parent folders).
  root: true,

  // Global environments: enables Node and ES2022 globals and related rules.
  env: {
    node: true,   // Node globals (process, __dirname, require, etc.).
    es2022: true, // ES2022 syntax and globals.
  },

  // Parser that understands TypeScript; ESLint uses its AST to apply rules.
  parser: '@typescript-eslint/parser',

  // Parser options: ECMAScript version and module type.
  parserOptions: {
    ecmaVersion: 2022,  // Enables ES2022 syntax.
    sourceType: 'script', // Code as script (CommonJS), not ES modules.
  },

  // Plugin that adds TypeScript-specific rules.
  plugins: ['@typescript-eslint'],

  // Preset rule sets applied in order (later ones can override).
  extends: [
    'eslint:recommended',                        // ESLint recommended rules for JS.
    'plugin:@typescript-eslint/recommended',    // Recommended rules for TypeScript.
  ],

  // Custom rules: error = lint fails, warn = warning, off = disabled.
  rules: {
    // Unused variables: error; arguments starting with _ are ignored (e.g. _req, _res).
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Do not require explicit return types on functions (reduces noise in early code).
    '@typescript-eslint/explicit-function-return-type': 'off',
    // Warn when using the 'any' type (prefer proper typing).
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow require() in addition to import (needed for CommonJS).
    '@typescript-eslint/no-require-imports': 'off',
  },

  // Config that applies only to specific files.
  overrides: [
    {
      // Only for this config file (.eslintrc.js is JavaScript).
      files: ['.eslintrc.js'],
      parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
      rules: {
        // Allow require in this file (CommonJS config).
        '@typescript-eslint/no-require-imports': 'off',
        // Allow require() instead of import in this file.
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],

  // Paths/patterns ESLint does not lint (build output and dependencies).
  ignorePatterns: ['dist', 'node_modules'],
};
