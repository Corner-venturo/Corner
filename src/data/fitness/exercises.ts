/**
 * Corner Fitness - 完整動作庫
 * 參考 Strong / MOHOT / 训记 的常見動作
 */

export interface Exercise {
  id: number
  name: string
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio'
  equipment?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  icon: string // Lucide 圖標名稱
}

export const EXERCISES: Exercise[] = [
  // ========== 胸部 (Chest) - 18 個 ==========
  { id: 1, name: '槓鈴臥推', category: 'chest', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 2, name: '啞鈴臥推', category: 'chest', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 3, name: '上斜槓鈴臥推', category: 'chest', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 4, name: '上斜啞鈴臥推', category: 'chest', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 5, name: '下斜槓鈴臥推', category: 'chest', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 6, name: '下斜啞鈴臥推', category: 'chest', equipment: '啞鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 7, name: '啞鈴飛鳥', category: 'chest', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 8, name: '上斜啞鈴飛鳥', category: 'chest', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 9, name: '繩索夾胸', category: 'chest', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 10, name: '高位繩索夾胸', category: 'chest', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 11, name: '低位繩索夾胸', category: 'chest', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 12, name: '伏地挺身', category: 'chest', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 13, name: '寬距伏地挺身', category: 'chest', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 14, name: '上斜伏地挺身', category: 'chest', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 15, name: '下斜伏地挺身', category: 'chest', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },
  { id: 16, name: '史密斯機臥推', category: 'chest', equipment: '史密斯機', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 17, name: '胸推機', category: 'chest', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 18, name: '蝴蝶機夾胸', category: 'chest', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },

  // ========== 背部 (Back) - 25 個 ==========
  { id: 101, name: '引體向上', category: 'back', equipment: '徒手', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 102, name: '反手引體向上', category: 'back', equipment: '徒手', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 103, name: '寬握引體向上', category: 'back', equipment: '徒手', difficulty: 'advanced', icon: 'dumbbell' },
  { id: 104, name: '滑輪下拉', category: 'back', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 105, name: '反手滑輪下拉', category: 'back', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 106, name: '槓鈴划船', category: 'back', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 107, name: '反手槓鈴划船', category: 'back', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 108, name: '單臂啞鈴划船', category: 'back', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 109, name: '雙手啞鈴划船', category: 'back', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 110, name: '坐姿划船', category: 'back', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 111, name: 'T槓划船', category: 'back', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 112, name: '硬舉', category: 'back', equipment: '槓鈴', difficulty: 'advanced', icon: 'dumbbell' },
  { id: 113, name: '羅馬尼亞硬舉', category: 'back', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 114, name: '相撲硬舉', category: 'back', equipment: '槓鈴', difficulty: 'advanced', icon: 'dumbbell' },
  { id: 115, name: '單腿硬舉', category: 'back', equipment: '啞鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 116, name: '直腿硬舉', category: 'back', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 117, name: '槓片划船', category: 'back', equipment: '槓片', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 118, name: '面拉', category: 'back', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 119, name: '直臂下壓', category: 'back', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 120, name: '山羊挺身', category: 'back', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 121, name: '超人式', category: 'back', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 122, name: '反向飛鳥', category: 'back', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 123, name: '俯身飛鳥', category: 'back', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 124, name: '史密斯機划船', category: 'back', equipment: '史密斯機', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 125, name: '背部伸展機', category: 'back', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },

  // ========== 腿部 (Legs) - 28 個 ==========
  { id: 201, name: '槓鈴深蹲', category: 'legs', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 202, name: '前蹲', category: 'legs', equipment: '槓鈴', difficulty: 'advanced', icon: 'dumbbell' },
  { id: 203, name: '高槓深蹲', category: 'legs', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 204, name: '低槓深蹲', category: 'legs', equipment: '槓鈴', difficulty: 'advanced', icon: 'dumbbell' },
  { id: 205, name: '頸後深蹲', category: 'legs', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 206, name: '啞鈴深蹲', category: 'legs', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 207, name: '高腳杯深蹲', category: 'legs', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 208, name: '腿推', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 209, name: '哈克深蹲', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 210, name: '史密斯機深蹲', category: 'legs', equipment: '史密斯機', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 211, name: '弓箭步', category: 'legs', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 212, name: '槓鈴弓箭步', category: 'legs', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 213, name: '啞鈴弓箭步', category: 'legs', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 214, name: '保加利亞分腿蹲', category: 'legs', equipment: '啞鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 215, name: '腿屈伸', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 216, name: '腿彎舉', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 217, name: '坐姿腿彎舉', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 218, name: '站姿腿彎舉', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 219, name: '內收肌訓練', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 220, name: '外展肌訓練', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 221, name: '站姿提踵', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 222, name: '坐姿提踵', category: 'legs', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 223, name: '單腿提踵', category: 'legs', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 224, name: '槓鈴提踵', category: 'legs', equipment: '槓鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 225, name: '史密斯機提踵', category: 'legs', equipment: '史密斯機', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 226, name: '跳箱', category: 'legs', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },
  { id: 227, name: '深蹲跳', category: 'legs', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },
  { id: 228, name: '箱式深蹲', category: 'legs', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },

  // ========== 肩膀 (Shoulders) - 18 個 ==========
  { id: 301, name: '槓鈴肩推', category: 'shoulders', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 302, name: '啞鈴肩推', category: 'shoulders', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 303, name: '阿諾推舉', category: 'shoulders', equipment: '啞鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 304, name: '坐姿肩推', category: 'shoulders', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 305, name: '站姿肩推', category: 'shoulders', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 306, name: '史密斯機肩推', category: 'shoulders', equipment: '史密斯機', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 307, name: '肩推機', category: 'shoulders', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 308, name: '側平舉', category: 'shoulders', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 309, name: '前平舉', category: 'shoulders', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 310, name: '後平舉', category: 'shoulders', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 311, name: '繩索側平舉', category: 'shoulders', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 312, name: '繩索前平舉', category: 'shoulders', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 313, name: '繩索後平舉', category: 'shoulders', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 314, name: '直立划船', category: 'shoulders', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 315, name: '啞鈴直立划船', category: 'shoulders', equipment: '啞鈴', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 316, name: '面拉', category: 'shoulders', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 317, name: '倒立肩推', category: 'shoulders', equipment: '徒手', difficulty: 'advanced', icon: 'zap' },
  { id: 318, name: '派克推舉', category: 'shoulders', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },

  // ========== 手臂 (Arms) - 20 個 ==========
  // 二頭肌
  { id: 401, name: '槓鈴二頭彎舉', category: 'arms', equipment: '槓鈴', difficulty: 'beginner', icon: 'zap' },
  { id: 402, name: 'EZ槓二頭彎舉', category: 'arms', equipment: 'EZ槓', difficulty: 'beginner', icon: 'zap' },
  { id: 403, name: '啞鈴二頭彎舉', category: 'arms', equipment: '啞鈴', difficulty: 'beginner', icon: 'zap' },
  { id: 404, name: '錘式彎舉', category: 'arms', equipment: '啞鈴', difficulty: 'beginner', icon: 'zap' },
  { id: 405, name: '交替彎舉', category: 'arms', equipment: '啞鈴', difficulty: 'beginner', icon: 'zap' },
  { id: 406, name: '集中彎舉', category: 'arms', equipment: '啞鈴', difficulty: 'beginner', icon: 'zap' },
  { id: 407, name: '上斜彎舉', category: 'arms', equipment: '啞鈴', difficulty: 'beginner', icon: 'zap' },
  { id: 408, name: '斜板彎舉', category: 'arms', equipment: 'EZ槓', difficulty: 'beginner', icon: 'zap' },
  { id: 409, name: '繩索二頭彎舉', category: 'arms', equipment: '繩索', difficulty: 'beginner', icon: 'zap' },
  { id: 410, name: '21響禮炮', category: 'arms', equipment: '槓鈴', difficulty: 'intermediate', icon: 'zap' },
  // 三頭肌
  { id: 411, name: '三頭下壓', category: 'arms', equipment: '繩索', difficulty: 'beginner', icon: 'zap' },
  { id: 412, name: '繩索三頭下壓', category: 'arms', equipment: '繩索', difficulty: 'beginner', icon: 'zap' },
  { id: 413, name: '窄握臥推', category: 'arms', equipment: '槓鈴', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 414, name: '雙槓撐體', category: 'arms', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },
  { id: 415, name: '過頭三頭伸展', category: 'arms', equipment: '啞鈴', difficulty: 'beginner', icon: 'zap' },
  { id: 416, name: '單臂過頭伸展', category: 'arms', equipment: '啞鈴', difficulty: 'beginner', icon: 'zap' },
  { id: 417, name: '法式推舉', category: 'arms', equipment: 'EZ槓', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 418, name: '仰臥三頭伸展', category: 'arms', equipment: 'EZ槓', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 419, name: '反手三頭下壓', category: 'arms', equipment: '繩索', difficulty: 'beginner', icon: 'zap' },
  { id: 420, name: '單臂三頭下壓', category: 'arms', equipment: '繩索', difficulty: 'beginner', icon: 'zap' },

  // ========== 核心 (Core) - 15 個 ==========
  { id: 501, name: '捲腹', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 502, name: '仰臥起坐', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 503, name: '平板支撐', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 504, name: '側平板支撐', category: 'core', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },
  { id: 505, name: '俄羅斯轉體', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 506, name: '腳踏車捲腹', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 507, name: '反向捲腹', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 508, name: '懸吊舉腿', category: 'core', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },
  { id: 509, name: '懸吊抬膝', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 510, name: '登山者', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 511, name: '捲腹機', category: 'core', equipment: '器械', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 512, name: '繩索捲腹', category: 'core', equipment: '繩索', difficulty: 'beginner', icon: 'dumbbell' },
  { id: 513, name: '藥球旋轉', category: 'core', equipment: '藥球', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 514, name: 'V字起坐', category: 'core', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },
  { id: 515, name: '鳥狗式', category: 'core', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },

  // ========== 有氧 (Cardio) - 10 個 ==========
  { id: 601, name: '跑步機', category: 'cardio', equipment: '跑步機', difficulty: 'beginner', icon: 'activity' },
  { id: 602, name: '飛輪', category: 'cardio', equipment: '飛輪', difficulty: 'beginner', icon: 'bike' },
  { id: 603, name: '橢圓機', category: 'cardio', equipment: '橢圓機', difficulty: 'beginner', icon: 'activity' },
  { id: 604, name: '划船機', category: 'cardio', equipment: '划船機', difficulty: 'beginner', icon: 'waves' },
  { id: 605, name: '跳繩', category: 'cardio', equipment: '跳繩', difficulty: 'beginner', icon: 'move' },
  { id: 606, name: '波比跳', category: 'cardio', equipment: '徒手', difficulty: 'intermediate', icon: 'zap' },
  { id: 607, name: '開合跳', category: 'cardio', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 608, name: '高抬腿', category: 'cardio', equipment: '徒手', difficulty: 'beginner', icon: 'zap' },
  { id: 609, name: '戰繩', category: 'cardio', equipment: '戰繩', difficulty: 'intermediate', icon: 'dumbbell' },
  { id: 610, name: '拳擊', category: 'cardio', equipment: '沙包', difficulty: 'intermediate', icon: 'boxing' },
]

// 訓練部位配置
export const MUSCLE_GROUPS = [
  { id: 'chest', name: '胸', icon: 'dumbbell', color: '#E8D5D5' },
  { id: 'back', name: '背', icon: 'activity', color: '#B4C5D1' },
  { id: 'legs', name: '腿', icon: 'footprints', color: '#C8D5C8' },
  { id: 'shoulders', name: '肩', icon: 'dumbbell', color: '#B8A99A' },
  { id: 'arms', name: '手臂', icon: 'zap', color: '#C3B5A7' },
  { id: 'core', name: '核心', icon: 'flame', color: '#D9CFC3' },
  { id: 'cardio', name: '有氧', icon: 'activity', color: '#B8C4C2' },
] as const

// 根據分類獲取動作
export function getExercisesByCategory(
  category: (typeof MUSCLE_GROUPS)[number]['id']
): Exercise[] {
  return EXERCISES.filter((ex) => ex.category === category)
}

// 搜尋動作
export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase()
  return EXERCISES.filter((ex) => ex.name.toLowerCase().includes(lowerQuery))
}

// 獲取熱門動作（根據難度篩選）
export function getPopularExercises(difficulty?: Exercise['difficulty']): Exercise[] {
  if (difficulty) {
    return EXERCISES.filter((ex) => ex.difficulty === difficulty).slice(0, 10)
  }
  return EXERCISES.slice(0, 10)
}
