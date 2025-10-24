import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default [
  // 全域忽略
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'out/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.mjs',
      'lint-report.json',
      'scripts/archive/**',  // 忽略舊腳本
    ],
  },

  // JavaScript 檔案（Node.js 環境）
  {
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',  // Scripts 允許 console
    },
  },

  // JavaScript/TypeScript 基礎規則
  js.configs.recommended,

  // TypeScript 檔案配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        location: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // Node.js globals
        process: 'readonly',
        // IndexedDB
        indexedDB: 'readonly',
        IDBKeyRange: 'readonly',
        // React (globally available in Next.js)
        React: 'readonly',
        JSX: 'readonly',
        // Web APIs
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        performance: 'readonly',
        // TypeScript / Node types
        NodeJS: 'readonly',
        // Node.js (for some utilities)
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
    },
    rules: {
      // Console 規則（開發階段放寬）
      'no-console': 'off',  // Phase 1: 先允許，Phase 2 改為 warn

      // 變數規則
      'prefer-const': 'off',
      'no-var': 'error',
      'no-unused-vars': 'off',  // 關閉基礎規則，使用 TS 版本
      '@typescript-eslint/no-unused-vars': 'off',

      // TypeScript 規則 (Phase 1: 警告)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // 引號規則
      'quotes': 'off',

      // React Hooks 規則 (Phase 1: 警告，Phase 2 改為 error)
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',

      // 其他規則調整
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',  // switch case 中的宣告
      'no-useless-catch': 'off',
      'no-async-promise-executor': 'off',
      'no-irregular-whitespace': 'off',
      'no-redeclare': 'off',
    },
  },

  // Prettier 整合
  prettierConfig,
];
