module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "default",
        format: null,
      },
      {
        selector: "variable",
        format: ["PascalCase", "UPPER_CASE"],
        types: ["boolean"],
        prefix: ["is", "should", "has", "can", "did", "will"],
      },
      {
        selector: "variableLike",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
      },

      {
        selector: "parameter",
        format: ["camelCase"],
      },
      {
        selector: "memberLike",
        modifiers: ["private"],
        format: ["camelCase"],
        leadingUnderscore: "forbid",
      },
      {
        selector: "typeLike",
        format: ["PascalCase"],
      },
      {
        selector: "property",
        modifiers: ["readonly"],
        format: ["PascalCase"],
      },
      {
        selector: "enumMember",
        format: ["UPPER_CASE"],
      },
    ],
  },
};
