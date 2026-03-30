import nestjsTyped from '@darraghor/eslint-plugin-nestjs-typed';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'node_modules',
      'dist/**',
      'eslint.config.mjs',
      'commitlint.config.js',
      'prisma.config.ts',
      'jest.config.ts',
      'lint-staged.config.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...nestjsTyped.configs.flatRecommended,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-extraneous-class': 'off',
      // Reglas de NestJS Plugin
      '@darraghor/nestjs-typed/injectable-should-be-provided': 'off',
      '@darraghor/nestjs-typed/api-method-should-have-api-response': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
