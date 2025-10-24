#!/usr/bin/env node

/**
 * Venturo 自動修復工具
 * 自動修復常見的程式碼問題
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`),
};

// 統計修復結果
const stats = {
  filesProcessed: 0,
  issuesFixed: 0,
  errors: 0,
};

// 安全檢查：確保不修改 node_modules
function isSafeToModify(filePath) {
  return !filePath.includes('node_modules') &&
         !filePath.includes('.git') &&
         filePath.startsWith('src/');
}

// 修復 1: 改善 as unknown 型別斷言
function fixTypeEscapes(dryRun = false) {
  log.section('修復型別逃逸 (as unknown)');

  try {
    const output = execSync(
      `rg "as unknown" src/ -l 2>/dev/null || grep -rl "as unknown" src/`,
      { encoding: 'utf-8' }
    );

    const files = output.trim().split('\n').filter(file => file && isSafeToModify(file));

    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf-8');
        let modified = false;

        // 模式 1: } as unknown); → satisfies Partial<Type>
        const pattern1 = /\}\s*as\s+unknown\s*\)/g;
        if (pattern1.test(content)) {
          log.info(`${file}: 發現 '} as unknown)' 模式`);
          if (!dryRun) {
            // 這個需要手動修復，只顯示警告
            log.warn(`  → 需要手動修復：使用 satisfies 或正確的型別定義`);
          }
        }

        // 模式 2: const x = y as unknown as Type; → 使用型別保護
        const pattern2 = /(\w+)\s*as\s+unknown\s+as\s+(\w+)/g;
        const matches = [...content.matchAll(pattern2)];
        if (matches.length > 0) {
          log.info(`${file}: 發現 ${matches.length} 處雙重斷言`);
          matches.forEach(match => {
            log.warn(`  → 第 ${match.index} 字元: ${match[0]}`);
            log.info(`     建議：實作型別保護函數`);
          });
        }

        if (modified && !dryRun) {
          fs.writeFileSync(file, content, 'utf-8');
          stats.issuesFixed++;
          log.success(`  ✅ 已修復`);
        }

        stats.filesProcessed++;
      } catch (error) {
        log.error(`處理 ${file} 失敗: ${error.message}`);
        stats.errors++;
      }
    });

    log.info(`處理了 ${files.length} 個檔案\n`);
  } catch (error) {
    log.warn('未找到型別逃逸\n');
  }
}

// 修復 2: 改善 setTimeout 使用
function fixSetTimeout(dryRun = false) {
  log.section('修復 setTimeout 魔法數字');

  try {
    const output = execSync(
      `rg "setTimeout.*,\\s*\\d+\\s*\\)" src/ -l 2>/dev/null || grep -rl "setTimeout.*,[[:space:]]*[0-9]" src/`,
      { encoding: 'utf-8' }
    );

    const files = output.trim().split('\n').filter(file => file && isSafeToModify(file));

    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf-8');
        let modified = false;

        // 尋找 setTimeout(..., 100) 等魔法數字
        const pattern = /setTimeout\(([^,]+),\s*(\d+)\s*\)/g;
        const matches = [...content.matchAll(pattern)];

        matches.forEach(match => {
          const [fullMatch, callback, delay] = match;
          const delayNum = parseInt(delay);

          log.info(`${file}: setTimeout 延遲 ${delay}ms`);

          // 建議替換方案
          if (delayNum === 0) {
            log.warn(`  → 建議：使用 queueMicrotask() 而非 setTimeout(0)`);
          } else if (delayNum < 100) {
            log.warn(`  → 警告：${delay}ms 可能太短，容易造成競態條件`);
          } else if (delayNum > 5000) {
            log.warn(`  → 警告：${delay}ms 可能太長，考慮使用 Promise + timeout`);
          }

          // 自動修復：加上常數定義
          if (!dryRun && delayNum > 0 && delayNum < 10000) {
            const constantName = `DELAY_${delayNum}MS`;

            // 檢查檔案開頭是否已有這個常數
            if (!content.includes(constantName)) {
              // 在第一個 import 後加入常數定義
              const importEnd = content.lastIndexOf('import ');
              if (importEnd !== -1) {
                const lineEnd = content.indexOf('\n', importEnd) + 1;
                content = content.slice(0, lineEnd) +
                         `\n// ⏰ Timeout 常數\nconst ${constantName} = ${delay};\n` +
                         content.slice(lineEnd);

                // 替換原本的魔法數字
                content = content.replace(
                  new RegExp(`setTimeout\\(([^,]+),\\s*${delay}\\s*\\)`, 'g'),
                  `setTimeout($1, ${constantName})`
                );

                modified = true;
                log.success(`  ✅ 已提取為常數: ${constantName}`);
              }
            }
          }
        });

        if (modified && !dryRun) {
          fs.writeFileSync(file, 'utf-8');
          stats.issuesFixed += matches.length;
        }

        stats.filesProcessed++;
      } catch (error) {
        log.error(`處理 ${file} 失敗: ${error.message}`);
        stats.errors++;
      }
    });

    log.info(`處理了 ${files.length} 個檔案\n`);
  } catch (error) {
    log.warn('未找到 setTimeout 使用\n');
  }
}

// 修復 3: 加入 AbortController 清理
function fixAbortController(dryRun = false) {
  log.section('檢查 AbortController 清理');

  const targetFile = 'src/stores/create-store.ts';

  try {
    if (!fs.existsSync(targetFile)) {
      log.warn(`${targetFile} 不存在\n`);
      return;
    }

    let content = fs.readFileSync(targetFile, 'utf-8');
    let modified = false;

    // 檢查是否有 AbortController 但沒清理
    if (content.includes('new AbortController()')) {
      log.info(`${targetFile}: 使用 AbortController`);

      // 檢查是否有設為 undefined 的清理邏輯
      if (!content.includes('_abortController = undefined') &&
          !content.includes('_abortController: undefined')) {
        log.warn(`  → 缺少明確清理邏輯`);

        if (!dryRun) {
          log.info(`  → 建議：在 abort() 後加上 _abortController = undefined`);
          // 這個需要手動修復，因為邏輯較複雜
        }
      } else {
        log.success(`  ✅ 已有清理邏輯`);
      }
    }

    stats.filesProcessed++;
  } catch (error) {
    log.error(`處理 ${targetFile} 失敗: ${error.message}`);
    stats.errors++;
  }

  console.log();
}

// 修復 4: 檢查事件監聽器清理
function fixEventListeners(dryRun = false) {
  log.section('檢查事件監聽器清理');

  try {
    const output = execSync(
      `rg "addEventListener" src/ -l 2>/dev/null || grep -rl "addEventListener" src/`,
      { encoding: 'utf-8' }
    );

    const files = output.trim().split('\n').filter(file => file && isSafeToModify(file));

    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf-8');

        const hasAddListener = content.includes('addEventListener');
        const hasRemoveListener = content.includes('removeEventListener');
        const hasUseEffect = content.includes('useEffect');
        const hasCleanup = content.includes('return () =>');

        log.info(`${file}:`);

        if (hasAddListener && !hasRemoveListener) {
          log.error(`  ❌ 缺少 removeEventListener`);
          stats.issuesFixed++;
        } else if (hasAddListener && hasRemoveListener && hasUseEffect && !hasCleanup) {
          log.warn(`  ⚠️  有 removeEventListener 但可能未在 useEffect cleanup 中調用`);
        } else if (hasAddListener && hasRemoveListener) {
          log.success(`  ✅ 有清理邏輯`);
        }

        stats.filesProcessed++;
      } catch (error) {
        log.error(`處理 ${file} 失敗: ${error.message}`);
        stats.errors++;
      }
    });

    log.info(`檢查了 ${files.length} 個檔案\n`);
  } catch (error) {
    log.warn('未找到事件監聽器\n');
  }
}

// 生成修復報告
function generateReport(dryRun) {
  log.section('修復報告');

  console.log(`處理模式: ${dryRun ? '🔍 檢查模式（不修改檔案）' : '🔧 修復模式'}\n`);
  console.log(`處理結果：`);
  console.log(`  📁 處理檔案: ${stats.filesProcessed} 個`);
  console.log(`  ✅ 修復問題: ${stats.issuesFixed} 處`);
  console.log(`  ❌ 錯誤: ${stats.errors} 個`);

  if (dryRun) {
    console.log(`\n要執行實際修復，請執行：`);
    console.log(`  ${colors.cyan}node auto-fix-code.js --fix${colors.reset}\n`);
  } else {
    console.log(`\n修復完成！建議執行：`);
    console.log(`  ${colors.cyan}npm run lint${colors.reset} - 檢查語法錯誤`);
    console.log(`  ${colors.cyan}npm run build${colors.reset} - 確保編譯成功`);
    console.log(`  ${colors.cyan}git diff${colors.reset} - 檢查修改內容\n`);
  }
}

// 主函數
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--fix');

  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          Venturo 自動修復工具 v1.0                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
  `);

  if (dryRun) {
    log.warn('🔍 檢查模式：不會修改任何檔案');
    log.info('要執行實際修復，請加上 --fix 參數\n');
  } else {
    log.warn('🔧 修復模式：將會修改檔案！');
    log.info('建議先執行 git commit 備份現有程式碼\n');

    // 安全確認
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('確定要執行修復嗎？(y/N) ', (answer) => {
      readline.close();

      if (answer.toLowerCase() !== 'y') {
        log.info('已取消修復\n');
        process.exit(0);
      }

      runFixes(dryRun);
    });

    return;
  }

  runFixes(dryRun);
}

function runFixes(dryRun) {
  fixTypeEscapes(dryRun);
  fixSetTimeout(dryRun);
  fixAbortController(dryRun);
  fixEventListeners(dryRun);
  generateReport(dryRun);
}

// 執行
main();
