import { adminDb } from '@/lib/supabase/admin.ts'

const MINDEE_API_KEY = process.env.MINDEE_API_KEY || ''
const MINDEE_PASSPORT_API_URL = 'https://api.mindee.net/v1/products/mindee/passport/v1/predict'

interface MindeePassportData {
  // Define the expected structure of the Mindee API response
  // This is a simplified example based on common passport fields
  given_names: { value: string; confidence: number }[]
  surname: { value: string; confidence: number }
  id_number: { value: string; confidence: number }
  expiry_date: { value: string; confidence: number }
  birth_date: { value: string; confidence: number }
  // ... other fields
}

/**
 * Logs an API call to the internal database.
 */
async function logApiCall() {
  try {
    const { error } = await adminDb.from('api_usage_log').insert({
      api_service: 'mindee_passport_ocr',
    })

    if (error) {
      // Log the error but don't block the main operation
      console.error('Failed to log API call:', error)
    }
  } catch (err) {
    console.error('Unexpected error during API call logging:', err)
  }
}

/**
 * Parses a passport image file using the Mindee OCR API.
 * @param file The passport image file to parse.
 * @returns The extracted passport data or an error object.
 */
export async function parsePassportWithMindee(file: File) {
  if (!MINDEE_API_KEY) {
    console.error('Mindee API key is not configured.')
    return { error: 'OCR service is not configured on the server.' }
  }

  const formData = new FormData()
  formData.append('document', file)

  try {
    const response = await fetch(MINDEE_PASSPORT_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${MINDEE_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorBody = await response.json()
      console.error('Mindee API error:', errorBody)
      return { error: `Mindee API request failed: ${errorBody.message || response.statusText}` }
    }
    
    // After a successful API call, log it.
    // We do this asynchronously without waiting for it to complete.
    logApiCall()

    const result = await response.json()
    
    // You would add more comprehensive data extraction and transformation logic here
    const documentData = result.document.inference.prediction
    const passportData = {
        passport_number: documentData.id_number.value,
        name: `${documentData.surname.value}, ${documentData.given_names.map(n => n.value).join(' ')}`,
        expiry_date: documentData.expiry_date.value,
        birth_date: documentData.birth_date.value,
        //... map other fields
    }

    return { data: passportData }

  } catch (err: any) {
    console.error('Error calling Mindee API:', err)
    return { error: 'An unexpected error occurred while calling the OCR service.' }
  }
}
