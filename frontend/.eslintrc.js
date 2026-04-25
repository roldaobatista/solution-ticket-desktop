module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'prettier'],
  ignorePatterns: ['.next', 'node_modules', 'out', 'dist', 'coverage', 'e2e/test-results'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        // Q4: elevado para 'error' apos limpeza F5 (39->0). Casos legitimos
        // devem usar Record<string, unknown> ou tipo explicito; ultima saida
        // e // eslint-disable-next-line com justificativa.
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
};
