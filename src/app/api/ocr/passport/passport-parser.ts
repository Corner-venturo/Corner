/**
 * 護照 OCR 文字解析器
 * 合併 OCR.space（MRZ）和 Google Vision（中文）的結果
 */

// ============================================
// Types
// ============================================

export interface PassportCustomerData {
  name: string
  english_name?: string
  passport_number?: string
  passport_name?: string
  passport_name_print?: string
  national_id?: string
  birth_date?: string
  passport_expiry?: string
  nationality?: string
  sex?: string
  phone?: string
}

// ============================================
// 拼音驗證
// ============================================

// 台灣護照常見拼音音節
const COMMON_SYLLABLES = [
  'YING', 'YANG', 'WANG', 'WONG', 'CHANG', 'ZHANG', 'CHUNG', 'ZHONG', 'CHUANG', 'ZHUANG',
  'CHIANG', 'JIANG', 'CHIEN', 'JIAN', 'CHIEH', 'JIE', 'CHIAO', 'JIAO', 'CHING', 'JING',
  'CHENG', 'ZHENG', 'CHEN', 'ZHEN',
  'HUANG', 'HSIANG', 'XIANG', 'HSIAO', 'XIAO', 'HSIEH', 'XIE', 'HSIUNG', 'XIONG',
  'KUANG', 'GUANG', 'KUAN', 'GUAN', 'KWANG',
  'LIANG', 'LING', 'LUNG', 'LONG',
  'SHENG', 'SHANG', 'SHUANG', 'SHUI',
  'TSUNG', 'TSENG', 'TZENG', 'TSAI', 'TZAI',
  'YUAN', 'YUEN',
  'WEN', 'WAN', 'WEI', 'WAI', 'YEN', 'YAN', 'YAO', 'YIN', 'YOU', 'YUN', 'YUE',
  'CHU', 'CHA', 'CHE', 'CHI', 'CHO',
  'SHU', 'SHA', 'SHE', 'SHI', 'SHO',
  'ZHU', 'ZHA', 'ZHE', 'ZHI', 'ZHO',
  'ANG', 'ENG', 'ING', 'ONG', 'UNG',
  'HUA', 'HUI', 'HAO', 'HOU', 'HAN', 'HEN', 'HUN',
  'KAI', 'KEI', 'KUI', 'KAN', 'KEN', 'KUN', 'KAO', 'KOU',
  'GAI', 'GEI', 'GUI', 'GAN', 'GEN', 'GUN', 'GAO', 'GOU',
  'LAI', 'LEI', 'LUI', 'LAN', 'LEN', 'LUN', 'LAO', 'LOU', 'LIN', 'LIU',
  'MAI', 'MEI', 'MAN', 'MEN', 'MIN', 'MOU',
  'NAI', 'NEI', 'NAN', 'NEN', 'NIN', 'NOU',
  'PAI', 'PEI', 'PAN', 'PEN', 'PIN', 'POU',
  'TAI', 'TEI', 'TAN', 'TEN', 'TIN', 'TOU', 'TUN',
  'DAI', 'DEI', 'DAN', 'DEN', 'DIN', 'DOU', 'DUN',
  'SAI', 'SAN', 'SEN', 'SIN', 'SOU', 'SUN',
  'ZAI', 'ZAN', 'ZEN', 'ZIN', 'ZOU', 'ZUN',
  'CAI', 'CAN', 'CEN', 'CIN', 'COU', 'CUN',
  'FAN', 'FEN', 'FOU', 'FUN',
  'RAN', 'REN', 'ROU', 'RUN', 'RUI',
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

/**
 * 用拼音驗證中文名是否合理
 */
function validateChineseNameByPinyin(chineseName: string, romanization: string): { valid: boolean; expectedLength: number } {
  if (!romanization || !chineseName) {
    return { valid: true, expectedLength: 0 }
  }

  const parts = romanization.toUpperCase().split('/')
  if (parts.length !== 2) {
    return { valid: true, expectedLength: 0 }
  }

  const surname = parts[0]
  const givenName = parts[1]

  const countSyllables = (s: string): number => {
    if (s.includes('-')) {
      return s.split('-').filter(Boolean).length
    }

    s = s.toUpperCase()
    let count = 0
    let remaining = s

    while (remaining.length > 0) {
      let matched = false
      for (let len = Math.min(6, remaining.length); len >= 2; len--) {
        const prefix = remaining.substring(0, len)
        if (COMMON_SYLLABLES.includes(prefix)) {
          count++
          remaining = remaining.substring(len)
          matched = true
          break
        }
      }
      if (!matched) {
        const vowelMatch = remaining.match(/^[^AEIOU]*[AEIOU]+[NG]*/i)
        if (vowelMatch) {
          count++
          remaining = remaining.substring(vowelMatch[0].length)
        } else if (remaining.length > 0) {
          count++
          break
        }
      }
    }

    return Math.max(count, 1)
  }

  const expectedLength = countSyllables(surname) + countSyllables(givenName)
  const valid = chineseName.length >= expectedLength

  return { valid, expectedLength }
}

// ============================================
// MRZ 解析
// ============================================

interface MrzParseResult {
  passportName: string | null
  passportNamePrint: string | null
  englishName: string | null
  nationality: string | null
  romanizationWithDash: string | null
}

function parseMrzLine1(cleanText: string, cleanGoogleText: string): MrzParseResult {
  const result: MrzParseResult = {
    passportName: null,
    passportNamePrint: null,
    englishName: null,
    nationality: null,
    romanizationWithDash: null,
  }

  let mrzLine1Match: RegExpMatchArray | null = null

  // 優先嘗試 Google Vision（更準確）
  if (cleanGoogleText) {
    mrzLine1Match = cleanGoogleText.match(/P<([A-Z]{3})([A-Z<]{2,39})/i)
  }
  if (!mrzLine1Match) {
    mrzLine1Match = cleanText.match(/P<([A-Z]{3})([A-Z<]{2,39})/i)
  }

  // 備用：處理 OCR 誤讀 < 為 I 的情況
  if (!mrzLine1Match) {
    const relaxedMatch = cleanText.match(/P[<I\|]([A-Z]{3})([A-Z<I\|]{2,39})/i) ||
                        cleanGoogleText?.match(/P[<I\|]([A-Z]{3})([A-Z<I\|]{2,39})/i)
    if (relaxedMatch) {
      mrzLine1Match = [
        relaxedMatch[0],
        relaxedMatch[1],
        relaxedMatch[2].replace(/[I\|]/g, '<')
      ] as RegExpMatchArray
    }
  }

  if (!mrzLine1Match) return result

  result.nationality = mrzLine1Match[1]
  const namePart = mrzLine1Match[2]
  const parts = namePart.split('<<')

  if (parts.length >= 2) {
    const surname = parts[0].replace(/</g, '')
    const givenNamesWithDash = parts[1].replace(/</g, '-').replace(/-+$/, '').trim()
    const givenNamesClean = givenNamesWithDash.replace(/-/g, '')

    result.passportName = `${surname}/${givenNamesClean}`
    result.passportNamePrint = `${surname}, ${givenNamesWithDash}`
    result.romanizationWithDash = `${surname}/${givenNamesWithDash}`
    result.englishName = `${surname} ${givenNamesClean}`
  } else if (parts.length === 1) {
    const surname = parts[0].replace(/</g, '')
    result.passportName = surname
    result.passportNamePrint = surname
    result.englishName = surname
  }

  return result
}

interface MrzLine2Result {
  passportNumber: string | null
  nationality: string | null
  birthDate: string | null
  sex: string | null
  passportExpiry: string | null
  nationalId: string | null
}

function parseMrzLine2(cleanText: string, cleanGoogleText: string, knownNationality: string | null): MrzLine2Result {
  const result: MrzLine2Result = {
    passportNumber: null,
    nationality: null,
    birthDate: null,
    sex: null,
    passportExpiry: null,
    nationalId: null,
  }

  let match: RegExpMatchArray | null = null
  if (cleanGoogleText) {
    match = cleanGoogleText.match(/(\d{9})(\d)([A-Z]{3})(\d{6})(\d)([MF])(\d{6})(\d)([A-Z0-9<]+)/i)
  }
  if (!match) {
    match = cleanText.match(/(\d{9})(\d)([A-Z]{3})(\d{6})(\d)([MF])(\d{6})(\d)([A-Z0-9<]+)/i)
  }

  if (match) {
    result.passportNumber = match[1]
    result.nationality = match[3]

    const birthYY = match[4].substring(0, 2)
    const birthMM = match[4].substring(2, 4)
    const birthDD = match[4].substring(4, 6)
    const birthYear = parseInt(birthYY) > 50 ? `19${birthYY}` : `20${birthYY}`
    result.birthDate = `${birthYear}-${birthMM}-${birthDD}`

    result.sex = match[6] === 'F' ? '女' : '男'

    const expiryYY = match[7].substring(0, 2)
    const expiryMM = match[7].substring(2, 4)
    const expiryDD = match[7].substring(4, 6)
    const expiryYear = parseInt(expiryYY) > 50 ? `19${expiryYY}` : `20${expiryYY}`
    result.passportExpiry = `${expiryYear}-${expiryMM}-${expiryDD}`

    const effectiveNationality = result.nationality || knownNationality
    if (effectiveNationality === 'TWN') {
      const remaining = match[9].replace(/</g, '')
      const nationalIdMatch = remaining.match(/([A-Z]\d{9})/i)
      if (nationalIdMatch) {
        result.nationalId = nationalIdMatch[1]
      }
    }
  }

  return result
}

function parseFallbackFields(
  cleanText: string,
  ocrSpaceText: string,
  googleVisionText: string | null
): MrzLine2Result {
  const result: MrzLine2Result = {
    passportNumber: null,
    nationality: null,
    birthDate: null,
    sex: null,
    passportExpiry: null,
    nationalId: null,
  }

  const textToSearch = cleanText

  const passportMatch = textToSearch.match(/(\d{9})/g)
  if (passportMatch && passportMatch.length > 0) {
    result.passportNumber = passportMatch[0]
  }

  const nationalIdMatch = textToSearch.match(/[A-Z][12]\d{8}/i)
  if (nationalIdMatch) {
    result.nationalId = nationalIdMatch[0]
    result.sex = nationalIdMatch[0].charAt(1) === '1' ? '男' : '女'
  }

  const dateTextSource = ocrSpaceText || googleVisionText || ''
  const monthMap: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
  }

  const formatDate = (m: RegExpMatchArray) => {
    const day = m[1].padStart(2, '0')
    const month = monthMap[m[2].toUpperCase()]
    const year = m[3]
    return `${year}-${month}-${day}`
  }

  const expiryMatch = dateTextSource.match(/(?:expiry|有效期|截止|效期)[^\d]*(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)
  const issueMatch = dateTextSource.match(/(?:issue|發照|發給)[^\d]*(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)
  const birthMatch = dateTextSource.match(/(?:birth|出生)[^\d]*(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)

  if (expiryMatch) result.passportExpiry = formatDate(expiryMatch)
  if (birthMatch) result.birthDate = formatDate(birthMatch)

  if (!result.passportExpiry || !result.birthDate) {
    const issueDateStr = issueMatch ? formatDate(issueMatch) : null
    const allDateMatches = dateTextSource.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/gi)

    if (allDateMatches) {
      for (const dateStr of allDateMatches) {
        const match = dateStr.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i)
        if (match) {
          const formattedDate = formatDate(match)
          const year = parseInt(match[3])
          if (formattedDate === issueDateStr) continue
          if (year >= 2024 && !result.passportExpiry) {
            result.passportExpiry = formattedDate
          } else if (year >= 1920 && year <= 2015 && !result.birthDate) {
            result.birthDate = formattedDate
          }
        }
      }
    }
  }

  return result
}

// ============================================
// 中文名辨識
// ============================================

// 排除詞彙清單
const EXCLUDE_WORDS = [
  '護照', '中華', '民國', '姓名', '國籍', '性別', '出生', '日期', '效期', '機關',
  '外交部', '台灣', '發照', '截止', '型式', '代碼', '持照', '簽名', '身分', '證號',
  '地址', '地點', '有效', '領事', '事務', '局長', '署長', '部長', '主任', '科長',
  '號碼', '編號', '頁碼', '登記', '註冊', '申請', '核發', '換發', '補發', '延期',
  '年月日', '出生地', '發照日', '截止日',
  '父', '母', '配偶', '役別', '住址',
  '臺北', '臺中', '臺南', '高雄', '新北', '桃園', '新竹', '嘉義', '彰化',
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '中國', '台北', '高雄', '台中', '台南', '新北', '桃園', '新竹', '嘉義', '彰化',
  '基隆', '宜蘭', '花蓮', '台東', '苗栗', '南投', '雲林', '屏東', '澎湖', '金門', '連江',
  '緊急', '聯絡', '聯絡人',
]

const SUSPICIOUS_CHARS = ['仔', '佬', '的', '是', '在', '了', '有', '個', '這', '那', '和', '與', '或', '為', '被', '把', '給', '讓', '著', '過']

function extractChineseName(
  googleVisionText: string | null,
  passportName: string | null,
  romanizationWithDash: string | null
): { name: string; confidence: string } {
  if (!googleVisionText) return { name: '', confidence: 'none' }

  let chineseName = ''
  let confidence = 'high'

  const isExcluded = (candidate: string) => EXCLUDE_WORDS.some(word => candidate.includes(word))

  // 策略 0: 找 "姓名" 標籤後的中文名
  const nameBlockMatch = googleVisionText.match(/(?:姓名|姓\s*名|Name)[^\n]*[\n\r]+([\u4e00-\u9fff]{2,4})/i)
  if (nameBlockMatch && !isExcluded(nameBlockMatch[1])) {
    chineseName = nameBlockMatch[1]
    confidence = 'high'
  }

  // 策略 1: 找 Name 區塊後面的中文名
  if (!chineseName) {
    const lines = googleVisionText.split('\n')
    let foundNameSection = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (/Name|姓名|Given names/i.test(trimmed)) {
        foundNameSection = true
        continue
      }
      if (foundNameSection) {
        const chineseMatch = trimmed.match(/^([\u4e00-\u9fff]{2,4})$/)
        if (chineseMatch && !isExcluded(chineseMatch[1])) {
          chineseName = chineseMatch[1]
          confidence = 'high'
          break
        }
        if (/^[A-Z]+,\s*[A-Z-]+/.test(trimmed)) {
          const inlineMatch = trimmed.match(/([\u4e00-\u9fff]{2,4})/)
          if (inlineMatch && !isExcluded(inlineMatch[1])) {
            chineseName = inlineMatch[1]
            confidence = 'high'
          }
          break
        }
      }
    }
  }

  // 策略 2: 找英文名附近的中文
  if (!chineseName && passportName) {
    const surname = passportName.split('/')[0]?.toUpperCase()
    if (surname) {
      const pattern = new RegExp(`${surname}[,\\s]+[A-Z-]+`, 'i')
      const englishNameMatch = googleVisionText.match(pattern)
      if (englishNameMatch) {
        const matchIndex = googleVisionText.indexOf(englishNameMatch[0])
        const beforeEnglish = googleVisionText.substring(Math.max(0, matchIndex - 80), matchIndex)
        const chineseMatches = beforeEnglish.match(/[\u4e00-\u9fff]{2,4}/g)
        if (chineseMatches) {
          for (let i = chineseMatches.length - 1; i >= 0; i--) {
            if (!isExcluded(chineseMatches[i])) {
              chineseName = chineseMatches[i]
              confidence = 'medium'
              break
            }
          }
        }
      }
    }
  }

  if (!chineseName) confidence = 'none'

  // 可疑字元檢查
  if (chineseName && SUSPICIOUS_CHARS.some(char => chineseName.includes(char))) {
    confidence = 'low'
  }

  // 拼音交叉驗證
  const romanization = romanizationWithDash || passportName
  if (chineseName && romanization) {
    const validation = validateChineseNameByPinyin(chineseName, romanization)
    if (!validation.valid) {
      if (Math.abs(validation.expectedLength - chineseName.length) > 1) {
        return { name: '', confidence: 'none' }
      }
      confidence = 'low'
    }
  }

  return { name: chineseName, confidence }
}

// ============================================
// 主解析函數
// ============================================

/**
 * 解析護照 OCR 文字
 */
export function parsePassportText(
  ocrSpaceText: string,
  googleVisionText: string | null,
  fileName: string
): PassportCustomerData {
  const cleanText = ocrSpaceText.replace(/\s+/g, '')
  const cleanGoogleText = googleVisionText?.replace(/\s+/g, '') || ''

  const customerData: PassportCustomerData = { name: '', phone: '' }

  // 解析 MRZ 第一行（姓名、國籍）
  const mrz1 = parseMrzLine1(cleanText, cleanGoogleText)
  if (mrz1.nationality) customerData.nationality = mrz1.nationality
  if (mrz1.passportName) customerData.passport_name = mrz1.passportName
  if (mrz1.passportNamePrint) customerData.passport_name_print = mrz1.passportNamePrint
  if (mrz1.englishName) {
    customerData.english_name = mrz1.englishName
    customerData.name = mrz1.englishName
  }

  // 解析 MRZ 第二行（護照號碼、生日、性別、效期）
  const mrz2 = parseMrzLine2(cleanText, cleanGoogleText, mrz1.nationality)
  if (mrz2.passportNumber) customerData.passport_number = mrz2.passportNumber
  if (!customerData.nationality && mrz2.nationality) customerData.nationality = mrz2.nationality
  if (mrz2.birthDate) customerData.birth_date = mrz2.birthDate
  if (mrz2.sex) customerData.sex = mrz2.sex
  if (mrz2.passportExpiry) customerData.passport_expiry = mrz2.passportExpiry
  if (mrz2.nationalId) customerData.national_id = mrz2.nationalId

  // MRZ 第二行解析失敗時使用備用方案
  if (!mrz2.passportNumber) {
    const fallback = parseFallbackFields(cleanText, ocrSpaceText, googleVisionText)
    if (fallback.passportNumber) customerData.passport_number = fallback.passportNumber
    if (fallback.nationalId) customerData.national_id = fallback.nationalId
    if (fallback.sex) customerData.sex = fallback.sex
    if (fallback.passportExpiry) customerData.passport_expiry = fallback.passportExpiry
    if (fallback.birthDate) customerData.birth_date = fallback.birthDate
  }

  // 從 Google Vision 抓中文名
  const { name: chineseName, confidence } = extractChineseName(
    googleVisionText,
    customerData.passport_name || null,
    mrz1.romanizationWithDash
  )

  // 從 OCR.space 抓英文名（備用）
  let englishName = ''
  if (!customerData.name) {
    const lines = ocrSpaceText.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (/name|surname|given/i.test(trimmed)) continue
      const nameMatch = trimmed.match(/^([A-Z]{2,}),\s*([A-Z][A-Z-]+)$/i)
      if (nameMatch) {
        const surname = nameMatch[1]
        const givenNameWithDash = nameMatch[2]
        const givenNameClean = givenNameWithDash.replace(/-/g, '')
        englishName = `${surname} ${givenNameClean}`
        customerData.english_name = englishName
        customerData.passport_name = `${surname}/${givenNameClean}`
        customerData.passport_name_print = `${surname}, ${givenNameWithDash}`
        break
      }
    }
  }

  // 決定最終姓名
  if (chineseName && confidence === 'high') {
    customerData.name = chineseName
    if (englishName) customerData.english_name = englishName
  } else if (chineseName && confidence === 'medium') {
    customerData.name = `${chineseName}⚠️`
    if (englishName) customerData.english_name = englishName
  } else if (chineseName && confidence === 'low') {
    customerData.name = customerData.passport_name
      ? `${chineseName}(${customerData.passport_name})⚠️`
      : `${chineseName}⚠️`
    if (englishName) customerData.english_name = englishName
  } else if (customerData.passport_name) {
    const [surname, givenName] = customerData.passport_name.split('/')
    customerData.name = givenName ? `${surname} ${givenName}` : surname
    customerData.english_name = customerData.name
  } else if (englishName) {
    customerData.name = englishName
  }

  if (!customerData.name) {
    customerData.name = fileName.replace(/\.(jpg|jpeg|png|gif)$/i, '')
  }

  return customerData
}
