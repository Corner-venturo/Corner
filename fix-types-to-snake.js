#!/usr/bin/env node

/**
 * 批量修復 TypeScript 類型定義
 * 將所有 camelCase 改為 snake_case
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 要修改的類型檔案
const typeFiles = [
  'src/types/*.types.ts',
  'src/stores/types.ts',
  'src/lib/db/types.ts',
  'src/types/**/*.ts'
];

// camelCase → snake_case 對照表
const replacements = {
  // Order 相關
  'contactPerson': 'contact_person',
  'tourId': 'tour_id',
  'orderId': 'order_id',
  'tourName': 'tour_name',
  'totalAmount': 'total_amount',
  'paymentStatus': 'payment_status',
  'remainingAmount': 'remaining_amount',
  'paidAmount': 'paid_amount',
  'memberCount': 'member_count',
  'salesPerson': 'sales_person',
  'orderNumber': 'order_number',

  // 時間相關
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'deletedAt': 'deleted_at',
  'departureDate': 'departure_date',
  'returnDate': 'return_date',
  'requestDate': 'request_date',

  // User 相關
  'employeeNumber': 'employee_number',
  'englishName': 'english_name',
  'chineseName': 'chinese_name',
  'personalInfo': 'personal_info',
  'jobInfo': 'job_info',
  'salaryInfo': 'salary_info',
  'passwordHash': 'password_hash',
  'nationalId': 'national_id',
  'emergencyContact': 'emergency_contact',

  // Payment 相關
  'unitPrice': 'unit_price',
  'supplierId': 'supplier_id',
  'supplierName': 'supplier_name',
  'paymentMethod': 'payment_method',
  'requestNumber': 'request_number',
  'itemNumber': 'item_number',

  // Quote 相關
  'groupSize': 'group_size',
  'pricePerPerson': 'price_per_person',
  'totalCost': 'total_cost',
  'accommodationDays': 'accommodation_days',
  'guideLanguage': 'guide_language',

  // Tour 相關
  'maxParticipants': 'max_participants',
  'currentParticipants': 'current_participants',
  'tourCode': 'tour_code',
  'isSpecial': 'is_special',

  // Finance 相關
  'invoiceNumber': 'invoice_number',
  'taxType': 'tax_type',
  'buyerInfo': 'buyer_info',
  'sellerInfo': 'seller_info',
  'itemCount': 'item_count',
  'itemPrice': 'item_price',
  'itemName': 'item_name',

  // Supplier 相關
  'priceList': 'price_list',
  'contactInfo': 'contact_info',
  'bankAccount': 'bank_account',

  // Database 相關
  'isActive': 'is_active',
  'isVip': 'is_vip',
  'isDeleted': 'is_deleted',
  'sortOrder': 'sort_order',

  // Template 相關
  'templateId': 'template_id',
  'fieldMappings': 'field_mappings',
  'paperSettings': 'paper_settings',
  'usageCount': 'usage_count',
  'generatedAt': 'generated_at',

  // Calendar 相關
  'eventType': 'event_type',
  'startDate': 'start_date',
  'endDate': 'end_date',
  'allDay': 'all_day'
};

// 執行修復
function fixTypeFiles() {
  console.log('🔧 開始修復 TypeScript 類型定義...\n');

  let totalFixed = 0;
  let filesFixed = 0;

  typeFiles.forEach(pattern => {
    const files = glob.sync(pattern);

    files.forEach(file => {
      if (!fs.existsSync(file)) return;

      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content;
      let fixCount = 0;

      // 修復 interface 和 type 定義
      Object.keys(replacements).forEach(camelCase => {
        const snakeCase = replacements[camelCase];

        // 修復屬性定義（在 interface 或 type 中）
        // 例如: contactPerson: string → contact_person: string
        const propertyRegex = new RegExp(`\\b${camelCase}(\\??):\\s*`, 'g');
        const newContent = content.replace(propertyRegex, (match, optional) => {
          fixCount++;
          return `${snakeCase}${optional}: `;
        });
        content = newContent;

        // 修復屬性訪問（可選，看是否需要）
        // 例如: Omit<Order, "contactPerson"> → Omit<Order, "contact_person">
        const omitRegex = new RegExp(`"${camelCase}"`, 'g');
        content = content.replace(omitRegex, (match) => {
          fixCount++;
          return `"${snakeCase}"`;
        });
      });

      if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`✅ ${path.basename(file)}: 修復了 ${fixCount} 處`);
        totalFixed += fixCount;
        filesFixed++;
      }
    });
  });

  console.log(`\n📊 修復統計：`);
  console.log(`   檔案數：${filesFixed}`);
  console.log(`   修復數：${totalFixed}`);
  console.log(`\n✨ 類型修復完成！`);
}

// 建立備份
function backupTypes() {
  console.log('📦 建立備份...');
  const backupDir = 'types-backup-' + new Date().getTime();

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 複製 types 資料夾
  const typesDir = 'src/types';
  if (fs.existsSync(typesDir)) {
    fs.cpSync(typesDir, path.join(backupDir, 'types'), { recursive: true });
    console.log(`✅ 備份已建立: ${backupDir}`);
  }
}

// 驗證修復結果
function validateFix() {
  console.log('\n🔍 驗證修復結果...');

  // 執行 TypeScript 編譯檢查
  const { execSync } = require('child_process');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript 編譯成功！');
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : '';
    const errorCount = (output.match(/error TS/g) || []).length;
    console.log(`⚠️  還有 ${errorCount} 個 TypeScript 錯誤`);

    // 分析剩餘錯誤類型
    const snakeErrors = (output.match(/Property '[a-z_]+' does not exist/g) || []).length;
    const camelErrors = (output.match(/Property '[a-zA-Z]+' does not exist/g) || []).length;

    console.log(`   - snake_case 相關: ${snakeErrors}`);
    console.log(`   - 其他錯誤: ${errorCount - snakeErrors}`);
  }
}

// 主程式
function main() {
  console.log('🚀 Venturo TypeScript 類型修復工具');
  console.log('===================================\n');

  // 1. 建立備份
  backupTypes();

  // 2. 執行修復
  fixTypeFiles();

  // 3. 驗證結果
  validateFix();

  console.log('\n💡 下一步建議：');
  console.log('1. 執行 npm run dev 測試功能');
  console.log('2. 如果有問題，可以從 types-backup-* 還原');
  console.log('3. 剩餘的錯誤可以用 @ts-ignore 暫時忽略');
}

// 執行
main();
