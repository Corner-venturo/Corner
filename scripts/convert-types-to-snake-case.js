/**
 * Step 2: 轉換 TypeScript 型別定義為 snake_case
 *
 * 使用方式：
 * node scripts/convert-types-to-snake-case.js
 */

const fs = require('fs');
const path = require('path');

// 載入欄位對應表
const { FIELD_MAP } = require('./snake-case-field-map');

/**
 * 將 camelCase 轉換為 snake_case
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 轉換檔案中的型別定義
 */
function convertFile(filePath) {
  console.log(`\n處理檔案: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;

  // 使用對應表替換
  Object.entries(FIELD_MAP).forEach(([camel, snake]) => {
    // 模式 1: 獨立欄位定義（interface 中）
    const regex1 = new RegExp(`^(\\s+)${camel}([?:]\\s)`, 'gm');
    if (regex1.test(content)) {
      content = content.replace(regex1, `$1${snake}$2`);
      changeCount++;
      console.log(`  ✅ ${camel} → ${snake}`);
    }
  });

  // 儲存修改
  if (changeCount > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 完成：${changeCount} 個欄位已轉換`);
    return changeCount;
  } else {
    console.log(`⚪ 跳過：無需修改`);
    return 0;
  }
}

/**
 * 主程式
 */
function main() {
  const typesDir = path.join(__dirname, '../src/types');

  console.log('='.repeat(60));
  console.log('🔄 開始轉換 TypeScript 型別定義為 snake_case');
  console.log('='.repeat(60));

  // 取得所有 .ts 檔案
  const files = fs.readdirSync(typesDir)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .map(f => path.join(typesDir, f));

  console.log(`\n📋 找到 ${files.length} 個檔案\n`);

  let totalChanges = 0;
  files.forEach(file => {
    totalChanges += convertFile(file);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ 轉換完成！總共修改 ${totalChanges} 個欄位`);
  console.log('='.repeat(60));
  console.log('\n下一步：執行 npm run type-check 檢查錯誤\n');
}

// 執行
if (require.main === module) {
  main();
}

module.exports = { convertFile, camelToSnake };
