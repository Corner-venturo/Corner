#!/usr/bin/env node
/**
 * Venturo Design System Violation Scanner
 *
 * 掃描程式碼中的設計規範違規
 * 執行方式: node scripts/scan-design-violations.js
 *
 * @see docs/DESIGN_SYSTEM.md
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// 違規模式定義
const VIOLATION_RULES = {
  // CSS 類別違規
  classViolations: [
    {
      name: 'border-gray',
      pattern: /border-gray-\d+/g,
      message: '使用 border-border 代替',
      severity: 'error',
    },
    {
      name: 'bg-gray',
      pattern: /bg-gray-\d+/g,
      message: '使用 bg-morandi-container 或 CSS 變數代替',
      severity: 'error',
    },
    {
      name: 'text-gray',
      pattern: /text-gray-\d+/g,
      message: '使用 text-morandi-secondary 或 text-morandi-primary 代替',
      severity: 'error',
    },
    {
      name: 'rounded-sm',
      pattern: /\brounded-sm\b/g,
      message: '圓角太小，使用 rounded-md 或 rounded-lg',
      severity: 'warn',
    },
    {
      name: 'shadow-xl/2xl',
      pattern: /\bshadow-(xl|2xl)\b/g,
      message: '陰影過度，使用 shadow-lg 或 shadow-md',
      severity: 'warn',
    },
    {
      name: 'rounded-3xl',
      pattern: /\brounded-3xl\b/g,
      message: '圓角過大，使用 rounded-xl 或 rounded-2xl',
      severity: 'warn',
    },
  ],

  // 字體違規
  fontViolations: [
    {
      name: 'system-ui-font',
      pattern: /fontFamily:\s*['"]?system-ui/g,
      message: '請使用 Noto Sans TC 或 CSS 變數字體',
      severity: 'warn',
    },
    {
      name: 'hardcoded-font',
      pattern: /fontFamily:\s*['"]?(PingFang|Microsoft JhengHei|Segoe)/g,
      message: '系統字體不一致，請使用 Google Fonts',
      severity: 'warn',
    },
  ],

  // 列印相關違規
  printViolations: [
    {
      name: 'duplicate-print-css',
      pattern: /@media\s+print\s*\{/g,
      message: '列印樣式應該使用共用的 PrintableWrapper',
      severity: 'info',
    },
  ],

  // 自訂 Modal/Dialog 違規
  modalViolations: [
    {
      name: 'custom-modal-backdrop',
      pattern: /className="[^"]*fixed\s+inset-0[^"]*bg-black[^"]*"/g,
      message: '請使用標準 Dialog 組件，而非自訂遮罩層',
      severity: 'warn',
    },
    {
      name: 'high-z-index-modal',
      pattern: /className="[^"]*z-\[(?:999|9999|10000)\][^"]*"/g,
      message: '避免手動設定極高 z-index，使用標準 Dialog 組件',
      severity: 'warn',
    },
  ],

  // 按鈕圖標違規 (在 Dialog 檔案中)
  buttonViolations: [
    {
      name: 'button-no-icon-save',
      pattern: /<Button[^>]*>\s*(?:儲存|保存|Save)\s*<\/Button>/g,
      message: '儲存按鈕應包含 Save 圖標',
      severity: 'warn',
    },
    {
      name: 'button-no-icon-cancel',
      pattern: /<Button[^>]*variant="outline"[^>]*>\s*取消\s*<\/Button>/g,
      message: '取消按鈕應包含 X 圖標',
      severity: 'warn',
    },
    {
      name: 'button-no-icon-confirm',
      pattern: /<Button[^>]*>\s*(?:確認|Confirm)\s*<\/Button>/g,
      message: '確認按鈕應包含 Check 圖標',
      severity: 'warn',
    },
    {
      name: 'button-no-icon-add',
      pattern: /<Button[^>]*>\s*(?:新增|Add)\s*<\/Button>/g,
      message: '新增按鈕應包含 Plus 圖標',
      severity: 'warn',
    },
    {
      name: 'button-no-icon-delete',
      pattern: /<Button[^>]*>\s*(?:刪除|Delete|確認刪除)\s*<\/Button>/g,
      message: '刪除按鈕應包含 Trash2 圖標',
      severity: 'warn',
    },
  ],

  // 表單標籤違規
  labelViolations: [
    {
      name: 'label-wrong-color',
      pattern: /<label[^>]*className="[^"]*text-morandi-secondary[^"]*"[^>]*>/g,
      message: '表單標籤應使用 text-morandi-primary 而非 text-morandi-secondary',
      severity: 'warn',
    },
  ],
}

// 頁面佈局檢查
async function checkPageLayouts() {
  const pageFiles = await glob('src/app/**/page.tsx', { cwd: process.cwd() })
  const violations = []

  for (const file of pageFiles) {
    // 排除特殊頁面
    if (
      file.includes('/login/') ||
      file.includes('/itinerary/new/') ||
      file.includes('/view/') ||
      file.includes('/confirm/') ||
      file.includes('/m/')
    ) {
      continue
    }

    const content = fs.readFileSync(file, 'utf-8')

    if (!content.includes('StandardPageLayout') && !content.includes('ListPageLayout')) {
      violations.push({
        file,
        line: 1,
        rule: 'prefer-standard-layout',
        message: '頁面應使用 StandardPageLayout 或 ListPageLayout',
        severity: 'warn',
      })
    }
  }

  return violations
}

// 掃描檔案中的違規
async function scanFiles() {
  const files = await glob('src/**/*.{tsx,ts}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
  })

  const allViolations = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    // 檢查每個規則
    for (const category of Object.keys(VIOLATION_RULES)) {
      for (const rule of VIOLATION_RULES[category]) {
        lines.forEach((line, index) => {
          const matches = line.matchAll(rule.pattern)
          for (const match of matches) {
            allViolations.push({
              file,
              line: index + 1,
              column: match.index + 1,
              rule: rule.name,
              match: match[0],
              message: rule.message,
              severity: rule.severity,
            })
          }
        })
      }
    }
  }

  return allViolations
}

// 主函數
async function main() {
  console.log('🔍 Venturo Design System Violation Scanner\n')
  console.log('='.repeat(60))

  // 掃描檔案違規
  console.log('\n📁 掃描 CSS 類別和字體違規...')
  console.log('🔲 掃描自訂 Modal/Dialog 實現...')
  console.log('🔘 掃描按鈕圖標違規...')
  console.log('🏷️  掃描表單標籤一致性...')
  const fileViolations = await scanFiles()

  // 檢查頁面佈局
  console.log('📄 檢查頁面佈局...')
  const layoutViolations = await checkPageLayouts()

  // 合併所有違規
  const allViolations = [...fileViolations, ...layoutViolations]

  // 統計
  const stats = {
    error: allViolations.filter(v => v.severity === 'error').length,
    warn: allViolations.filter(v => v.severity === 'warn').length,
    info: allViolations.filter(v => v.severity === 'info').length,
  }

  // 按檔案分組輸出
  console.log('\n' + '='.repeat(60))
  console.log('📊 違規統計\n')

  console.log(`❌ 錯誤 (Error): ${stats.error}`)
  console.log(`⚠️  警告 (Warn):  ${stats.warn}`)
  console.log(`ℹ️  資訊 (Info):  ${stats.info}`)
  console.log(`📝 總計:         ${allViolations.length}`)

  // 按規則分組
  console.log('\n' + '-'.repeat(60))
  console.log('📋 按規則分組\n')

  const byRule = {}
  for (const v of allViolations) {
    if (!byRule[v.rule]) byRule[v.rule] = []
    byRule[v.rule].push(v)
  }

  for (const [rule, violations] of Object.entries(byRule)) {
    const severity = violations[0].severity
    const icon = severity === 'error' ? '❌' : severity === 'warn' ? '⚠️' : 'ℹ️'
    console.log(`${icon} ${rule}: ${violations.length} 處`)
    console.log(`   ${violations[0].message}`)
    if (violations.length <= 5) {
      for (const v of violations) {
        console.log(`   - ${v.file}:${v.line}`)
      }
    } else {
      for (const v of violations.slice(0, 3)) {
        console.log(`   - ${v.file}:${v.line}`)
      }
      console.log(`   ... 還有 ${violations.length - 3} 處`)
    }
    console.log('')
  }

  // 輸出 JSON 報告
  const reportPath = 'design-violations-report.json'
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        stats,
        violations: allViolations,
      },
      null,
      2
    )
  )
  console.log(`\n📄 詳細報告已輸出至: ${reportPath}`)

  // 退出碼
  if (stats.error > 0) {
    console.log('\n❌ 發現錯誤級別違規，請修復後再提交')
    process.exit(1)
  } else if (stats.warn > 0) {
    console.log('\n⚠️ 發現警告級別違規，建議修復')
    process.exit(0)
  } else {
    console.log('\n✅ 沒有發現違規！')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('掃描發生錯誤:', err)
  process.exit(1)
})
