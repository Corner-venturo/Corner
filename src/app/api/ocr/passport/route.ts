import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Google Vision 每月免費額度限制
const GOOGLE_VISION_MONTHLY_LIMIT = 980

/**
 * 護照 OCR 辨識 API
 * 雙 API 策略：
 * 1. OCR.space - 專門辨識 MRZ（護照號碼、效期、生日等）
 * 2. Google Vision - 辨識中文名字（每月限制 980 次）
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let base64Images: { name: string; data: string }[] = []

    // 判斷是 JSON 還是 FormData
    if (contentType.includes('application/json')) {
      const json = await request.json()
      if (json.image) {
        base64Images = [{ name: 'passport.jpg', data: json.image }]
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const files = formData.getAll('files') as File[]

      if (files && files.length > 0) {
        for (const file of files) {
          const buffer = await file.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const base64Image = `data:${file.type};base64,${base64}`
          base64Images.push({ name: file.name, data: base64Image })
        }
      }
    } else {
      return NextResponse.json({ error: '不支援的 Content-Type' }, { status: 400 })
    }

    if (base64Images.length === 0) {
      return NextResponse.json({ error: '沒有上傳檔案' }, { status: 400 })
    }

    const ocrSpaceKey = process.env.OCR_SPACE_API_KEY
    const googleVisionKey = process.env.GOOGLE_VISION_API_KEY

    if (!ocrSpaceKey) {
      return NextResponse.json({ error: 'OCR API Key 未設定' }, { status: 500 })
    }

    // 檢查 Google Vision 使用量
    const { canUseGoogleVision, currentUsage, warning } = await checkGoogleVisionUsage(base64Images.length)

    // 批次辨識所有護照
    const results = await Promise.all(
      base64Images.map(async (img) => {
        try {
          // 同時呼叫兩個 API
          const [ocrSpaceResult, googleVisionResult] = await Promise.all([
            // OCR.space - MRZ 辨識
            callOcrSpace(img.data, ocrSpaceKey),
            // Google Vision - 中文辨識（如果有 key 且未超過限制）
            (googleVisionKey && canUseGoogleVision) ? callGoogleVision(img.data, googleVisionKey) : Promise.resolve(null),
          ])

          console.log('🔍 OCR.space 原始文字:', ocrSpaceResult)
          if (googleVisionResult) {
            console.log('🔍 Google Vision 原始文字:', googleVisionResult)
          }

          // 解析護照資訊（合併兩個 API 的結果）
          const customerData = parsePassportText(ocrSpaceResult, googleVisionResult, img.name)

          return {
            success: true,
            fileName: img.name,
            customer: customerData,
            rawText: ocrSpaceResult,
          }
        } catch (error) {
          console.error(`辨識失敗 (${img.name}):`, error)
          return {
            success: false,
            fileName: img.name,
            error: error instanceof Error ? error.message : '未知錯誤',
          }
        }
      })
    )

    // 更新使用量（只有成功使用 Google Vision 才計算）
    if (canUseGoogleVision && googleVisionKey) {
      await updateGoogleVisionUsage(base64Images.length)
    }

    return NextResponse.json({
      success: true,
      results,
      total: base64Images.length,
      successful: results.filter(r => r.success).length,
      // 加入使用量警告
      usageWarning: warning,
      googleVisionUsage: {
        current: currentUsage + (canUseGoogleVision ? base64Images.length : 0),
        limit: GOOGLE_VISION_MONTHLY_LIMIT,
        enabled: canUseGoogleVision,
      },
    })
  } catch (error) {
    console.error('護照辨識錯誤:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '處理失敗' },
      { status: 500 }
    )
  }
}

/**
 * 呼叫 OCR.space API（專門辨識 MRZ）
 */
async function callOcrSpace(base64Image: string, apiKey: string): Promise<string> {
  const ocrFormData = new FormData()
  ocrFormData.append('base64Image', base64Image)
  ocrFormData.append('language', 'eng')
  ocrFormData.append('isOverlayRequired', 'false')
  ocrFormData.append('detectOrientation', 'true')
  ocrFormData.append('scale', 'true')
  ocrFormData.append('OCREngine', '2')

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { apikey: apiKey },
    body: ocrFormData,
  })

  const data = await response.json()

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || 'OCR.space 辨識失敗')
  }

  return data.ParsedResults?.[0]?.ParsedText || ''
}

/**
 * 呼叫 Google Vision API（辨識中文）
 */
async function callGoogleVision(base64Image: string, apiKey: string): Promise<string> {
  // 移除 data:image/xxx;base64, 前綴
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Google Vision 錯誤:', data.error)
    return ''
  }

  return data.responses?.[0]?.fullTextAnnotation?.text || ''
}

/**
 * 解析護照 OCR 文字
 * 合併 OCR.space（MRZ）和 Google Vision（中文）的結果
 */
function parsePassportText(ocrSpaceText: string, googleVisionText: string | null, fileName: string) {
  // 移除所有空白和換行，方便比對
  const cleanText = ocrSpaceText.replace(/\s+/g, '')

  // 基本資料結構
  const customerData: {
    name: string
    english_name?: string
    passport_number?: string
    passport_romanization?: string
    national_id?: string
    date_of_birth?: string
    passport_expiry_date?: string
    nationality?: string
    sex?: string
    phone?: string
  } = {
    name: '',
    phone: '',
  }

  // ========== 第一行 MRZ：解析姓名和國籍 ==========
  // 格式：P<國籍姓氏<<名字<<<<<...
  // 範例：P<TWNLIN<<LI<HUI<<<<<<<<<<<<<<<<<<<<<<<<<<<
  const mrzLine1Match = cleanText.match(/P[<I]([A-Z]{3})([A-Z<]+)/i)
  if (mrzLine1Match) {
    const countryCode = mrzLine1Match[1]
    const namePart = mrzLine1Match[2]

    customerData.nationality = countryCode

    const parts = namePart.split('<<')
    if (parts.length >= 2) {
      const surname = parts[0].replace(/</g, '')
      const givenNames = parts[1].replace(/</g, ' ').trim()

      customerData.passport_romanization = `${surname}/${givenNames}`
      customerData.english_name = `${surname} ${givenNames}`
      customerData.name = `${surname} ${givenNames}`
    } else if (parts.length === 1) {
      // 只有姓氏
      const surname = parts[0].replace(/</g, '')
      customerData.passport_romanization = surname
      customerData.english_name = surname
      customerData.name = surname
    }
    console.log('✅ MRZ Line 1 解析成功:', { countryCode, namePart })
  }

  // ========== 第二行 MRZ：解析詳細資料 ==========
  // 格式：護照號碼(9)+檢查碼(1)+國籍(3)+生日YYMMDD(6)+檢查碼(1)+性別(1)+效期YYMMDD(6)+檢查碼(1)+身分證或其他
  // 範例：3141148363TWN6012111F2610254G220796971<<<32

  // 更寬鬆的正則：找連續的數字+字母組合
  const mrzLine2Match = cleanText.match(
    /(\d{9})(\d)([A-Z]{3})(\d{6})(\d)([MF])(\d{6})(\d)([A-Z0-9<]+)/i
  )

  if (mrzLine2Match) {
    customerData.passport_number = mrzLine2Match[1]

    if (!customerData.nationality) {
      customerData.nationality = mrzLine2Match[3]
    }

    // 生日 (YYMMDD)
    const birthYY = mrzLine2Match[4].substring(0, 2)
    const birthMM = mrzLine2Match[4].substring(2, 4)
    const birthDD = mrzLine2Match[4].substring(4, 6)
    const birthYear = parseInt(birthYY) > 50 ? `19${birthYY}` : `20${birthYY}`
    customerData.date_of_birth = `${birthYear}-${birthMM}-${birthDD}`

    // 性別
    customerData.sex = mrzLine2Match[6] === 'F' ? '女' : '男'

    // 護照效期 (YYMMDD)
    const expiryYY = mrzLine2Match[7].substring(0, 2)
    const expiryMM = mrzLine2Match[7].substring(2, 4)
    const expiryDD = mrzLine2Match[7].substring(4, 6)
    const expiryYear = parseInt(expiryYY) > 50 ? `19${expiryYY}` : `20${expiryYY}`
    customerData.passport_expiry_date = `${expiryYear}-${expiryMM}-${expiryDD}`

    // 台灣護照：身分證字號（格式：1英文+9數字）
    if (customerData.nationality === 'TWN') {
      const remaining = mrzLine2Match[9].replace(/</g, '')
      const nationalIdMatch = remaining.match(/([A-Z]\d{9})/i)
      if (nationalIdMatch) {
        customerData.national_id = nationalIdMatch[1]
      }
    }
    console.log('✅ MRZ Line 2 解析成功:', mrzLine2Match)
  } else {
    console.log('❌ MRZ Line 2 解析失敗，嘗試備用方案')

    // 備用方案：嘗試從護照資訊區域抓取
    // 找護照號碼（9碼數字）
    const passportMatch = cleanText.match(/(\d{9})/g)
    if (passportMatch && passportMatch.length > 0) {
      // 第一個 9 碼數字通常是護照號碼
      customerData.passport_number = passportMatch[0]
      console.log('✅ 備用方案找到護照號碼:', passportMatch[0])
    }

    // 找身分證號（1英文+9數字）
    const nationalIdMatch = cleanText.match(/[A-Z][12]\d{8}/i)
    if (nationalIdMatch) {
      customerData.national_id = nationalIdMatch[0]
      // 從身分證第二碼判斷性別
      customerData.sex = nationalIdMatch[0].charAt(1) === '1' ? '男' : '女'
      console.log('✅ 備用方案找到身分證:', nationalIdMatch[0])
    }

    // 找日期格式（DD MMM YYYY 或 YYYY-MM-DD）
    const dateMatches = ocrSpaceText.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/gi)
    if (dateMatches) {
      const monthMap: { [key: string]: string } = {
        JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
        JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
      }

      for (const dateStr of dateMatches) {
        const match = dateStr.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)
        if (match) {
          const day = match[1].padStart(2, '0')
          const month = monthMap[match[2].toUpperCase()]
          const year = match[3]
          const formattedDate = `${year}-${month}-${day}`

          // 判斷是生日還是效期（效期通常在 2020 以後）
          if (parseInt(year) >= 2020 && !customerData.passport_expiry_date) {
            customerData.passport_expiry_date = formattedDate
            console.log('✅ 備用方案找到效期:', formattedDate)
          } else if (parseInt(year) < 2010 && !customerData.date_of_birth) {
            customerData.date_of_birth = formattedDate
            console.log('✅ 備用方案找到生日:', formattedDate)
          }
        }
      }
    }
  }

  // ========== 從 Google Vision 結果抓中文名 ==========
  let chineseName = ''
  if (googleVisionText) {
    // Google Vision 對中文辨識較好，優先從這裡抓中文名
    // 找 2-4 個連續中文字（排除常見非姓名詞彙）
    const excludeWords = ['護照', '中華', '民國', '姓名', '國籍', '性別', '出生', '日期', '效期', '機關', '外交部', '台灣', '發照', '截止']
    const chineseNames = googleVisionText.match(/[\u4e00-\u9fff]{2,4}/g)
    if (chineseNames) {
      const validName = chineseNames.find(name =>
        !excludeWords.some(word => name.includes(word)) &&
        name.length >= 2 && name.length <= 4
      )
      if (validName) {
        chineseName = validName
        console.log('✅ Google Vision 找到中文名:', validName)
      }
    }
  }

  // ========== 從 OCR.space 結果抓英文名 ==========
  let englishName = ''
  if (!customerData.name) {
    // 找獨立一行的 "LIN, LI-HUI" 格式
    const lines = ocrSpaceText.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (/name|surname|given/i.test(trimmed)) continue

      const nameMatch = trimmed.match(/^([A-Z]{2,}),\s*([A-Z][A-Z-]+)$/i)
      if (nameMatch) {
        englishName = `${nameMatch[1]} ${nameMatch[2]}`
        customerData.english_name = englishName
        customerData.passport_romanization = `${nameMatch[1]}/${nameMatch[2]}`
        console.log('✅ OCR.space 找到英文姓名:', englishName)
        break
      }
    }
  }

  // ========== 決定最終姓名 ==========
  // 優先使用中文名，沒有就用英文名
  if (chineseName) {
    customerData.name = chineseName
    if (englishName) {
      customerData.english_name = englishName
    }
  } else if (englishName) {
    customerData.name = englishName
  }

  // 最後備用：用檔案名稱
  if (!customerData.name) {
    customerData.name = fileName.replace(/\.(jpg|jpeg|png|gif)$/i, '')
  }

  console.log('📋 最終解析結果:', customerData)
  return customerData
}

/**
 * 檢查 Google Vision API 使用量
 */
async function checkGoogleVisionUsage(requestCount: number): Promise<{
  canUseGoogleVision: boolean
  currentUsage: number
  warning: string | null
}> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 取得當月使用量
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data, error } = await supabase
      .from('api_usage')
      .select('usage_count')
      .eq('api_name', 'google_vision')
      .eq('month', currentMonth)
      .single()

    const currentUsage = data?.usage_count || 0
    const newUsage = currentUsage + requestCount

    // 判斷是否可以使用
    if (newUsage > GOOGLE_VISION_MONTHLY_LIMIT) {
      return {
        canUseGoogleVision: false,
        currentUsage,
        warning: `⚠️ Google Vision API 本月已達上限 (${currentUsage}/${GOOGLE_VISION_MONTHLY_LIMIT})，中文名辨識已停用。護照其他資訊仍可正常辨識。`,
      }
    }

    // 使用量警告（超過 80%）
    const usagePercent = (newUsage / GOOGLE_VISION_MONTHLY_LIMIT) * 100
    let warning: string | null = null

    if (usagePercent >= 95) {
      warning = `🔴 Google Vision API 使用量已達 ${usagePercent.toFixed(0)}% (${newUsage}/${GOOGLE_VISION_MONTHLY_LIMIT})，即將達到上限！`
    } else if (usagePercent >= 80) {
      warning = `🟡 Google Vision API 使用量已達 ${usagePercent.toFixed(0)}% (${newUsage}/${GOOGLE_VISION_MONTHLY_LIMIT})`
    }

    return {
      canUseGoogleVision: true,
      currentUsage,
      warning,
    }
  } catch (error) {
    console.error('檢查 API 使用量失敗:', error)
    // 發生錯誤時仍允許使用（避免因為 DB 問題影響正常功能）
    return {
      canUseGoogleVision: true,
      currentUsage: 0,
      warning: null,
    }
  }
}

/**
 * 更新 Google Vision API 使用量
 */
async function updateGoogleVisionUsage(count: number): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const currentMonth = new Date().toISOString().slice(0, 7)

    // 先查詢當前使用量
    const { data: existing } = await supabase
      .from('api_usage')
      .select('usage_count')
      .eq('api_name', 'google_vision')
      .eq('month', currentMonth)
      .single()

    const newCount = (existing?.usage_count || 0) + count

    // 使用 upsert 更新或新增記錄
    const { error } = await supabase
      .from('api_usage')
      .upsert(
        {
          api_name: 'google_vision',
          month: currentMonth,
          usage_count: newCount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'api_name,month',
        }
      )

    if (error) {
      console.error('upsert 失敗:', error)
    } else {
      console.log(`📊 Google Vision 使用量更新: ${newCount}/${GOOGLE_VISION_MONTHLY_LIMIT}`)
    }
  } catch (error) {
    console.error('更新 API 使用量失敗:', error)
  }
}
