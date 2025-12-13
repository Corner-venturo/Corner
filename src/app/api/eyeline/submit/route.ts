import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 service role 來繞過 RLS（API 端會自己驗證權限）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 提交類型定義
 */
type SubmissionType =
  | 'PHOTO_STOREFRONT'    // 店面照片
  | 'PHOTO_MENU'          // 菜單照片
  | 'PHOTO_ENVIRONMENT'   // 環境照片
  | 'DINE_IN_FEEDBACK'    // 用餐回饋
  | 'PRICE_UPDATE'        // 價格更新
  | 'NEW_LOCATION'        // 新地點回報

/**
 * 請求 Body 類型
 */
interface SubmitEyelineRequest {
  submission_type: SubmissionType
  target_entity_info: {
    name?: string           // 目標名稱（店名、景點名）
    address?: string        // 地址
    attraction_id?: string  // 關聯的景點 ID（如有）
    latitude?: number       // 緯度
    longitude?: number      // 經度
  }
  submission_content: {
    image_urls?: string[]   // 圖片 URL 列表
    user_comment?: string   // 使用者評論
    rating?: number         // 評分 (1-5)
    price_info?: {          // 價格資訊（用於 PRICE_UPDATE）
      items?: Array<{ name: string; price: number }>
    }
  }
}

/**
 * POST /api/eyeline/submit
 *
 * 提交旅人眼線資料
 *
 * Request Body:
 * {
 *   submission_type: 'PHOTO_STOREFRONT' | 'PHOTO_MENU' | 'PHOTO_ENVIRONMENT' | 'DINE_IN_FEEDBACK' | 'PRICE_UPDATE' | 'NEW_LOCATION',
 *   target_entity_info: {
 *     name?: string,
 *     address?: string,
 *     attraction_id?: string,
 *     latitude?: number,
 *     longitude?: number
 *   },
 *   submission_content: {
 *     image_urls?: string[],
 *     user_comment?: string,
 *     rating?: number,
 *     price_info?: { items?: Array<{ name: string, price: number }> }
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: string,
 *     status: 'pending_review',
 *     message: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 從 Authorization header 取得 token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供認證 token' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // 2. 驗證 token 並取得使用者資訊
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '認證失敗', details: authError?.message },
        { status: 401 }
      )
    }

    // 3. 透過 email 找到對應的 customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('email', user.email)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: '找不到對應的客戶資料，請確認您已註冊為客戶' },
        { status: 404 }
      )
    }

    // 4. 解析請求 Body
    let body: SubmitEyelineRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: '無效的 JSON 格式' },
        { status: 400 }
      )
    }

    // 5. 驗證必填欄位
    const validSubmissionTypes: SubmissionType[] = [
      'PHOTO_STOREFRONT',
      'PHOTO_MENU',
      'PHOTO_ENVIRONMENT',
      'DINE_IN_FEEDBACK',
      'PRICE_UPDATE',
      'NEW_LOCATION'
    ]

    if (!body.submission_type || !validSubmissionTypes.includes(body.submission_type)) {
      return NextResponse.json(
        { error: '無效的提交類型', valid_types: validSubmissionTypes },
        { status: 400 }
      )
    }

    if (!body.target_entity_info || Object.keys(body.target_entity_info).length === 0) {
      return NextResponse.json(
        { error: '必須提供目標資訊 (target_entity_info)' },
        { status: 400 }
      )
    }

    if (!body.submission_content || Object.keys(body.submission_content).length === 0) {
      return NextResponse.json(
        { error: '必須提供提交內容 (submission_content)' },
        { status: 400 }
      )
    }

    // 6. 驗證圖片類型的提交必須有圖片
    const photoTypes: SubmissionType[] = ['PHOTO_STOREFRONT', 'PHOTO_MENU', 'PHOTO_ENVIRONMENT']
    if (photoTypes.includes(body.submission_type)) {
      if (!body.submission_content.image_urls || body.submission_content.image_urls.length === 0) {
        return NextResponse.json(
          { error: '照片類型的提交必須包含至少一張圖片' },
          { status: 400 }
      )
      }

      // 驗證圖片 URL 格式
      const urlPattern = /^https?:\/\/.+/
      const invalidUrls = body.submission_content.image_urls.filter(url => !urlPattern.test(url))
      if (invalidUrls.length > 0) {
        return NextResponse.json(
          { error: '包含無效的圖片 URL', invalid_urls: invalidUrls },
          { status: 400 }
        )
      }
    }

    // 7. 驗證評分範圍
    if (body.submission_content.rating !== undefined) {
      if (body.submission_content.rating < 1 || body.submission_content.rating > 5) {
        return NextResponse.json(
          { error: '評分必須在 1-5 之間' },
          { status: 400 }
        )
      }
    }

    // 8. 寫入 eyeline_submissions 資料表
    const { data: submission, error: insertError } = await supabase
      .from('eyeline_submissions')
      .insert({
        user_id: customer.id,
        submission_type: body.submission_type,
        target_entity_info: body.target_entity_info,
        submission_content: body.submission_content,
        status: 'pending_review',
        points_awarded: 0
      })
      .select('id, status, created_at')
      .single()

    if (insertError) {
      console.error('寫入眼線資料失敗:', insertError)
      return NextResponse.json(
        { error: '提交失敗', details: insertError.message },
        { status: 500 }
      )
    }

    // 9. 回傳成功訊息
    return NextResponse.json({
      success: true,
      data: {
        id: submission.id,
        status: submission.status,
        created_at: submission.created_at,
        message: '感謝您的回報！我們將盡快審核您的提交，審核通過後將發放點數獎勵。'
      }
    })

  } catch (error) {
    console.error('API 錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
