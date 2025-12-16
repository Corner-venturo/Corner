import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
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
      '*.config.ts',
      'lint-report.json',
      'scripts/**', // 忽略所有腳本
      'tools/**',
      '.storybook/**',
      'src/stories/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'src/lib/db/verify-and-fix.ts',
      'src/lib/performance/memory-manager.ts',
      'src/lib/performance/monitor.ts',
      'analyze-code-quality.js',
      'auto-fix-code.js',
    ],
  },

  // 推薦的基礎設定 (JS + TS)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // next-env.d.ts 特殊處理（Next.js 自動生成，不能改）
  {
    files: ['next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // 客製化與覆蓋規則
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // 暫時保留原設定中被放寬的規則，以避免一次性出現大量新錯誤
      'prefer-const': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react-hooks/rules-of-hooks': 'off', // 建議在下一階段開啟 (error)
      'react-hooks/exhaustive-deps': 'off', // 建議在下一階段開啟 (warn)

      // 暫時禁用頑固的 no-undef 規則，以便專注於其他問題
      'no-undef': 'off',

      // 保留部分原有規則
      'no-var': 'error',
      'no-console': 'off', // 開發階段暫時允許

      // 關閉與 Prettier 衝突或不需要的規則
      'quotes': 'off',
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      'no-useless-catch': 'off',
      'no-async-promise-executor': 'off',
      'no-irregular-whitespace': 'off',
      'no-redeclare': 'off',
      'no-empty': 'off',
    },
  },

  // Prettier 整合 (必須放在最後)
  prettierConfig,
);

