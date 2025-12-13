import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 使用 service role 來繞過 RLS
 * 這是安全的，因為我們在伺服器端驗證並只回傳非敏感資訊
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 請求 Body 類型
 */
interface VerifyCustomerRequest {
  phone?: string              // 手機號碼 (擇一)
  email?: string              // Email (擇一)
  national_id_last4: string   // 身分證後四碼
  date_of_birth: string       // 生日 (格式: YYYY-MM-DD)
}

/**
 * POST /api/auth/verify-customer
 *
 * 驗證舊客戶身份
 * 使用 service role 繞過 RLS，在伺服器端進行安全驗證
 *
 * Request Body:
 * {
 *   phone?: string,           // 手機號碼 (與 email 擇一)
 *   email?: string,           // Email (與 phone 擇一)
 *   national_id_last4: string, // 身分證後四碼
 *   date_of_birth: string     // 生日 (YYYY-MM-DD)
 * }
 *
 * Response (成功):
 * {
 *   success: true,
 *   data: {
 *     customer_id: string,
 *     name: string,
 *     email: string | null,
 *     phone: string | null,
 *     is_verified: boolean
 *   }
 * }
 *
 * Response (失敗):
 * {
 *   success: false,
 *   error: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析請求 Body
    let body: VerifyCustomerRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: '無效的 JSON 格式' },
        { status: 400 }
      )
    }

    // 2. 驗證必填欄位
    if (!body.phone && !body.email) {
      return NextResponse.json(
        { success: false, error: '請提供手機號碼或 Email' },
        { status: 400 }
      )
    }

    if (!body.national_id_last4) {
      return NextResponse.json(
        { success: false, error: '請提供身分證後四碼' },
        { status: 400 }
      )
    }

    if (!body.date_of_birth) {
      return NextResponse.json(
        { success: false, error: '請提供生日' },
        { status: 400 }
      )
    }

    // 3. 驗證身分證後四碼格式 (4 位數字或英文)
    if (!/^[A-Za-z0-9]{4}$/.test(body.national_id_last4)) {
      return NextResponse.json(
        { success: false, error: '身分證後四碼格式不正確' },
        { status: 400 }
      )
    }

    // 4. 驗證生日格式 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.date_of_birth)) {
      return NextResponse.json(
        { success: false, error: '生日格式不正確，請使用 YYYY-MM-DD 格式' },
        { status: 400 }
      )
    }

    // 5. 使用 service role 查詢客戶
    let query = supabase
      .from('customers')
      .select('id, name, email, phone, national_id, date_of_birth, verification_status')

    // 根據提供的識別方式查詢
    if (body.phone) {
      query = query.eq('phone', body.phone)
    } else if (body.email) {
      query = query.eq('email', body.email.toLowerCase())
    }

    const { data: customer, error: queryError } = await query.single()

    if (queryError || !customer) {
      // 不要透露具體原因，避免資訊洩漏
      return NextResponse.json(
        { success: false, error: '找不到符合的客戶資料，請確認輸入的資訊是否正確' },
        { status: 404 }
      )
    }

    // 6. 驗證身分證後四碼
    const storedNationalIdLast4 = customer.national_id?.slice(-4)?.toUpperCase()
    const inputNationalIdLast4 = body.national_id_last4.toUpperCase()

    if (!storedNationalIdLast4 || storedNationalIdLast4 !== inputNationalIdLast4) {
      // 記錄失敗嘗試 (可選：可以加入防暴力破解機制)
      console.warn(`驗證失敗: 身分證後四碼不符 - Customer ID: ${customer.id}`)
      return NextResponse.json(
        { success: false, error: '身分驗證失敗，請確認輸入的資訊是否正確' },
        { status: 401 }
      )
    }

    // 7. 驗證生日
    // customer.date_of_birth 是 DATE 類型，格式為 YYYY-MM-DD
    const storedBirthDate = customer.date_of_birth
    const inputBirthDate = body.date_of_birth

    if (!storedBirthDate || storedBirthDate !== inputBirthDate) {
      console.warn(`驗證失敗: 生日不符 - Customer ID: ${customer.id}`)
      return NextResponse.json(
        { success: false, error: '身分驗證失敗，請確認輸入的資訊是否正確' },
        { status: 401 }
      )
    }

    // 8. 驗證成功！回傳非敏感資訊
    return NextResponse.json({
      success: true,
      data: {
        customer_id: customer.id,
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone || null,
        is_verified: customer.verification_status === 'verified'
      }
    })

  } catch (error) {
    console.error('驗證客戶 API 錯誤:', error)
    return NextResponse.json(
      { success: false, error: '伺服器錯誤，請稍後再試' },
      { status: 500 }
    )
  }
}
