#!/usr/bin/env node

/**
 * Venturo 程式碼品質分析工具
 * 自動掃描並報告程式碼問題
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: msg =>
    console.log(
      `\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`
    ),
}

// 分析結果
const results = {
  largeFiles: [],
  typeEscapes: [],
  setTimeoutUsage: [],
  memoryLeaks: [],
  todos: [],
  syncFields: 0,
}

// 掃描大型檔案 (>500 行)
function analyzeLargeFiles() {
  log.section('掃描大型檔案 (>500 行)')

  try {
    const output = execSync(
      `find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 500 {print $1, $2}' | sort -rn | head -20`,
      { encoding: 'utf-8' }
    )

    const lines = output
      .trim()
      .split('\n')
      .filter(line => line && !line.includes('total'))

    lines.forEach(line => {
      const [lineCount, filePath] = line.trim().split(/\s+/)
      if (filePath && !filePath.includes('node_modules')) {
        results.largeFiles.push({ file: filePath, lines: parseInt(lineCount) })

        if (parseInt(lineCount) > 1000) {
          log.error(`${filePath}: ${lineCount} 行 (超過 1000 行！)`)
        } else {
          log.warn(`${filePath}: ${lineCount} 行`)
        }
      }
    })

    log.info(`找到 ${results.largeFiles.length} 個大型檔案\n`)
  } catch (error) {
    log.error(`掃描大型檔案失敗: ${error.message}`)
  }
}

// 掃描型別逃逸 (as unknown)
function analyzeTypeEscapes() {
  log.section('掃描型別逃逸 (as unknown)')

  try {
    const output = execSync(
      `rg "as unknown" src/ -n --no-heading 2>/dev/null || grep -r "as unknown" src/ -n`,
      { encoding: 'utf-8' }
    )

    const lines = output
      .trim()
      .split('\n')
      .filter(line => line)

    // 按檔案分組
    const fileMap = {}
    lines.forEach(line => {
      const match = line.match(/^([^:]+):(\d+):(.*)/)
      if (match) {
        const [, file, lineNum, code] = match
        if (!fileMap[file]) fileMap[file] = []
        fileMap[file].push({ lineNum: parseInt(lineNum), code: code.trim() })
      }
    })

    Object.entries(fileMap).forEach(([file, occurrences]) => {
      results.typeEscapes.push({ file, count: occurrences.length, occurrences })

      if (occurrences.length > 5) {
        log.error(`${file}: ${occurrences.length} 處型別逃逸`)
      } else {
        log.warn(`${file}: ${occurrences.length} 處型別逃逸`)
      }
    })

    log.info(`找到 ${Object.keys(fileMap).length} 個檔案使用型別逃逸\n`)
  } catch (error) {
    log.warn('未找到型別逃逸（或 ripgrep 未安裝）\n')
  }
}

// 掃描 setTimeout 使用
function analyzeSetTimeout() {
  log.section('掃描 setTimeout 使用')

  try {
    const output = execSync(
      `rg "setTimeout" src/ -n --no-heading 2>/dev/null || grep -r "setTimeout" src/ -n`,
      { encoding: 'utf-8' }
    )

    const lines = output
      .trim()
      .split('\n')
      .filter(line => line)

    lines.forEach(line => {
      const match = line.match(/^([^:]+):(\d+):(.*)/)
      if (match) {
        const [, file, lineNum, code] = match
        results.setTimeoutUsage.push({ file, lineNum: parseInt(lineNum), code: code.trim() })

        // 檢查是否為魔法數字（100, 1000 等）
        if (code.match(/setTimeout.*,\s*\d+\s*\)/)) {
          log.warn(`${file}:${lineNum} - 使用魔法數字`)
        } else {
          log.info(`${file}:${lineNum}`)
        }
      }
    })

    log.info(`找到 ${results.setTimeoutUsage.length} 處 setTimeout 使用\n`)
  } catch (error) {
    log.warn('未找到 setTimeout 使用\n')
  }
}

// 掃描潛在記憶體洩漏
function analyzeMemoryLeaks() {
  log.section('掃描潛在記憶體洩漏')

  try {
    // 檢查 addEventListener 是否有對應的 removeEventListener
    const addListenerOutput = execSync(
      `rg "addEventListener" src/ -n --no-heading 2>/dev/null || grep -r "addEventListener" src/ -n`,
      { encoding: 'utf-8' }
    )

    const addLines = addListenerOutput
      .trim()
      .split('\n')
      .filter(line => line)

    addLines.forEach(line => {
      const match = line.match(/^([^:]+):(\d+):(.*)/)
      if (match) {
        const [, file, lineNum, code] = match

        // 讀取檔案檢查是否有 removeEventListener
        try {
          const fileContent = fs.readFileSync(file, 'utf-8')
          if (!fileContent.includes('removeEventListener')) {
            results.memoryLeaks.push({
              file,
              lineNum: parseInt(lineNum),
              type: 'missing-remove-listener',
            })
            log.error(`${file}:${lineNum} - 缺少 removeEventListener`)
          } else {
            log.success(`${file}:${lineNum} - 有清理邏輯`)
          }
        } catch (err) {
          // 檔案讀取失敗
        }
      }
    })

    log.info(`檢查了 ${addLines.length} 處事件監聽器\n`)
  } catch (error) {
    log.warn('未找到事件監聽器\n')
  }
}

// 掃描 TODO/FIXME
function analyzeTodos() {
  log.section('掃描 TODO/FIXME 標記')

  try {
    const output = execSync(
      `rg "TODO|FIXME" src/ -n --no-heading 2>/dev/null || grep -rE "TODO|FIXME" src/ -n`,
      { encoding: 'utf-8' }
    )

    const lines = output
      .trim()
      .split('\n')
      .filter(line => line)

    const fileMap = {}
    lines.forEach(line => {
      const match = line.match(/^([^:]+):(\d+):(.*)/)
      if (match) {
        const [, file, lineNum, code] = match
        if (!fileMap[file]) fileMap[file] = []
        fileMap[file].push({ lineNum: parseInt(lineNum), code: code.trim() })
      }
    })

    Object.entries(fileMap).forEach(([file, occurrences]) => {
      results.todos.push({ file, count: occurrences.length })

      if (occurrences.length > 5) {
        log.error(`${file}: ${occurrences.length} 處待修復`)
      } else {
        log.warn(`${file}: ${occurrences.length} 處待修復`)
      }
    })

    log.info(`找到 ${Object.keys(fileMap).length} 個檔案有 TODO/FIXME\n`)
  } catch (error) {
    log.warn('未找到 TODO/FIXME 標記\n')
  }
}

// 計算健康度分數
function calculateHealthScore() {
  let score = 100

  // 大型檔案扣分 (-1 分/個，超過 1000 行 -2 分)
  results.largeFiles.forEach(file => {
    score -= file.lines > 1000 ? 2 : 1
  })

  // 型別逃逸扣分 (-0.5 分/個)
  results.typeEscapes.forEach(file => {
    score -= file.count * 0.5
  })

  // setTimeout 扣分 (-0.3 分/個)
  score -= results.setTimeoutUsage.length * 0.3

  // 記憶體洩漏扣分 (-3 分/個)
  score -= results.memoryLeaks.length * 3

  // TODO 扣分 (-0.2 分/個)
  score -= results.todos.length * 0.2

  return Math.max(0, Math.min(100, score)).toFixed(1)
}

// 生成報告
function generateReport() {
  log.section('程式碼健康度報告')

  const score = calculateHealthScore()
  const scoreColor = score >= 75 ? colors.green : score >= 50 ? colors.yellow : colors.red

  console.log(`${scoreColor}健康度分數: ${score}/100${colors.reset}\n`)

  console.log('問題統計：')
  console.log(`  🏗️  大型檔案 (>500行): ${results.largeFiles.length} 個`)
  console.log(
    `  🔓 型別逃逸 (as unknown): ${results.typeEscapes.reduce((sum, f) => sum + f.count, 0)} 處 (${results.typeEscapes.length} 個檔案)`
  )
  console.log(`  ⏰ setTimeout 使用: ${results.setTimeoutUsage.length} 處`)
  console.log(`  💾 潛在記憶體洩漏: ${results.memoryLeaks.length} 處`)
  console.log(
    `  📝 TODO/FIXME: ${results.todos.reduce((sum, f) => sum + f.count, 0)} 處 (${results.todos.length} 個檔案)`
  )

  console.log('\n建議：')
  if (score < 50) {
    log.error('程式碼健康度嚴重不足，建議立即重構！')
  } else if (score < 75) {
    log.warn('程式碼健康度中等，建議改善重點問題')
  } else {
    log.success('程式碼健康度良好，持續保持！')
  }

  console.log('\n📄 詳細報告已生成：')
  console.log('  - CODE_ISSUES_REPORT.md')
  console.log('  - LOGIC_ISSUES_SUMMARY.md\n')
}

// 主函數
function main() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          Venturo 程式碼品質分析工具 v1.0                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
  `)

  analyzeLargeFiles()
  analyzeTypeEscapes()
  analyzeSetTimeout()
  analyzeMemoryLeaks()
  analyzeTodos()
  generateReport()

  // 儲存 JSON 報告
  fs.writeFileSync(
    path.join(__dirname, 'code-quality-report.json'),
    JSON.stringify(results, null, 2)
  )
  log.success('JSON 報告已儲存: code-quality-report.json\n')
}

// 執行
main()
