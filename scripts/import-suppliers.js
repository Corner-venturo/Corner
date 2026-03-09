/**
 * 供應商資料匯入腳本
 * 從 CSV 檔案匯入供應商到 Supabase
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const { getBankName } = require('./bank-codes')

// UUID 生成函數
function generateUUID() {
  return crypto.randomUUID()
}

// Supabase 連接
const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 供應商類型對應
 */
const TYPE_MAPPING = {
  B2B: 'agency', // 旅行社（同業）
  Traffic: 'transport', // 交通
  Activity: 'attraction', // 活動/景點
  Hotel: 'hotel', // 飯店
  Food: 'restaurant', // 餐飲
  Employee: 'employee', // 員工（薪資請款用）
  Other: 'other', // 其他
}

/**
 * 轉換供應商類型
 */
function convertSupplierType(oldType) {
  if (!oldType) return 'other'
  const mapped = TYPE_MAPPING[oldType]
  if (mapped) return mapped

  // 處理日文或其他特殊類型
  console.log(`⚠️  未知類型: ${oldType}，轉為 'other'`)
  return 'other'
}

/**
 * 轉換單筆供應商資料
 */
function transformSupplier(csvRow) {
  const bankCode = csvRow.bank_code?.trim() || null
  const bankName = bankCode ? getBankName(bankCode) : null

  return {
    // ID (自動生成)
    id: generateUUID(),

    // 基本資訊
    code: csvRow.supplier_code || null,
    name: csvRow.supplier_name || '未命名供應商',
    name_en: null,
    type: convertSupplierType(csvRow.supplier_type),

    // 聯絡資訊（舊資料沒有，留空）
    contact_person: csvRow.account_name || null, // 帳戶名稱暫時當聯絡人
    phone: null,
    email: null,
    address: null,
    website: null,

    // 財務資訊
    tax_id: null,
    bank_name: bankName, // 轉換後的銀行名稱
    bank_account: csvRow.account_code || null,
    payment_terms: null,
    currency: 'TWD', // 預設台幣

    // 評級與狀態
    rating: null,
    is_preferred: false,
    is_active: true,
    display_order: 0,

    // 備註（保留舊系統的 is_quoted 資訊）
    notes: csvRow.is_quoted === 'true' ? '舊系統已報價' : null,

    // 審計欄位
    created_at: csvRow.created_at || new Date().toISOString(),
    updated_at: csvRow.modified_at || new Date().toISOString(),
    // 注意：舊系統的 created_by/updated_by 是字串編號（如 "0010"），新系統要求 UUID
    // 暫時設為 null，未來可建立員工編號對照表
    created_by: null,
    updated_by: null,
  }
}

/**
 * CSV 解析器（處理雙引號包含的逗號）
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // 解析單行 CSV（處理引號）
  function parseLine(line) {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const records = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    const record = {}

    headers.forEach((header, index) => {
      let value = values[index] || ''
      // 移除前後的雙引號
      value = value.replace(/^"(.*)"$/, '$1').trim()
      record[header.trim()] = value
    })

    records.push(record)
  }

  return records
}

/**
 * 讀取 CSV 檔案
 */
function readCSV(filePath) {
  console.log(`📖 正在讀取 CSV: ${filePath}`)

  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const records = parseCSV(fileContent)

  console.log(`✅ 讀取完成，共 ${records.length} 筆資料`)
  return records
}

/**
 * 批次匯入供應商
 */
async function importSuppliers(suppliers, batchSize = 50) {
  console.log(`\n🚀 開始匯入 ${suppliers.length} 筆供應商...`)

  let successCount = 0
  let errorCount = 0
  const errors = []

  // 分批處理
  for (let i = 0; i < suppliers.length; i += batchSize) {
    const batch = suppliers.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(suppliers.length / batchSize)

    console.log(`\n📦 處理批次 ${batchNum}/${totalBatches} (${batch.length} 筆)`)

    try {
      const { data, error } = await supabase.from('suppliers').insert(batch).select()

      if (error) {
        console.error(`❌ 批次 ${batchNum} 失敗:`, error.message)
        errorCount += batch.length
        errors.push({ batch: batchNum, error: error.message, data: batch })
      } else {
        successCount += data.length
        console.log(`✅ 批次 ${batchNum} 成功匯入 ${data.length} 筆`)
      }
    } catch (err) {
      console.error(`❌ 批次 ${batchNum} 異常:`, err.message)
      errorCount += batch.length
      errors.push({ batch: batchNum, error: err.message, data: batch })
    }

    // 避免過快請求，加入延遲
    if (i + batchSize < suppliers.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 匯入結果統計')
  console.log('='.repeat(50))
  console.log(`✅ 成功: ${successCount} 筆`)
  console.log(`❌ 失敗: ${errorCount} 筆`)
  console.log(`📈 成功率: ${((successCount / suppliers.length) * 100).toFixed(2)}%`)

  if (errors.length > 0) {
    const errorLogPath = path.join(__dirname, 'import-errors.json')
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2))
    console.log(`\n⚠️  錯誤詳情已儲存至: ${errorLogPath}`)
  }

  return { successCount, errorCount, errors }
}

/**
 * 預覽轉換結果
 */
function previewTransform(csvRecords, count = 5) {
  console.log('\n' + '='.repeat(50))
  console.log('🔍 資料轉換預覽（前 ' + count + ' 筆）')
  console.log('='.repeat(50))

  csvRecords.slice(0, count).forEach((record, index) => {
    const transformed = transformSupplier(record)
    console.log(`\n[${index + 1}] ${record.supplier_name}`)
    console.log(`    舊類型: ${record.supplier_type} → 新類型: ${transformed.type}`)
    console.log(`    代碼: ${transformed.code}`)
    console.log(`    銀行: ${record.bank_code} (${transformed.bank_name})`)
    console.log(`    帳號: ${transformed.bank_account}`)
    console.log(`    聯絡人: ${transformed.contact_person}`)
  })
}

/**
 * 統計類型分佈
 */
function analyzeTypes(csvRecords) {
  const typeCounts = {}
  const transformedCounts = {}

  csvRecords.forEach(record => {
    const oldType = record.supplier_type || 'unknown'
    const newType = convertSupplierType(oldType)

    typeCounts[oldType] = (typeCounts[oldType] || 0) + 1
    transformedCounts[newType] = (transformedCounts[newType] || 0) + 1
  })

  console.log('\n' + '='.repeat(50))
  console.log('📊 類型分佈統計')
  console.log('='.repeat(50))

  console.log('\n舊系統類型:')
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(20)} ${count} 筆`)
    })

  console.log('\n新系統類型（轉換後）:')
  Object.entries(transformedCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(20)} ${count} 筆`)
    })
}

/**
 * 主函數
 */
async function main() {
  const args = process.argv.slice(2)
  const csvPath = args[0] || '/Users/william/Downloads/suppliers.csv'
  const mode = args[1] || 'preview' // preview | import | test

  console.log('╔═══════════════════════════════════════════╗')
  console.log('║   供應商資料匯入工具 v1.0                ║')
  console.log('╚═══════════════════════════════════════════╝\n')

  try {
    // 讀取 CSV
    const csvRecords = readCSV(csvPath)

    // 統計類型
    analyzeTypes(csvRecords)

    // 轉換資料
    const transformedSuppliers = csvRecords.map(transformSupplier)

    if (mode === 'preview') {
      // 預覽模式：只顯示轉換結果
      previewTransform(csvRecords, 10)
      console.log('\n💡 提示: 執行 `node import-suppliers.js <csv路徑> import` 開始匯入')
      console.log('💡 提示: 執行 `node import-suppliers.js <csv路徑> test` 測試匯入 5 筆')
    } else if (mode === 'test') {
      // 測試模式：只匯入前 5 筆
      console.log('\n🧪 測試模式：只匯入前 5 筆資料')
      const testData = transformedSuppliers.slice(0, 5)
      previewTransform(csvRecords, 5)

      console.log('\n確認要匯入測試資料嗎？ (按 Ctrl+C 取消，或等待 5 秒後自動執行)')
      await new Promise(resolve => setTimeout(resolve, 5000))

      await importSuppliers(testData)
    } else if (mode === 'import') {
      // 匯入模式：匯入所有資料
      previewTransform(csvRecords, 5)

      console.log(`\n⚠️  即將匯入 ${transformedSuppliers.length} 筆供應商資料`)
      console.log('⚠️  請確認資料庫備份已完成')
      console.log('\n按 Ctrl+C 取消，或等待 10 秒後自動執行...')
      await new Promise(resolve => setTimeout(resolve, 10000))

      await importSuppliers(transformedSuppliers)
    }

    console.log('\n✨ 完成！')
  } catch (error) {
    console.error('\n❌ 發生錯誤:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 執行
if (require.main === module) {
  main()
}

module.exports = {
  transformSupplier,
  convertSupplierType,
  importSuppliers,
}
