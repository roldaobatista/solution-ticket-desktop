module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  root: true,
  env: { node: true, jest: true },
  // test/e2e fora do tsconfig.json — ESLint typed-linting não consegue parsear.
  // Asserções de cenarios-aceite foram fortalecidas em commit T5.4.
  ignorePatterns: ['.eslintrc.js', 'dist', 'coverage', 'node_modules', 'test/'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['**/*.spec.ts', 'test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ],
};
