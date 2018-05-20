const jsxA11y = require('eslint-plugin-jsx-a11y')

const a11yRules = Object.keys(jsxA11y.rules).reduce((result, rule) => {
  result[`jsx-a11y/${rule}`] = 'off'
  return result
}, {})

module.exports = {
  extends: 'airbnb',
  parser: 'babel-eslint',
  env: {
    'browser': true,
    'webextensions': true
  },
  settings: {
    'import/resolver': 'webpack'
  },
  rules: {
    'arrow-parens': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'consistent-return': 'off',
    'max-len': ['error', 120],
    'no-mixed-operators': [
      'error',
      {
        groups: [
          ['&', '|', '^', '~', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
          ['&&', '||'],
          ['in', 'instanceof']
        ],
        allowSamePrecedence: true
      }
    ],
    'no-param-reassign': ['error', { props: false }],
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'all',
        ignoreRestSiblings: false,
        varsIgnorePattern: '^h$',
        argsIgnorePattern: '^_+$'
      }
    ],
    'object-curly-newline': 'off',
    'object-shorthand': ['error', 'always'],
    'semi': ['error', 'never'],
    'react/jsx-closing-bracket-location': [
      'error',
      {
        selfClosing: 'tag-aligned',
        nonEmpty: 'after-props'
      }
    ],
    'react/jsx-tag-spacing': ['error', { beforeSelfClosing: 'never' }],
    'react/no-unused-state': 'off',
    'react/prefer-stateless-function': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    ...a11yRules
  }
}
