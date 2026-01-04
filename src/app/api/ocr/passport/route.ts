import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'

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
      return errorResponse('不支援的 Content-Type', 400, ErrorCode.INVALID_FORMAT)
    }

    if (base64Images.length === 0) {
      return errorResponse('沒有上傳檔案', 400, ErrorCode.MISSING_FIELD)
    }

    const ocrSpaceKey = process.env.OCR_SPACE_API_KEY
    const googleVisionKeys = getGoogleVisionKeys()

    // 至少需要一個 API Key
    if (!ocrSpaceKey && googleVisionKeys.length === 0) {
      return errorResponse(
        'OCR API Key 未設定。請設定 OCR_SPACE_API_KEY 或 GOOGLE_VISION_API_KEYS 環境變數。',
        500,
        ErrorCode.INTERNAL_ERROR
      )
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
          // 同時呼叫兩個 API（如果有設定的話）
          const [ocrSpaceResult, googleVisionResult] = await Promise.all([
            // OCR.space - MRZ 辨識（如果有 key）
            ocrSpaceKey ? callOcrSpace(img.data, ocrSpaceKey) : Promise.resolve(''),
            // Google Vision - 中文辨識（如果有可用的 key）
            (availableKey && canUseGoogleVision) ? callGoogleVision(img.data, availableKey) : Promise.resolve(null),
          ])

          // 解析護照資訊（合併兩個 API 的結果）
          const customerData = parsePassportText(ocrSpaceResult, googleVisionResult, img.name)

          return {
            success: true,
            fileName: img.name,
            customer: customerData,
            rawText: ocrSpaceResult,
            imageBase64: img.data, // 🔥 回傳圖片 base64 給前端儲存
          }
        } catch (error) {
          logger.error(`辨識失敗 (${img.name}):`, error)
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

    return successResponse({
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
    logger.error('護照辨識錯誤:', error)
    return errorResponse(
      error instanceof Error ? error.message : '處理失敗',
      500,
      ErrorCode.INTERNAL_ERROR
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
            // 使用 DOCUMENT_TEXT_DETECTION 對文件類圖片辨識效果更好
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            // 提示包含繁體中文和英文，提高中文辨識率
            imageContext: {
              languageHints: ['zh-TW', 'en'],
            },
          },
        ],
      }),
    }
  )

  const data = await response.json()

  if (data.error) {
    logger.error('Google Vision 錯誤:', data.error)
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
    'CHENG', 'ZHENG', 'CHEN', 'ZHEN', // 鄭、陳等常見姓
    'HUANG', 'HSIANG', 'XIANG', 'HSIAO', 'XIAO', 'HSIEH', 'XIE', 'HSIUNG', 'XIONG',
    'KUANG', 'GUANG', 'KUAN', 'GUAN', 'KWANG',
    'LIANG', 'LING', 'LUNG', 'LONG',
    'SHENG', 'SHANG', 'SHUANG', 'SHUI',
    'TSUNG', 'TSENG', 'TZENG', 'TSAI', 'TZAI',
    'YUAN', 'YUEN', // 元、媛等常見名
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
  // 範例2：P<TWNHSIAO<<CHENG<LIN<<<<<<<<<<<<<<<<<<<<<
  // 改進：優先使用 Google Vision 的 MRZ（更準確），OCR.space 作為備用
  // 原因：OCR.space 容易把某些字母漏掉（例如 LEE → EE）
  // MRZ Line 1 總是 44 字元，以 P< 開頭
  let mrzLine1Match: RegExpMatchArray | null = null

  // 優先嘗試 Google Vision（更準確）
  if (cleanGoogleText) {
    mrzLine1Match = cleanGoogleText.match(/P<([A-Z]{3})([A-Z<]{2,39})/i)
  }

  // 如果 Google Vision 沒找到，才用 OCR.space
  if (!mrzLine1Match) {
    mrzLine1Match = cleanText.match(/P<([A-Z]{3})([A-Z<]{2,39})/i)
  }

  // 備用方案：如果上面沒找到，嘗試更寬鬆的匹配（處理 OCR 誤讀 < 為 I 的情況）
  if (!mrzLine1Match) {
    // 有些 OCR 會把 < 讀成 I 或其他字元
    const relaxedMatch = cleanText.match(/P[<I\|]([A-Z]{3})([A-Z<I\|]{2,39})/i) ||
                        cleanGoogleText?.match(/P[<I\|]([A-Z]{3})([A-Z<I\|]{2,39})/i)
    if (relaxedMatch) {
      // 將誤讀的 I 或 | 還原成 <
      mrzLine1Match = [
        relaxedMatch[0],
        relaxedMatch[1],
        relaxedMatch[2].replace(/[I\|]/g, '<')
      ] as RegExpMatchArray
    }
  }

  if (mrzLine1Match) {
    const countryCode = mrzLine1Match[1]
    const namePart = mrzLine1Match[2]

    customerData.nationality = countryCode

    const parts = namePart.split('<<')
    if (parts.length >= 2) {
      const surname = parts[0].replace(/</g, '')
      // 名字中的 < 表示音節分隔，替換成 - 以便後續計算字數
      const givenNamesWithDash = parts[1].replace(/</g, '-').replace(/-+$/, '').trim()
      const givenNamesClean = givenNamesWithDash.replace(/-/g, '')

      // 護照拼音：姓/名，不含連字號（定位系統需要）
      customerData.passport_romanization = `${surname}/${givenNamesClean}`
      // 內部用：保留連字號以便計算字數
      ;(customerData as Record<string, unknown>)._romanization_with_dash = `${surname}/${givenNamesWithDash}`
      customerData.english_name = `${surname} ${givenNamesClean}`
      customerData.name = `${surname} ${givenNamesClean}`
    } else if (parts.length === 1) {
      // 只有姓氏
      const surname = parts[0].replace(/</g, '')
      customerData.passport_romanization = surname
      customerData.english_name = surname
      customerData.name = surname
    }
  }

  // ========== 第二行 MRZ：解析詳細資料 ==========
  // 格式：護照號碼(9)+檢查碼(1)+國籍(3)+生日YYMMDD(6)+檢查碼(1)+性別(1)+效期YYMMDD(6)+檢查碼(1)+身分證或其他
  // 範例：3141148363TWN6012111F2610254G220796971<<<32

  // 優先使用 Google Vision（更準確），OCR.space 作為備用
  let mrzLine2Match: RegExpMatchArray | null = null

  // 優先嘗試 Google Vision
  if (cleanGoogleText) {
    mrzLine2Match = cleanGoogleText.match(
      /(\d{9})(\d)([A-Z]{3})(\d{6})(\d)([MF])(\d{6})(\d)([A-Z0-9<]+)/i
    )
  }

  // 如果 Google Vision 沒找到，才用 OCR.space
  if (!mrzLine2Match) {
    mrzLine2Match = cleanText.match(
      /(\d{9})(\d)([A-Z]{3})(\d{6})(\d)([MF])(\d{6})(\d)([A-Z0-9<]+)/i
    )
  }

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
  } else {
    // 備用方案：嘗試從護照資訊區域抓取（兩個來源都試）
    const textToSearch = cleanText || cleanGoogleText

    // 找護照號碼（9碼數字）
    const passportMatch = textToSearch.match(/(\d{9})/g)
    if (passportMatch && passportMatch.length > 0) {
      // 第一個 9 碼數字通常是護照號碼
      customerData.passport_number = passportMatch[0]
    }

    // 找身分證號（1英文+9數字）
    const nationalIdMatch = textToSearch.match(/[A-Z][12]\d{8}/i)
    if (nationalIdMatch) {
      customerData.national_id = nationalIdMatch[0]
      // 從身分證第二碼判斷性別
      customerData.sex = nationalIdMatch[0].charAt(1) === '1' ? '男' : '女'
    }

    // 找日期格式（DD MMM YYYY 或 YYYY-MM-DD）
    // 改進：使用標籤來區分效期和發照日期
    const dateTextSource = ocrSpaceText || googleVisionText || ''

    // 先找標籤對應的日期
    const expiryMatch = dateTextSource.match(/(?:expiry|有效期|截止|效期)[^\d]*(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)
    const issueMatch = dateTextSource.match(/(?:issue|發照|發給)[^\d]*(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)
    const birthMatch = dateTextSource.match(/(?:birth|出生)[^\d]*(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)

    const monthMap: { [key: string]: string } = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    }

    const formatDate = (m: RegExpMatchArray) => {
      const day = m[1].padStart(2, '0')
      const month = monthMap[m[2].toUpperCase()]
      const year = m[3]
      return `${year}-${month}-${day}`
    }

    if (expiryMatch && !customerData.passport_expiry_date) {
      customerData.passport_expiry_date = formatDate(expiryMatch)
    }
    if (birthMatch && !customerData.date_of_birth) {
      customerData.date_of_birth = formatDate(birthMatch)
    }

    // 如果標籤沒找到，再用日期推斷（但排除發照日期）
    if (!customerData.passport_expiry_date || !customerData.date_of_birth) {
      const allDateMatches = dateTextSource.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/gi)
      if (allDateMatches) {
        // 排除已經找到的日期和發照日期
        const issueDateStr = issueMatch ? formatDate(issueMatch) : null

        for (const dateStr of allDateMatches) {
          const match = dateStr.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)
          if (match) {
            const formattedDate = formatDate(match)
            const year = parseInt(match[3])

            // 跳過發照日期
            if (formattedDate === issueDateStr) continue

            // 效期：2024 以後的日期（更嚴格）
            if (year >= 2024 && !customerData.passport_expiry_date) {
              customerData.passport_expiry_date = formattedDate
            }
            // 生日：1920-2015 之間
            else if (year >= 1920 && year <= 2015 && !customerData.date_of_birth) {
              customerData.date_of_birth = formattedDate
            }
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
    // 排除詞彙清單（擴充）
    // 包含：護照欄位、身分證欄位（父母、住址、配偶等）、地名、機關名稱
    const excludeWords = [
      // 護照欄位
      '護照', '中華', '民國', '姓名', '國籍', '性別', '出生', '日期', '效期', '機關',
      '外交部', '台灣', '發照', '截止', '型式', '代碼', '持照', '簽名', '身分', '證號',
      '地址', '地點', '有效', '領事', '事務', '局長', '署長', '部長', '主任', '科長',
      '號碼', '編號', '頁碼', '登記', '註冊', '申請', '核發', '換發', '補發', '延期',
      '年月日', '出生地', '發照日', '截止日',
      // 身分證欄位（重要！避免抓到父母/配偶/住址等）
      '父', '母', '配偶', '役別', '住址', '出生地', '發證', '換發', '補發',
      '臺北', '臺中', '臺南', '高雄', '新北', '桃園', '新竹', '嘉義', '彰化',
      '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
      // 地名（可能出現在住址或出生地）
      '中國', '台北', '高雄', '台中', '台南', '新北', '桃園', '新竹', '嘉義', '彰化',
      '基隆', '宜蘭', '花蓮', '台東', '苗栗', '南投', '雲林', '屏東', '澎湖', '金門', '連江',
      // 緊急聯絡人欄位
      '緊急', '聯絡', '聯絡人'
    ]
    // 常見 OCR 錯字（這些字很少出現在人名中）
    const suspiciousChars = ['仔', '佬', '的', '是', '在', '了', '有', '個', '這', '那', '和', '與', '或', '為', '被', '把', '給', '讓', '著', '過']

    // 策略 0 (新增): 直接找 "姓名" 或 "Name" 標籤後緊鄰的中文名
    // 台灣護照格式: 姓名 / Name (Surname, Given names)
    //              王薇琦
    //              WANG, WEI-CHI
    const nameBlockMatch = googleVisionText.match(/(?:姓名|姓\s*名|Name)[^\n]*[\n\r]+([\u4e00-\u9fff]{2,4})/i)
    if (nameBlockMatch) {
      const candidate = nameBlockMatch[1]
      if (!excludeWords.some(word => candidate.includes(word))) {
        chineseName = candidate
        chineseNameConfidence = 'high'
      }
    }

    // 策略 1: 找 Name/姓名 區塊後面緊鄰的中文名
    // 護照格式通常是: /Name (Surname, Given names)\n中文名\n英文名
    if (!chineseName) {
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
              chineseNameConfidence = 'high' // 策略1找到的信心度高
              break
            }
          }

          // 如果遇到英文名（大寫字母開頭，含逗號），表示中文名應該在這之前或這一行
          if (/^[A-Z]+,\s*[A-Z-]+/.test(line)) {
            // 檢查同一行是否有中文
            const inlineChineseMatch = line.match(/([\u4e00-\u9fff]{2,4})/)
            if (inlineChineseMatch && !excludeWords.some(word => inlineChineseMatch[1].includes(word))) {
              chineseName = inlineChineseMatch[1]
              chineseNameConfidence = 'high'
            }
            break // 已經過了中文名的位置
          }
        }
      }
    }

    // 策略 2: 如果策略1沒找到，找英文名附近的中文
    if (!chineseName && customerData.passport_romanization) {
      // 從護照拼音取得姓氏 (例如 "LIN/LI-HUI" -> "LIN")
      const surname = customerData.passport_romanization.split('/')[0]?.toUpperCase()
      if (surname) {
        // 找英文姓氏在文字中的位置（用逗號格式，如 "WANG, WEI"）
        const englishNamePattern = new RegExp(`${surname}[,\\s]+[A-Z-]+`, 'i')
        const englishNameMatch = googleVisionText.match(englishNamePattern)
        if (englishNameMatch) {
          const matchIndex = googleVisionText.indexOf(englishNameMatch[0])
          // 取英文姓氏前面 80 個字元，找中文名
          const beforeEnglish = googleVisionText.substring(Math.max(0, matchIndex - 80), matchIndex)
          // 找最後一個 2-4 字的中文詞（排除排除詞）
          const chineseMatches = beforeEnglish.match(/[\u4e00-\u9fff]{2,4}/g)
          if (chineseMatches) {
            // 從後往前找，取第一個不是排除詞的
            for (let i = chineseMatches.length - 1; i >= 0; i--) {
              const candidate = chineseMatches[i]
              if (!excludeWords.some(word => candidate.includes(word))) {
                chineseName = candidate
                chineseNameConfidence = 'medium' // 策略2信心度中等
                break
              }
            }
          }
        }
      }
    }

    // 策略 3: 備用方案 - 但標記為低信心度，需要人工確認
    // 改進：不再隨便抓，而是跳過這步驟，讓使用者手動輸入
    if (!chineseName) {
      chineseNameConfidence = 'none'
    }

    // 檢查中文名是否可疑（含有常見 OCR 錯字）
    if (chineseName && suspiciousChars.some(char => chineseName.includes(char))) {
      chineseNameConfidence = 'low'
    }

    // 用拼音交叉驗證中文名字數（更嚴格）
    // 使用帶連字號的版本來正確計算音節數
    const romanizationForValidation = (customerData as Record<string, unknown>)._romanization_with_dash as string || customerData.passport_romanization
    if (chineseName && romanizationForValidation) {
      const validation = validateChineseNameByPinyin(chineseName, romanizationForValidation)
      if (!validation.valid) {
        // 如果字數差太多，直接放棄這個中文名
        if (Math.abs(validation.expectedLength - chineseName.length) > 1) {
          chineseName = ''
          chineseNameConfidence = 'none'
        } else {
          chineseNameConfidence = 'low'
        }
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
        break
      }
    }
  }

  // ========== 決定最終姓名 ==========
  // 根據信心度決定顯示方式
  // high: 直接使用中文名
  // medium: 使用中文名，但加上 ⚠️ 標記
  // low: 使用「中文名(拼音)⚠️」格式
  // none: 只使用拼音
  if (chineseName && chineseNameConfidence === 'high') {
    customerData.name = chineseName
    if (englishName) {
      customerData.english_name = englishName
    }
  } else if (chineseName && chineseNameConfidence === 'medium') {
    // 中等信心度，加上標記提醒確認
    customerData.name = `${chineseName}⚠️`
    if (englishName) {
      customerData.english_name = englishName
    }
  } else if (chineseName && chineseNameConfidence === 'low') {
    // 低信心度，加上拼音方便核對
    if (customerData.passport_romanization) {
      customerData.name = `${chineseName}(${customerData.passport_romanization})⚠️`
    } else {
      customerData.name = `${chineseName}⚠️`
    }
    if (englishName) {
      customerData.english_name = englishName
    }
  } else if (customerData.passport_romanization) {
    // 沒有可靠的中文名，使用 MRZ 拼音（格式化為易讀形式）
    const [surname, givenName] = customerData.passport_romanization.split('/')
    customerData.name = givenName ? `${surname} ${givenName}` : surname
    customerData.english_name = customerData.name
  } else if (englishName) {
    customerData.name = englishName
  }

  // 最後備用：用檔案名稱
  if (!customerData.name) {
    customerData.name = fileName.replace(/\.(jpg|jpeg|png|gif)$/i, '')
  }

  // 移除內部用的臨時欄位（不存入資料庫）
  delete (customerData as Record<string, unknown>)._romanization_with_dash

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
    const supabase = getSupabaseAdminClient()

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
        break
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
    logger.error('檢查 API 使用量失敗:', error)
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
    const supabase = getSupabaseAdminClient()

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
      logger.error('upsert 失敗:', error)
    }
  } catch (error) {
    logger.error('更新 API 使用量失敗:', error)
  }
}
