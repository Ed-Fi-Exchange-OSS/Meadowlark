module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['airbnb-base', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.mjs', '.js', '.json', '.ts'],
      },
    },
    'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx'],
  },
  rules: {
    // TODO: setting no-unused-vars to off for now -- eslint-plugin-typescript 1.0.0-rc.2 is plagued with problems with this rule
    'no-unused-vars': 'off',
    'typescript/no-unused-vars': 'off',

    // originally required in the early days of monorepos -- consider revisiting
    'import/no-cycle': 'off',

    // need to dynamically load plugins
    'import/no-dynamic-require': 'off',

    // prettier is handling this
    'max-len': 'off',

    // our loop iterations are rarely independent, and it's a more readable syntax
    'no-await-in-loop': 'off',

    // we almost never do default exports
    'import/prefer-default-export': 'off',

    // relax this to avoid unnecessary temp variables
    'no-param-reassign': [
      2,
      {
        props: false,
      },
    ],

    // prettier issues are warnings here
    'prettier/prettier': 'warn',

    // not sure why this is necessary, became so after upgrading
    'import/extensions': 0,
  },
};
