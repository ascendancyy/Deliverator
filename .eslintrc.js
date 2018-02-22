module.exports = {
  root: true,
  settings: {
    'import/extensions': ['.js', '.vue'],
    'import/resolver': {
      webpack: {
        config: 'config/webpack.base.js',
      },
    },
  },
  extends: [
    'airbnb-base',
    'plugin:vue/recommended',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module',
    allowImportExportEverywhere: true,
  },
  rules: {
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'operator-linebreak': ['warn', 'after'],

    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    'no-unused-vars': 'warn',
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: [
        'state', // for vuex state
        'acc', // for reduce accumulators
        'el', // for el.style
      ],
    }],

    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true,
    }],
    'import/extensions': ['error', 'always', {
      js: 'never',
      vue: 'never',
    }],

    'vue/order-in-components': 'error',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'error',
    'vue/require-v-for-key': 'error',
    'vue/max-attributes-per-line': [2, {
      singleline: 1,
      multiline: {
        max: 1,
        allowFirstLine: false,
      },
    }],
  },
};
