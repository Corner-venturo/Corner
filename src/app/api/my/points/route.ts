import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 service role 來繞過 RLS（API 端會自己驗證權限）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/my/points
 *
 * 獲取當前使用者的點數資訊與交易歷史
 *
 * Query Parameters:
 * - limit: 交易歷史筆數限制 (預設 20，最大 100)
 * - offset: 分頁偏移量 (預設 0)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     total_points: number,
 *     transactions: [
 *       {
 *         id: string,
 *         points_change: number,
 *         transaction_type: string,
 *         description: string | null,
 *         reference_id: string | null,
 *         created_at: string
 *       }
 *     ],
 *     pagination: {
 *       limit: number,
 *       offset: number,
 *       total: number,
 *       has_more: boolean
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
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
      .select('id, name, email, total_points')
      .eq('email', user.email)
      .single()

    if (customerError || !customer) {
      // 使用者不在 customers 表中，回傳 0 點和空交易記錄
      return NextResponse.json({
        success: true,
        data: {
          total_points: 0,
          transactions: [],
          pagination: {
            limit: 20,
            offset: 0,
            total: 0,
            has_more: false
          }
        },
        message: '找不到對應的客戶資料'
      })
    }

    // 4. 解析分頁參數
    const searchParams = request.nextUrl.searchParams
    let limit = parseInt(searchParams.get('limit') || '20', 10)
    let offset = parseInt(searchParams.get('offset') || '0', 10)

    // 限制範圍
    limit = Math.min(Math.max(1, limit), 100)
    offset = Math.max(0, offset)

    // 5. 查詢交易歷史總數
    const { count: totalCount, error: countError } = await supabase
      .from('user_points_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', customer.id)

    if (countError) {
      console.error('查詢交易總數失敗:', countError)
    }

    // 6. 查詢交易歷史
    const { data: transactions, error: transactionsError } = await supabase
      .from('user_points_transactions')
      .select(`
        id,
        points_change,
        transaction_type,
        description,
        reference_id,
        created_at
      `)
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (transactionsError) {
      console.error('查詢交易歷史失敗:', transactionsError)
      return NextResponse.json(
        { error: '查詢交易歷史失敗', details: transactionsError.message },
        { status: 500 }
      )
    }

    // 7. 格式化交易類型名稱
    const formattedTransactions = (transactions || []).map(tx => ({
      ...tx,
      transaction_type_display: getTransactionTypeDisplay(tx.transaction_type)
    }))

    // 8. 回傳結果
    const total = totalCount || 0
    return NextResponse.json({
      success: true,
      data: {
        total_points: customer.total_points || 0,
        transactions: formattedTransactions,
        pagination: {
          limit,
          offset,
          total,
          has_more: offset + limit < total
        }
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

/**
 * 將交易類型轉換為人類可讀的名稱
 */
function getTransactionTypeDisplay(type: string): string {
  const typeMap: Record<string, string> = {
    'EYELINE_PHOTO_SUBMISSION': '眼線照片回報獎勵',
    'EYELINE_FEEDBACK': '眼線回饋獎勵',
    'REDEEM_SERVICE': '兌換服務',
    'REFERRAL_BONUS': '推薦好友獎勵',
    'MANUAL_ADJUSTMENT': '系統調整',
    'BADGE_REWARD': '徽章獎勵',
    'TRIP_COMPLETION': '完成行程獎勵',
    'FIRST_TRIP': '首次行程獎勵'
  }
  return typeMap[type] || type
}
