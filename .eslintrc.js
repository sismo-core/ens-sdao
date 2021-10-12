module.exports = {
  env: {
    browser: true,
    es6: true,
    mocha: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: "./tsconfig.json",
  },
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  rules: {},
};