import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 service role 來繞過 RLS（API 端會自己驗證權限）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 會員等級定義
 * 根據累積點數計算對應等級
 */
interface LevelDefinition {
  name: string
  minPoints: number
  maxPoints: number
}

const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { name: '新手旅人', minPoints: 0, maxPoints: 99 },
  { name: '探索者', minPoints: 100, maxPoints: 499 },
  { name: '冒險家', minPoints: 500, maxPoints: 1499 },
  { name: '環球達人', minPoints: 1500, maxPoints: 4999 },
  { name: '旅行大師', minPoints: 5000, maxPoints: 14999 },
  { name: '傳奇旅人', minPoints: 15000, maxPoints: Infinity }
]

/**
 * 根據點數計算等級名稱
 */
function calculateLevel(points: number): string {
  const level = LEVEL_DEFINITIONS.find(
    l => points >= l.minPoints && points <= l.maxPoints
  )
  return level?.name ?? '新手旅人'
}

/**
 * 計算到下一等級還需要的點數
 */
function getPointsToNextLevel(points: number): number | null {
  const currentLevelIndex = LEVEL_DEFINITIONS.findIndex(
    l => points >= l.minPoints && points <= l.maxPoints
  )

  // 如果已經是最高等級
  if (currentLevelIndex === LEVEL_DEFINITIONS.length - 1) {
    return null
  }

  const nextLevel = LEVEL_DEFINITIONS[currentLevelIndex + 1]
  return nextLevel.minPoints - points
}

/**
 * 徽章資訊類型
 */
interface EarnedBadge {
  id: string
  name: string
  description: string
  icon_url: string | null
  category: string | null
  earned_at: string
}

/**
 * GET /api/my/passport-info
 *
 * 獲取使用者的旅人護照資訊
 * 包含：點數、等級、已獲得的徽章
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     total_points: number,
 *     level_name: string,
 *     next_level_name: string | null,
 *     points_to_next_level: number | null,
 *     earned_badges: [
 *       {
 *         id: string,
 *         name: string,
 *         description: string,
 *         icon_url: string | null,
 *         category: string | null,
 *         earned_at: string
 *       }
 *     ]
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
      // 使用者不在 customers 表中，回傳初始狀態
      return NextResponse.json({
        success: true,
        data: {
          total_points: 0,
          level_name: '新手旅人',
          next_level_name: '探索者',
          points_to_next_level: 100,
          earned_badges: []
        },
        message: '找不到對應的客戶資料'
      })
    }

    const totalPoints = customer.total_points || 0

    // 4. 計算等級資訊
    const levelName = calculateLevel(totalPoints)
    const pointsToNextLevel = getPointsToNextLevel(totalPoints)

    // 計算下一等級名稱
    const currentLevelIndex = LEVEL_DEFINITIONS.findIndex(
      l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints
    )
    const nextLevelName = currentLevelIndex < LEVEL_DEFINITIONS.length - 1
      ? LEVEL_DEFINITIONS[currentLevelIndex + 1].name
      : null

    // 5. 查詢已獲得的徽章（JOIN user_badges 和 badge_definitions）
    const { data: userBadges, error: badgesError } = await supabase
      .from('user_badges')
      .select(`
        id,
        earned_at,
        badge_definitions (
          id,
          name,
          description,
          icon_url,
          category
        )
      `)
      .eq('user_id', customer.id)
      .order('earned_at', { ascending: false })

    if (badgesError) {
      console.error('查詢徽章失敗:', badgesError)
      // 徽章查詢失敗不影響其他資料，繼續回傳
    }

    // 6. 整理徽章列表
    // Supabase 對於單一關聯返回物件，非陣列
    interface BadgeDefinition {
      id: string
      name: string
      description: string
      icon_url: string | null
      category: string | null
    }

    interface UserBadgeWithDefinition {
      id: string
      earned_at: string
      badge_definitions: BadgeDefinition | null
    }

    const earnedBadges: EarnedBadge[] = ((userBadges || []) as unknown as UserBadgeWithDefinition[])
      .filter(ub => ub.badge_definitions !== null)
      .map(ub => {
        const badge = ub.badge_definitions!
        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon_url: badge.icon_url,
          category: badge.category,
          earned_at: ub.earned_at
        }
      })

    // 7. 回傳護照資訊
    return NextResponse.json({
      success: true,
      data: {
        total_points: totalPoints,
        level_name: levelName,
        next_level_name: nextLevelName,
        points_to_next_level: pointsToNextLevel,
        earned_badges: earnedBadges
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
