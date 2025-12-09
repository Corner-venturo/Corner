import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Google Vision 每月免費額度限制（每個 Key 980 次）
const GOOGLE_VISION_LIMIT_PER_KEY = 980

/**
 * 取得 Google Vision API Keys（支援多 Key 輪換）
 */
function getGoogleVisionKeys(): string[] {
  // 優先使用多 Key 設定
  const multiKeys = process.env.GOOGLE_VISION_API_KEYS
  if (multiKeys) {
    return multiKeys.split(',').map(k => k.trim()).filter(Boolean)
  }
  // 向後相容：使用單一 Key
  const singleKey = process.env.GOOGLE_VISION_API_KEY
  if (singleKey) {
    return [singleKey]
  }
  return []
}

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
    const googleVisionKeys = getGoogleVisionKeys()

    if (!ocrSpaceKey) {
      return NextResponse.json({ error: 'OCR API Key 未設定' }, { status: 500 })
    }

    // 檢查 Google Vision 使用量並取得可用的 Key
    const { canUseGoogleVision, availableKey, currentUsage, totalLimit, warning } = await checkGoogleVisionUsage(
      base64Images.length,
      googleVisionKeys
    )

    // 批次辨識所有護照
    const results = await Promise.all(
      base64Images.map(async (img) => {
        try {
          // 同時呼叫兩個 API
          const [ocrSpaceResult, googleVisionResult] = await Promise.all([
            // OCR.space - MRZ 辨識
            callOcrSpace(img.data, ocrSpaceKey),
            // Google Vision - 中文辨識（如果有可用的 key）
            (availableKey && canUseGoogleVision) ? callGoogleVision(img.data, availableKey) : Promise.resolve(null),
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
    if (canUseGoogleVision && availableKey) {
      await updateGoogleVisionUsage(base64Images.length, availableKey)
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
        limit: totalLimit,
        enabled: canUseGoogleVision,
        keysAvailable: googleVisionKeys.length,
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
 * 用拼音驗證中文名是否合理
 * 台灣護照拼音規則：每個中文字對應一個拼音音節
 * 例如：CHU/WENYU → 朱(CHU) 玟(WEN) 伃(YU) = 3個字
 */
function validateChineseNameByPinyin(chineseName: string, romanization: string): { valid: boolean; expectedLength: number } {
  if (!romanization || !chineseName) {
    return { valid: true, expectedLength: 0 } // 無法驗證
  }

  // 從護照拼音計算預期的字數
  // 格式: SURNAME/GIVENNAME 或 SURNAME/GIVEN-NAME
  const parts = romanization.toUpperCase().split('/')
  if (parts.length !== 2) {
    return { valid: true, expectedLength: 0 }
  }

  const surname = parts[0]
  const givenName = parts[1]

  // 台灣護照拼音常見音節模式（用於精確計算）
  // 這些是常見的台灣威妥瑪拼音音節
  const commonSyllables = [
    // 常見複合母音音節
    'YING', 'YANG', 'WANG', 'WONG', 'CHANG', 'ZHANG', 'CHUNG', 'ZHONG', 'CHUANG', 'ZHUANG',
    'CHIANG', 'JIANG', 'CHIEN', 'JIAN', 'CHIEH', 'JIE', 'CHIAO', 'JIAO', 'CHING', 'JING',
    'HUANG', 'HSIANG', 'XIANG', 'HSIAO', 'XIAO', 'HSIEH', 'XIE', 'HSIUNG', 'XIONG',
    'KUANG', 'GUANG', 'KUAN', 'GUAN', 'KWANG',
    'LIANG', 'LING', 'LUNG', 'LONG',
    'SHENG', 'SHANG', 'SHUANG', 'SHUI',
    'TSUNG', 'TSENG', 'TZENG', 'TSAI', 'TZAI',
    // 常見三字母音節
    'WEN', 'WAN', 'WEI', 'WAI', 'YEN', 'YAN', 'YAO', 'YIN', 'YOU', 'YUN', 'YUE',
    'CHU', 'CHA', 'CHE', 'CHI', 'CHO', 'CHE',
    'SHU', 'SHA', 'SHE', 'SHI', 'SHO',
    'ZHU', 'ZHA', 'ZHE', 'ZHI', 'ZHO',
    'ANG', 'ENG', 'ING', 'ONG', 'UNG',
    'HUA', 'HUI', 'HAO', 'HOU', 'HAN', 'HEN', 'HUN',
    'KAI', 'KEI', 'KUI', 'KAN', 'KEN', 'KUN', 'KAO', 'KOU',
    'GAI', 'GEI', 'GUI', 'GAN', 'GEN', 'GUN', 'GAO', 'GOU',
    'LAI', 'LEI', 'LUI', 'LAN', 'LEN', 'LUN', 'LAO', 'LOU', 'LIN', 'LIU',
    'MAI', 'MEI', 'MAN', 'MEN', 'MIN', 'MOU', 'MAN',
    'NAI', 'NEI', 'NAN', 'NEN', 'NIN', 'NOU',
    'PAI', 'PEI', 'PAN', 'PEN', 'PIN', 'POU',
    'TAI', 'TEI', 'TAN', 'TEN', 'TIN', 'TOU', 'TUN',
    'DAI', 'DEI', 'DAN', 'DEN', 'DIN', 'DOU', 'DUN',
    'SAI', 'SAN', 'SEN', 'SIN', 'SOU', 'SUN',
    'ZAI', 'ZAN', 'ZEN', 'ZIN', 'ZOU', 'ZUN',
    'CAI', 'CAN', 'CEN', 'CIN', 'COU', 'CUN',
    'FAN', 'FEN', 'FOU', 'FUN',
    'RAN', 'REN', 'ROU', 'RUN', 'RUI',
    // 兩字母音節
    'AN', 'EN', 'AI', 'EI', 'AO', 'OU', 'YA', 'YE', 'YI', 'YO', 'YU',
    'WA', 'WO', 'WU',
    'BA', 'BI', 'BO', 'BU', 'BE',
    'PA', 'PI', 'PO', 'PU', 'PE',
    'MA', 'MI', 'MO', 'MU', 'ME',
    'FA', 'FI', 'FO', 'FU', 'FE',
    'DA', 'DI', 'DO', 'DU', 'DE',
    'TA', 'TI', 'TO', 'TU', 'TE',
    'NA', 'NI', 'NO', 'NU', 'NE',
    'LA', 'LI', 'LO', 'LU', 'LE',
    'GA', 'GI', 'GO', 'GU', 'GE',
    'KA', 'KI', 'KO', 'KU', 'KE',
    'HA', 'HI', 'HO', 'HU', 'HE',
    'JA', 'JI', 'JO', 'JU', 'JE',
    'QA', 'QI', 'QO', 'QU', 'QE',
    'XA', 'XI', 'XO', 'XU', 'XE',
    'ZA', 'ZI', 'ZO', 'ZU', 'ZE',
    'CA', 'CI', 'CO', 'CU', 'CE',
    'SA', 'SI', 'SO', 'SU', 'SE',
    'RA', 'RI', 'RO', 'RU', 'RE',
  ]

  // 使用貪婪匹配計算音節數
  const countSyllables = (s: string): number => {
    // 如果有連字號，直接按連字號分割
    if (s.includes('-')) {
      return s.split('-').filter(Boolean).length
    }

    s = s.toUpperCase()
    let count = 0
    let remaining = s

    while (remaining.length > 0) {
      let matched = false
      // 從長到短嘗試匹配
      for (let len = Math.min(6, remaining.length); len >= 2; len--) {
        const prefix = remaining.substring(0, len)
        if (commonSyllables.includes(prefix)) {
          count++
          remaining = remaining.substring(len)
          matched = true
          break
        }
      }
      // 如果沒有匹配到已知音節，假設是單字母或未知音節
      if (!matched) {
        // 嘗試用母音作為音節結束的標記
        const vowelMatch = remaining.match(/^[^AEIOU]*[AEIOU]+[NG]*/i)
        if (vowelMatch) {
          count++
          remaining = remaining.substring(vowelMatch[0].length)
        } else if (remaining.length > 0) {
          // 剩餘部分算一個音節
          count++
          break
        }
      }
    }

    return Math.max(count, 1) // 至少1個音節
  }

  // 計算預期字數
  const surnameChars = countSyllables(surname)
  const givenNameChars = countSyllables(givenName)
  const expectedLength = surnameChars + givenNameChars

  const actualLength = chineseName.length

  // 驗證邏輯：
  // 1. 實際字數 = 預期字數 → 完全正確
  // 2. 實際字數 > 預期字數 → 可能是複姓或計算誤差，接受
  // 3. 實際字數 < 預期字數 → 可能 OCR 漏字，不接受
  const valid = actualLength >= expectedLength

  console.log(`🔍 拼音驗證: ${romanization} → 姓 "${surname}"(${surnameChars}字) + 名 "${givenName}"(${givenNameChars}字) = 預期 ${expectedLength} 字, 實際 "${chineseName}" ${actualLength} 字, ${valid ? '✓' : '✗'}`)

  return { valid, expectedLength }
}

/**
 * 解析護照 OCR 文字
 * 合併 OCR.space（MRZ）和 Google Vision（中文）的結果
 */
function parsePassportText(ocrSpaceText: string, googleVisionText: string | null, fileName: string) {
  // 移除所有空白和換行，方便比對
  const cleanText = ocrSpaceText.replace(/\s+/g, '')
  // 也處理 Google Vision 的文字（作為備用來源）
  const cleanGoogleText = googleVisionText?.replace(/\s+/g, '') || ''

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
  // 嘗試從兩個來源解析（OCR.space 優先，Google Vision 備用）
  let mrzLine1Match = cleanText.match(/P[<I]([A-Z]{3})([A-Z<]+)/i)
  if (!mrzLine1Match && cleanGoogleText) {
    mrzLine1Match = cleanGoogleText.match(/P[<I]([A-Z]{3})([A-Z<]+)/i)
    if (mrzLine1Match) {
      console.log('📝 從 Google Vision 解析 MRZ Line 1')
    }
  }

  if (mrzLine1Match) {
    const countryCode = mrzLine1Match[1]
    const namePart = mrzLine1Match[2]

    customerData.nationality = countryCode

    const parts = namePart.split('<<')
    if (parts.length >= 2) {
      const surname = parts[0].replace(/</g, '')
      const givenNames = parts[1].replace(/</g, '').trim() // 移除空格

      // 護照拼音：姓/名，不含空格和連字號
      customerData.passport_romanization = `${surname}/${givenNames.replace(/-/g, '')}`
      customerData.english_name = `${surname} ${givenNames.replace(/-/g, '')}`
      customerData.name = `${surname} ${givenNames.replace(/-/g, '')}`
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
  let chineseNameConfidence = 'high' // high, medium, low
  if (googleVisionText) {
    // Google Vision 對中文辨識較好，優先從這裡抓中文名
    // 排除詞彙清單
    const excludeWords = ['護照', '中華', '民國', '姓名', '國籍', '性別', '出生', '日期', '效期', '機關', '外交部', '台灣', '發照', '截止', '型式', '代碼', '持照', '簽名', '身分', '證號', '地址', '地點', '機關', '有效']
    // 常見 OCR 錯字（這些字很少出現在人名中）
    const suspiciousChars = ['仔', '佬', '的', '是', '在', '了', '有', '個', '這', '那', '和', '與', '或']

    // 策略 1: 找 Name/姓名 區塊後面緊鄰的中文名
    // 護照格式通常是: /Name (Surname, Given names)\n中文名\n英文名
    const lines = googleVisionText.split('\n')
    let foundNameSection = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // 偵測 Name 區塊的開始
      if (/Name|姓名|Given names/i.test(line)) {
        foundNameSection = true
        continue
      }

      // 在 Name 區塊後，找第一個有效的中文名
      if (foundNameSection) {
        const chineseMatch = line.match(/^([\u4e00-\u9fff]{2,4})$/)
        if (chineseMatch) {
          const candidate = chineseMatch[1]
          if (!excludeWords.some(word => candidate.includes(word))) {
            chineseName = candidate
            console.log('✅ Google Vision 找到中文名 (Name區塊後):', candidate)
            break
          }
        }

        // 如果遇到英文名（大寫字母開頭，含逗號），表示中文名應該在這之前或這一行
        if (/^[A-Z]+,\s*[A-Z-]+/.test(line)) {
          // 檢查同一行是否有中文
          const inlineChineseMatch = line.match(/([\u4e00-\u9fff]{2,4})/)
          if (inlineChineseMatch && !excludeWords.some(word => inlineChineseMatch[1].includes(word))) {
            chineseName = inlineChineseMatch[1]
            console.log('✅ Google Vision 找到中文名 (與英文同行):', chineseName)
          }
          break // 已經過了中文名的位置
        }
      }
    }

    // 策略 2: 如果策略1沒找到，找英文名附近的中文
    if (!chineseName && customerData.passport_romanization) {
      // 從護照拼音取得姓氏 (例如 "LIN/LI-HUI" -> "LIN")
      const surname = customerData.passport_romanization.split('/')[0]?.toUpperCase()
      if (surname) {
        // 找英文姓氏在文字中的位置
        const surnameIndex = googleVisionText.toUpperCase().indexOf(surname)
        if (surnameIndex > 0) {
          // 取英文姓氏前面 50 個字元，找中文名
          const beforeSurname = googleVisionText.substring(Math.max(0, surnameIndex - 50), surnameIndex)
          const chineseMatches = beforeSurname.match(/[\u4e00-\u9fff]{2,4}/g)
          if (chineseMatches) {
            // 取最後一個（最接近英文名的）
            const candidate = chineseMatches[chineseMatches.length - 1]
            if (!excludeWords.some(word => candidate.includes(word))) {
              chineseName = candidate
              console.log('✅ Google Vision 找到中文名 (英文名前):', candidate)
            }
          }
        }
      }
    }

    // 策略 3: 備用方案 - 找所有中文字，排除常見詞彙後取第一個看起來像人名的
    if (!chineseName) {
      const chineseNames = googleVisionText.match(/[\u4e00-\u9fff]{2,4}/g)
      if (chineseNames) {
        // 過濾掉排除詞彙
        const validNames = chineseNames.filter(name =>
          !excludeWords.some(word => name.includes(word)) &&
          name.length >= 2 && name.length <= 4
        )
        // 跳過前幾個可能是標題的詞，取後面的
        if (validNames.length > 2) {
          chineseName = validNames[2] // 跳過可能的標題詞
          console.log('✅ Google Vision 找到中文名 (備用-跳過標題):', chineseName)
        } else if (validNames.length > 0) {
          chineseName = validNames[0]
          console.log('✅ Google Vision 找到中文名 (備用):', chineseName)
        }
      }
    }

    // 檢查中文名是否可疑（含有常見 OCR 錯字）
    if (chineseName && suspiciousChars.some(char => chineseName.includes(char))) {
      console.log('⚠️ 中文名含可疑字元:', chineseName)
      chineseNameConfidence = 'low'
    }

    // 用拼音交叉驗證中文名字數
    if (chineseName && customerData.passport_romanization) {
      const validation = validateChineseNameByPinyin(chineseName, customerData.passport_romanization)
      if (!validation.valid) {
        console.log(`⚠️ 中文名字數不符: 預期 ${validation.expectedLength} 字, 實際 ${chineseName.length} 字`)
        chineseNameConfidence = 'low'
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
  // 如果中文名可靠，優先使用中文名
  // 如果中文名不可靠（含可疑字元），則用「中文名 (拼音)」標記待確認
  if (chineseName && chineseNameConfidence === 'high') {
    customerData.name = chineseName
    if (englishName) {
      customerData.english_name = englishName
    }
  } else if (chineseName && chineseNameConfidence === 'low') {
    // 中文名可能有誤，加上拼音方便核對
    if (customerData.passport_romanization) {
      customerData.name = `${chineseName}(${customerData.passport_romanization})`
      console.log('⚠️ 中文名不可靠，使用組合格式:', customerData.name)
    } else {
      customerData.name = chineseName
    }
    if (englishName) {
      customerData.english_name = englishName
    }
  } else if (customerData.passport_romanization) {
    // 沒有中文名，使用 MRZ 拼音
    customerData.name = customerData.passport_romanization.replace('/', ' ')
    console.log('📝 使用 MRZ 拼音作為姓名:', customerData.name)
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
 * 檢查 Google Vision API 使用量（支援多 Key 輪換）
 */
async function checkGoogleVisionUsage(
  requestCount: number,
  apiKeys: string[]
): Promise<{
  canUseGoogleVision: boolean
  availableKey: string | null
  currentUsage: number
  totalLimit: number
  warning: string | null
}> {
  // 沒有設定任何 Key
  if (apiKeys.length === 0) {
    return {
      canUseGoogleVision: false,
      availableKey: null,
      currentUsage: 0,
      totalLimit: 0,
      warning: '⚠️ Google Vision API Key 未設定，中文名辨識已停用。',
    }
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const totalLimit = GOOGLE_VISION_LIMIT_PER_KEY * apiKeys.length

    // 查詢所有 Key 的使用量
    const { data: usageData } = await supabase
      .from('api_usage')
      .select('api_name, usage_count')
      .like('api_name', 'google_vision_%')
      .eq('month', currentMonth)

    // 建立 Key -> 使用量 的對照表
    const usageByKey: Record<string, number> = {}
    let totalUsage = 0

    for (let i = 0; i < apiKeys.length; i++) {
      const keyId = `google_vision_${i}` // 用索引來識別 Key
      const usage = usageData?.find(d => d.api_name === keyId)?.usage_count || 0
      usageByKey[keyId] = usage
      totalUsage += usage
    }

    // 找出可用的 Key（額度未滿的第一個）
    let availableKey: string | null = null
    let availableKeyId: string | null = null

    for (let i = 0; i < apiKeys.length; i++) {
      const keyId = `google_vision_${i}`
      const usage = usageByKey[keyId] || 0
      const newUsage = usage + requestCount

      if (newUsage <= GOOGLE_VISION_LIMIT_PER_KEY) {
        availableKey = apiKeys[i]
        availableKeyId = keyId
        console.log(`✅ 使用 Google Vision Key ${i + 1} (${apiKeys[i].slice(0, 12)}...) - 使用量: ${usage}/${GOOGLE_VISION_LIMIT_PER_KEY}`)
        break
      } else {
        console.log(`⚠️ Google Vision Key ${i + 1} 額度已滿 (${usage}/${GOOGLE_VISION_LIMIT_PER_KEY})，嘗試下一個...`)
      }
    }

    // 所有 Key 都用完了
    if (!availableKey) {
      return {
        canUseGoogleVision: false,
        availableKey: null,
        currentUsage: totalUsage,
        totalLimit,
        warning: `⚠️ Google Vision API 本月所有 Key 額度都已用完 (${totalUsage}/${totalLimit})，中文名辨識已停用。護照其他資訊仍可正常辨識。`,
      }
    }

    // 計算使用量警告
    const usagePercent = (totalUsage / totalLimit) * 100
    let warning: string | null = null

    if (usagePercent >= 95) {
      warning = `🔴 Google Vision API 使用量已達 ${usagePercent.toFixed(0)}% (${totalUsage}/${totalLimit})，即將達到上限！`
    } else if (usagePercent >= 80) {
      warning = `🟡 Google Vision API 使用量已達 ${usagePercent.toFixed(0)}% (${totalUsage}/${totalLimit})`
    }

    return {
      canUseGoogleVision: true,
      availableKey,
      currentUsage: totalUsage,
      totalLimit,
      warning,
    }
  } catch (error) {
    console.error('檢查 API 使用量失敗:', error)
    // 發生錯誤時使用第一個 Key（避免因為 DB 問題影響正常功能）
    return {
      canUseGoogleVision: true,
      availableKey: apiKeys[0],
      currentUsage: 0,
      totalLimit: GOOGLE_VISION_LIMIT_PER_KEY * apiKeys.length,
      warning: null,
    }
  }
}

/**
 * 更新 Google Vision API 使用量（支援多 Key 追蹤）
 */
async function updateGoogleVisionUsage(count: number, usedKey: string): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const currentMonth = new Date().toISOString().slice(0, 7)
    const apiKeys = getGoogleVisionKeys()

    // 找出使用的 Key 對應的索引
    const keyIndex = apiKeys.findIndex(k => k === usedKey)
    const keyId = keyIndex >= 0 ? `google_vision_${keyIndex}` : 'google_vision_0'

    // 先查詢當前使用量
    const { data: existing } = await supabase
      .from('api_usage')
      .select('usage_count')
      .eq('api_name', keyId)
      .eq('month', currentMonth)
      .single()

    const newCount = (existing?.usage_count || 0) + count

    // 使用 upsert 更新或新增記錄
    const { error } = await supabase
      .from('api_usage')
      .upsert(
        {
          api_name: keyId,
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
      console.log(`📊 Google Vision Key ${keyIndex + 1} 使用量更新: ${newCount}/${GOOGLE_VISION_LIMIT_PER_KEY}`)
    }
  } catch (error) {
    console.error('更新 API 使用量失敗:', error)
  }
}
