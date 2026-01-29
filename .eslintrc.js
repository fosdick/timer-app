// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'expo',
        'plugin:@typescript-eslint/recommended',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
      },
      plugins: ['@typescript-eslint'],
      rules: {
        // Add custom TypeScript-specific rules here
      },
    },
  ],
};
