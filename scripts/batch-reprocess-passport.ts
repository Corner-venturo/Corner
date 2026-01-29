/**
 * 批次重新處理護照 passport_name_print
 * 使用 OCR.space + Google Vision 雙 API 交叉比對（與正式 OCR 相同邏輯）
 *
 * 執行方式：
 * - 檢查狀態：npx tsx scripts/batch-reprocess-passport.ts
 * - 重新 OCR customers：npx tsx scripts/batch-reprocess-passport.ts --ocr --table customers --limit 10
 * - 重新 OCR order_members：npx tsx scripts/batch-reprocess-passport.ts --ocr --table members --limit 30
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || ''
const GOOGLE_VISION_API_KEYS = (process.env.GOOGLE_VISION_API_KEYS || '').split(',').filter(Boolean)

if (!SUPABASE_SERVICE_KEY) {
  console.error('請設定 SUPABASE_SERVICE_ROLE_KEY 環境變數')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// 解析命令列參數
const args = process.argv.slice(2)
const doOcr = args.includes('--ocr')
const tableArg = args.find(a => a.startsWith('--table'))
const targetTable = tableArg ? (args[args.indexOf('--table') + 1] || 'customers') : 'customers'
const limitArg = args.find(a => a.startsWith('--limit'))
const limit = limitArg ? parseInt(args[args.indexOf('--limit') + 1] || '10') : 10

async function main() {
  console.log('=== 批次處理 passport_name_print ===\n')

  // 1. 查詢統計
  const { count: customersWithImage } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .not('passport_image_url', 'is', null)

  const { count: membersWithImage } = await supabase
    .from('order_members')
    .select('id', { count: 'exact', head: true })
    .not('passport_image_url', 'is', null)

  const { data: customersNeedFix } = await supabase
    .from('customers')
    .select('id')
    .not('passport_image_url', 'is', null)
    .not('passport_name_print', 'is', null)
    .not('passport_name_print', 'like', '%-%')

  const { data: membersNeedFix } = await supabase
    .from('order_members')
    .select('id')
    .not('passport_image_url', 'is', null)
    .not('passport_name_print', 'is', null)
    .not('passport_name_print', 'like', '%-%')

  console.log('統計資訊：')
  console.log(`- Customers 有護照圖片: ${customersWithImage || 0}`)
  console.log(`- Order Members 有護照圖片: ${membersWithImage || 0}`)
  console.log(`- Customers passport_name_print 沒有連字號: ${customersNeedFix?.length || 0}`)
  console.log(`- Order Members passport_name_print 沒有連字號: ${membersNeedFix?.length || 0}`)
  console.log('')
  console.log('API 狀態：')
  console.log(`- OCR.space: ${OCR_SPACE_API_KEY ? '✓ 已設定' : '✗ 未設定'}`)
  console.log(`- Google Vision: ${GOOGLE_VISION_API_KEYS.length > 0 ? `✓ 已設定 (${GOOGLE_VISION_API_KEYS.length} 個 key)` : '✗ 未設定'}`)
  console.log('')

  if (!doOcr) {
    console.log('使用 --ocr 參數來執行重新 OCR')
    console.log('範例：')
    console.log('  npx tsx scripts/batch-reprocess-passport.ts --ocr --table customers --limit 10')
    console.log('  npx tsx scripts/batch-reprocess-passport.ts --ocr --table members --limit 30')
    return
  }

  if (!OCR_SPACE_API_KEY && GOOGLE_VISION_API_KEYS.length === 0) {
    console.error('請設定 OCR_SPACE_API_KEY 或 GOOGLE_VISION_API_KEYS 環境變數')
    process.exit(1)
  }

  console.log(`=== 開始重新 OCR ${targetTable}（限制 ${limit} 筆）===\n`)

  let processed = 0
  let updated = 0
  let failed = 0

  const tableName = targetTable === 'members' ? 'order_members' : 'customers'

  const { data: recordsToProcess } = await supabase
    .from(tableName)
    .select('id, passport_image_url, passport_name, passport_name_print')
    .not('passport_image_url', 'is', null)
    .not('passport_name_print', 'like', '%-%')
    .limit(limit)

  if (recordsToProcess) {
    for (const record of recordsToProcess) {
      processed++
      const prefix = targetTable === 'members' ? 'Member' : 'Customer'
      console.log(`處理 ${prefix} ${record.id}...`)

      try {
        const newNamePrint = await reprocessPassportImage(record.passport_image_url!)

        if (newNamePrint && newNamePrint.includes('-')) {
          const { error } = await supabase
            .from(tableName)
            .update({ passport_name_print: newNamePrint })
            .eq('id', record.id)

          if (error) {
            console.log(`  ✗ 更新失敗: ${error.message}`)
            failed++
          } else {
            console.log(`  ✓ ${record.passport_name_print} → ${newNamePrint}`)
            updated++
          }
        } else if (newNamePrint) {
          console.log(`  - OCR 結果無連字號: ${newNamePrint}，保持原樣`)
        } else {
          console.log(`  - OCR 失敗，保持原樣`)
        }
      } catch (err) {
        console.log(`  ✗ 錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`)
        failed++
      }

      // 避免 API 過載
      await new Promise(resolve => setTimeout(resolve, 600))
    }
  }

  console.log('')
  console.log('=== 完成 ===')
  console.log(`處理: ${processed}`)
  console.log(`更新: ${updated}`)
  console.log(`失敗: ${failed}`)
}

/**
 * 重新處理護照圖片，使用雙 API 交叉比對
 */
async function reprocessPassportImage(imageData: string): Promise<string | null> {
  try {
    let base64Image = imageData

    // 如果是 HTTP URL，需要先下載轉成 base64
    if (imageData.startsWith('http')) {
      const response = await fetch(imageData)
      if (!response.ok) {
        console.log(`    下載圖片失敗: ${response.status}`)
        return null
      }
      const buffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      base64Image = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`
    }

    // 同時呼叫兩個 API
    const [ocrSpaceResult, googleVisionResult] = await Promise.all([
      OCR_SPACE_API_KEY ? callOcrSpace(base64Image) : Promise.resolve(''),
      GOOGLE_VISION_API_KEYS.length > 0 ? callGoogleVision(base64Image, GOOGLE_VISION_API_KEYS[0]) : Promise.resolve(''),
    ])

    // 優先使用 Google Vision 結果（更準確）
    let passportNamePrint = parseMrzForNamePrint(googleVisionResult || '')

    // 如果 Google Vision 失敗，用 OCR.space
    if (!passportNamePrint || !passportNamePrint.includes('-')) {
      passportNamePrint = parseMrzForNamePrint(ocrSpaceResult || '')
    }

    return passportNamePrint
  } catch (error) {
    console.error('重新處理護照圖片失敗:', error)
    return null
  }
}

/**
 * 呼叫 OCR.space API
 */
async function callOcrSpace(base64Image: string): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('base64Image', base64Image)
    formData.append('language', 'eng')
    formData.append('isOverlayRequired', 'false')
    formData.append('detectOrientation', 'true')
    formData.append('scale', 'true')
    formData.append('OCREngine', '2')

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': OCR_SPACE_API_KEY,
      },
      body: formData,
    })

    const data = await response.json()

    if (data.OCRExitCode !== 1 || !data.ParsedResults?.[0]) {
      return ''
    }

    return data.ParsedResults[0].ParsedText || ''
  } catch (error) {
    return ''
  }
}

/**
 * 呼叫 Google Vision API
 */
async function callGoogleVision(base64Image: string, apiKey: string): Promise<string> {
  try {
    // 移除 data:image/xxx;base64, 前綴
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '')

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Data },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      return ''
    }

    return data.responses?.[0]?.fullTextAnnotation?.text || ''
  } catch (error) {
    return ''
  }
}

/**
 * 從 MRZ 文字解析 passport_name_print
 */
function parseMrzForNamePrint(ocrText: string): string | null {
  if (!ocrText) return null

  const cleanText = ocrText.replace(/\s+/g, '')

  // 優先嘗試標準 MRZ 格式
  let mrzLine1Match = cleanText.match(/P<([A-Z]{3})([A-Z<]{2,39})/i)

  if (!mrzLine1Match) {
    // 備用方案：處理 OCR 誤讀 < 為 I 或 | 的情況
    const relaxedMatch = cleanText.match(/P[<I\|]([A-Z]{3})([A-Z<I\|]{2,39})/i)
    if (relaxedMatch) {
      const namePart = relaxedMatch[2].replace(/[I\|]/g, '<')
      return extractNamePrint(namePart)
    }
    return null
  }

  return extractNamePrint(mrzLine1Match[2])
}

/**
 * 從 MRZ 名字部分提取列印格式
 */
function extractNamePrint(namePart: string): string | null {
  const parts = namePart.split('<<')
  if (parts.length >= 2) {
    const surname = parts[0].replace(/</g, '')
    const givenNamesWithDash = parts[1].replace(/</g, '-').replace(/-+$/, '').trim()

    if (surname && givenNamesWithDash) {
      return `${surname}, ${givenNamesWithDash}`
    } else if (surname) {
      return surname
    }
  } else if (parts.length === 1) {
    const surname = parts[0].replace(/</g, '')
    return surname || null
  }
  return null
}

main().catch(console.error)
