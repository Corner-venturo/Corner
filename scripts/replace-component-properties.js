/**
 * Step 4: 全域替換組件中的屬性訪問
 *
 * 使用方式：
 * node scripts/replace-component-properties.js [--dry-run]
 *
 * --dry-run: 只顯示會修改什麼，不實際修改
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 載入欄位對應表
const { FIELD_MAP } = require('./snake-case-field-map');

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * 替換檔案中的屬性訪問
 */
function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const changes = [];

  Object.entries(FIELD_MAP).forEach(([camel, snake]) => {
    // 模式 1: 物件屬性訪問 (.property)
    const regex1 = new RegExp(`\\.${camel}\\b`, 'g');
    const matches1 = content.match(regex1);
    if (matches1) {
      content = content.replace(regex1, `.${snake}`);
      changed = true;
      changes.push(`  .${camel} → .${snake} (${matches1.length}次)`);
    }

    // 模式 2: 物件字面量 ({ property: value })
    const regex2 = new RegExp(`([\\s{,])${camel}:`, 'g');
    const matches2 = content.match(regex2);
    if (matches2) {
      content = content.replace(regex2, `$1${snake}:`);
      changed = true;
      changes.push(`  ${camel}: → ${snake}: (${matches2.length}次)`);
    }

    // 模式 3: 解構賦值 ({ property })
    // 注意：這個比較複雜，需要小心處理
    const regex3 = new RegExp(`{([^}]*\\s)${camel}([,\\s}])`, 'g');
    const matches3 = content.match(regex3);
    if (matches3) {
      content = content.replace(regex3, `{$1${snake}$2`);
      changed = true;
      changes.push(`  { ${camel} } → { ${snake} } (${matches3.length}次)`);
    }
  });

  if (changed) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content);
    }
    console.log(`\n${DRY_RUN ? '📋' : '✅'} ${path.relative(process.cwd(), filePath)}`);
    changes.forEach(change => console.log(change));
    return 1;
  }

  return 0;
}

/**
 * 主程式
 */
function main() {
  console.log('='.repeat(60));
  console.log(`🔄 ${DRY_RUN ? '預覽' : '開始'}替換組件屬性為 snake_case`);
  console.log('='.repeat(60));

  // 尋找所有需要處理的檔案
  const patterns = [
    'src/components/**/*.tsx',
    'src/app/**/*.tsx',
    'src/app/**/*.ts',
    'src/stores/**/*.ts',
    'src/features/**/*.ts',
    'src/features/**/*.tsx',
    'src/lib/**/*.ts'
  ];

  // 排除某些檔案
  const ignore = [
    'src/types/**',
    'node_modules/**',
    '**/*.test.ts',
    '**/*.test.tsx'
  ];

  let allFiles = [];
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore });
    allFiles = allFiles.concat(files);
  });

  // 去重
  allFiles = [...new Set(allFiles)];

  console.log(`\n📋 找到 ${allFiles.length} 個檔案\n`);

  let modifiedCount = 0;
  allFiles.forEach(file => {
    modifiedCount += replaceInFile(file);
  });

  console.log('\n' + '='.repeat(60));
  if (DRY_RUN) {
    console.log(`📋 預覽完成：將修改 ${modifiedCount} 個檔案`);
    console.log('執行實際修改：node scripts/replace-component-properties.js');
  } else {
    console.log(`✅ 完成：已修改 ${modifiedCount} 個檔案`);
    console.log('下一步：npm run type-check');
  }
  console.log('='.repeat(60) + '\n');
}

// 執行
if (require.main === module) {
  main();
}

module.exports = { replaceInFile };
