// ESLint flat config: qualidade + regras de segurança (eslint-plugin-security)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', '.serverless/**', 'eslint.config.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs.recommended,
  {
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-console': 'error',
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
