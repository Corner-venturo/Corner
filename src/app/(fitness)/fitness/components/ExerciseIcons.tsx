/**
 * Corner Fitness - 訓練圖標組件
 * 使用 Lucide React 圖標替代 emoji
 */

import {
  Dumbbell,
  Zap,
  Activity,
  Bike,
  Waves,
  Move,
  CircleDot,
  Footprints,
  Flame,
  type LucideIcon,
} from 'lucide-react'

// 圖標類型映射
export const EXERCISE_ICON_MAP: Record<string, LucideIcon> = {
  dumbbell: Dumbbell, // 器械訓練 (對應原 🏋️)
  zap: Zap, // 徒手訓練 (對應原 💪)
  activity: Activity, // 跑步/活動 (對應原 🏃)
  bike: Bike, // 飛輪 (對應原 🚴)
  waves: Waves, // 划船 (對應原 🚣)
  move: Move, // 跳躍 (對應原 🦘)
  boxing: CircleDot, // 拳擊 (對應原 🥊)
  footprints: Footprints, // 腿部 (對應原 🦵)
  flame: Flame, // 核心/火焰 (對應原 🔥)
}

// 部位分類圖標映射
export const MUSCLE_GROUP_ICONS: Record<string, LucideIcon> = {
  chest: Dumbbell, // 胸部
  back: Activity, // 背部
  legs: Footprints, // 腿部
  shoulders: Dumbbell, // 肩膀
  arms: Zap, // 手臂
  core: Flame, // 核心
  cardio: Activity, // 有氧
}

interface ExerciseIconProps {
  iconName: string
  className?: string
}

/**
 * 訓練圖標組件
 * 根據圖標名稱渲染對應的 Lucide 圖標
 */
export function ExerciseIcon({ iconName, className = 'w-5 h-5' }: ExerciseIconProps) {
  const Icon = EXERCISE_ICON_MAP[iconName] || Dumbbell

  return <Icon className={className} />
}

interface MuscleGroupIconProps {
  groupId: string
  className?: string
}

/**
 * 部位分類圖標組件
 */
export function MuscleGroupIcon({
  groupId,
  className = 'w-6 h-6',
}: MuscleGroupIconProps) {
  const Icon = MUSCLE_GROUP_ICONS[groupId] || Dumbbell

  return <Icon className={className} />
}

/**
 * 獲取圖標名稱（用於資料庫儲存）
 */
export function getIconName(category: string, equipment?: string): string {
  // 根據器材類型決定圖標
  if (equipment === '徒手') return 'zap'
  if (category === 'cardio') {
    if (equipment === '飛輪') return 'bike'
    if (equipment === '划船機') return 'waves'
    if (equipment === '跳繩') return 'move'
    if (equipment === '沙包') return 'boxing'
    return 'activity'
  }
  // 預設使用啞鈴圖標
  return 'dumbbell'
}
