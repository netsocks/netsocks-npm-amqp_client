module.exports = {
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
      },
      "node": {
        "extensions": [".jsx", ".ts", ".tsx"]
      }
    }
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
    'sort-keys-fix',
    'align-import',
  ],
  extends: [
    '@wortise/eslint-config',
    "plugin:import/typescript",
  ],
  'rules': {
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'sort-keys': ['error', 'asc'],
    'sort-keys-fix/sort-keys-fix': 'error',
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": "warn",
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_'
    }],
    "import/no-unresolved": "error",
    "class-methods-use-this": "off",
    '@typescript-eslint/no-use-before-define': 'error',
    'align-import/align-import': 'error',
    'align-import/trim-import': 'error',
    'class-methods-use-this': 'off',
    'import/no-anonymous-default-export': ['error', { allowObject: true }],
    'import/no-cycle': ['error', { maxDepth: 1 }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/order': ['error', {
      'alphabetize': {
        caseInsensitive: true,
        order: 'asc'
      },
      'groups': ['builtin', 'external', 'internal'],
      'newlines-between': 'always',
      'pathGroups': [
        {
          group: 'builtin',
          pattern: 'react',
          position: 'before'
        }
      ],
      'pathGroupsExcludedImportTypes': ['react']
    }],
    "sort-imports": [
      "error",
      {
          "allowSeparatedGroups": true,
          "ignoreCase": true,
          "ignoreDeclarationSort": true,
          "ignoreMemberSort": false,
          "memberSyntaxSortOrder": ['single', 'all', 'multiple', 'none'],
        }
  ]
  },
};

