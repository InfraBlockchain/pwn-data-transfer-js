module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  globals: {
    __DEV__: true,
    __VERSION__: true,
    __COMMIT_SHA__: true,
    __BUILD_DATE__: true,
  },
  plugins: [
    '@stylistic',
    '@stylistic/ts',
    '@stylistic/eslint-plugin-ts',
    '@stylistic/migrate',
    'eslint-plugin-tsdoc',
    'prettier',
  ],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:jest/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  reportUnusedDisableDirectives: true,
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    curly: ['error', 'all'],
    'tsdoc/syntax': 'warn',
    '@typescript-eslint/no-unused-vars': [2, { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'generator-star-spacing': ['error', { before: false, after: true }],
    'space-before-function-paren': 'off',
    'no-dupe-class-members': 'off',
    'no-useless-constructor': 'off',
    '@stylistic/no-useless-constructor': 'off',
    'prettier/prettier': ['error'],
    'max-len': ['warn', { code: 120 }],
    'lines-between-class-members': ['error', 'always'],
    'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'return' }],
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        accessibility: 'no-public',
      },
    ],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
      },
    ],
    '@typescript-eslint/no-non-null-assertion': [2],
    '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
    '@stylistic/ts/quotes': ['error', 'backtick'],
    'jest/no-focused-tests': 'warn',
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
