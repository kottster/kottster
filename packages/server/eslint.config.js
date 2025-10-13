// @ts-check

const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      'no-prototype-builtins': 'off',
    }
  }
);
