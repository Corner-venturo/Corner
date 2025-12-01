import { NextRequest, NextResponse } from 'next/server'

/**
 * 護照 OCR 辨識 API
 * 使用 OCR.space API 辨識護照資訊
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '沒有上傳檔案' }, { status: 400 })
    }

    const apiKey = process.env.OCR_SPACE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OCR API Key 未設定' }, { status: 500 })
    }

    // 批次辨識所有護照
    const results = await Promise.all(
      files.map(async file => {
        try {
          // 將檔案轉換為 Base64
          const buffer = await file.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const base64Image = `data:${file.type};base64,${base64}`

          // 呼叫 OCR.space API
          const ocrFormData = new FormData()
          ocrFormData.append('base64Image', base64Image)
          ocrFormData.append('language', 'eng')
          ocrFormData.append('isOverlayRequired', 'false')
          ocrFormData.append('detectOrientation', 'true')
          ocrFormData.append('scale', 'true')
          ocrFormData.append('OCREngine', '2') // 使用 Engine 2 (更準確)

          const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
              apikey: apiKey,
            },
            body: ocrFormData,
          })

          const data = await response.json()

          if (data.IsErroredOnProcessing) {
            const errorMsg = data.ErrorMessage?.[0] || '辨識失敗'
            console.error(`❌ OCR 失敗 (${file.name}):`, errorMsg)
            throw new Error(errorMsg)
          }

          // 提取辨識文字
          const text = data.ParsedResults?.[0]?.ParsedText || ''

          // 解析護照資訊
          const customerData = parsePassportText(text, file.name)

          // 保留壓縮後的圖片（base64）
          return {
            success: true,
            fileName: file.name,
            customer: customerData,
            rawText: text,
            imageBase64: base64Image, // 回傳壓縮後的圖片
          }
        } catch (error) {
          console.error(`辨識失敗 (${file.name}):`, error)
          return {
            success: false,
            fileName: file.name,
            error: error instanceof Error ? error.message : '未知錯誤',
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      results,
      total: files.length,
      successful: results.filter(r => r.success).length,
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
 * 解析護照 OCR 文字
 * 從 OCR 文字中提取護照資訊（使用 MRZ 機器可讀區）
 *
 * MRZ 格式範例：
 * 第一行：P<TWNCHANG<<PEI<WEN<<<<<<<<<<<<<<<<<<<<<
 * 第二行：3519446134TWN5909267F2903194A220425846<<<78
 *
 * 第二行解析：
 * - 護照號碼 (9碼): 351944613
 * - 檢查碼 (1碼): 4
 * - 國籍 (3碼): TWN
 * - 生日 (6碼): 590926 -> 1959/09/26
 * - 性別 (1碼): F
 * - 效期 (6碼): 290319 -> 2029/03/19
 * - 身分證 (10碼): A220425846
 */
function parsePassportText(text: string, fileName: string) {
  // 移除所有空白和換行，方便比對
  const cleanText = text.replace(/\s+/g, '')

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
  // 格式：P<TWNCHANG<<PEI<WEN<<<<<<<<<<<<<<<<<<<<<
  // 或：  P<USASMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<
  const mrzLine1Match = cleanText.match(/P<([A-Z]{3})([A-Z<]+)/i)
  if (mrzLine1Match) {
    const countryCode = mrzLine1Match[1] // 國家代碼（如 TWN, USA, JPN）
    const namePart = mrzLine1Match[2]

    // 儲存國籍
    customerData.nationality = countryCode

    // 分離姓氏和名字（用 << 分隔）
    const parts = namePart.split('<<')
    if (parts.length >= 2) {
      const surname = parts[0].replace(/</g, '')
      // 名字部分：移除所有 < 符號，不加空格（例如：PEI<WEN → PEIWEN）
      const givenNames = parts[1].replace(/</g, '')

      // 護照拼音格式：CHANG/PEIWEN（名字不分開）
      customerData.passport_romanization = `${surname}/${givenNames}`
      // 英文姓名：CHANG PEIWEN（名字合併，姓和名之間保留空格）
      customerData.english_name = `${surname} ${givenNames}`
      // 中文姓名（外國人就用英文名）
      customerData.name = `${surname} ${givenNames}`
    }
  }

  // ========== 第二行 MRZ：解析詳細資料 ==========
  // 格式：3519446134TWN5909267F2903194A220425846<<<78（台灣）
  // 或：  123456789USA8501011M2501015<<<<<<<<<<<<<<06（美國）
  // 通用格式：[護照號碼][檢查碼][國籍3碼][生日6碼][檢查碼][性別1碼][效期6碼][檢查碼][其他資料]
  const mrzLine2Match = cleanText.match(
    /([A-Z0-9]{9})(\d)([A-Z]{3})(\d{6})(\d)([MF])(\d{6})(\d)([A-Z0-9<]+)/i
  )

  if (mrzLine2Match) {
    // 1. 護照號碼（可能包含字母，例如美國護照）
    customerData.passport_number = mrzLine2Match[1]

    // 2. 確認國籍（如果第一行沒抓到）
    if (!customerData.nationality) {
      customerData.nationality = mrzLine2Match[3]
    }

    // 3. 生日 (YYMMDD)
    const birthYY = mrzLine2Match[4].substring(0, 2)
    const birthMM = mrzLine2Match[4].substring(2, 4)
    const birthDD = mrzLine2Match[4].substring(4, 6)
    const birthYear = parseInt(birthYY) > 50 ? `19${birthYY}` : `20${birthYY}`
    customerData.date_of_birth = `${birthYear}-${birthMM}-${birthDD}`

    // 4. 性別
    customerData.sex = mrzLine2Match[6] === 'F' ? '女' : '男'

    // 5. 護照效期 (YYMMDD)
    const expiryYY = mrzLine2Match[7].substring(0, 2)
    const expiryMM = mrzLine2Match[7].substring(2, 4)
    const expiryDD = mrzLine2Match[7].substring(4, 6)
    const expiryYear = parseInt(expiryYY) > 50 ? `19${expiryYY}` : `20${expiryYY}`
    customerData.passport_expiry_date = `${expiryYear}-${expiryMM}-${expiryDD}`

    // 6. 台灣護照特有：身分證字號（其他國家可能沒有）
    if (customerData.nationality === 'TWN') {
      const nationalId = mrzLine2Match[9].replace(/</g, '').substring(0, 10)
      if (nationalId && nationalId.length === 10) {
        customerData.national_id = nationalId
      }
    }
  }

  // 如果 MRZ 解析失敗，嘗試備用方案
  if (!customerData.passport_number) {
    // 尋找 9 碼護照號碼
    const passportMatch = text.match(/\b\d{9}\b/)
    if (passportMatch) {
      customerData.passport_number = passportMatch[0]
    }
  }

  // 如果還是沒有姓名，使用檔案名稱
  if (!customerData.name) {
    customerData.name = fileName.replace(/\.(jpg|jpeg|png|gif)$/i, '')
  }

  return customerData
}
