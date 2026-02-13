/**
 * OCR API 客戶端
 * 封裝 OCR.space 和 Google Vision API 呼叫
 */

import { logger } from '@/lib/utils/logger'

/**
 * 呼叫 OCR.space API（專門辨識 MRZ）
 */
export async function callOcrSpace(base64Image: string, apiKey: string): Promise<string> {
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
export async function callGoogleVision(base64Image: string, apiKey: string): Promise<string> {
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
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
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
