/**
 * 插圖庫 - 彩色 SVG 插圖集合
 *
 * 所有插圖都是 CC0/MIT 授權，免費商用不需標註
 *
 * 分類：
 * - japan: 日本主題
 * - thailand: 泰國主題
 * - korea: 韓國主題
 * - city: 城市旅遊
 * - food: 美食
 * - rainbow: LGBTQ+/彩虹
 * - travel: 通用旅遊
 * - nature: 自然風景
 */

export interface Illustration {
  id: string
  name: string
  category: IllustrationCategory
  svg: string  // 完整 SVG 代碼
  tags: string[]
}

export type IllustrationCategory =
  | 'japan'
  | 'thailand'
  | 'korea'
  | 'city'
  | 'food'
  | 'rainbow'
  | 'travel'
  | 'nature'

export const ILLUSTRATION_CATEGORIES: Record<IllustrationCategory, string> = {
  japan: '🇯🇵 日本',
  thailand: '🇹🇭 泰國',
  korea: '🇰🇷 韓國',
  city: '🏙️ 城市',
  food: '🍜 美食',
  rainbow: '🏳️‍🌈 彩虹',
  travel: '✈️ 旅遊',
  nature: '🌿 自然',
}

/**
 * 插圖庫
 */
export const ILLUSTRATIONS: Illustration[] = [
  // ==========================================
  // 🇯🇵 日本主題
  // ==========================================
  {
    id: 'japan-torii',
    name: '鳥居',
    category: 'japan',
    tags: ['神社', '日本', '紅色'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="25" width="8" height="75" fill="#c41e3a"/>
      <rect x="77" y="25" width="8" height="75" fill="#c41e3a"/>
      <rect x="10" y="15" width="80" height="10" rx="2" fill="#c41e3a"/>
      <rect x="5" y="10" width="90" height="8" rx="2" fill="#c41e3a"/>
      <rect x="20" y="40" width="60" height="6" fill="#c41e3a"/>
    </svg>`,
  },
  {
    id: 'japan-fuji',
    name: '富士山',
    category: 'japan',
    tags: ['山', '日本', '風景'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,15 10,85 90,85" fill="#4a6fa5"/>
      <polygon points="50,15 30,45 70,45" fill="#ffffff"/>
      <ellipse cx="50" cy="85" rx="45" ry="10" fill="#90be6d"/>
    </svg>`,
  },
  {
    id: 'japan-sakura',
    name: '櫻花',
    category: 'japan',
    tags: ['花', '日本', '春天', '粉色'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="8" fill="#ffb7c5"/>
      <ellipse cx="50" cy="25" rx="12" ry="20" fill="#ffb7c5"/>
      <ellipse cx="50" cy="25" rx="12" ry="20" fill="#ffb7c5" transform="rotate(72 50 50)"/>
      <ellipse cx="50" cy="25" rx="12" ry="20" fill="#ffb7c5" transform="rotate(144 50 50)"/>
      <ellipse cx="50" cy="25" rx="12" ry="20" fill="#ffb7c5" transform="rotate(216 50 50)"/>
      <ellipse cx="50" cy="25" rx="12" ry="20" fill="#ffb7c5" transform="rotate(288 50 50)"/>
      <circle cx="50" cy="50" r="6" fill="#ffd700"/>
    </svg>`,
  },
  {
    id: 'japan-daruma',
    name: '達摩',
    category: 'japan',
    tags: ['日本', '幸運', '紅色'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="55" rx="40" ry="42" fill="#c41e3a"/>
      <ellipse cx="50" cy="45" rx="30" ry="25" fill="#f5f5dc"/>
      <circle cx="38" cy="42" r="10" fill="#ffffff" stroke="#333" stroke-width="2"/>
      <circle cx="62" cy="42" r="10" fill="#ffffff" stroke="#333" stroke-width="2"/>
      <ellipse cx="50" cy="58" rx="8" ry="5" fill="#333"/>
      <path d="M 30 65 Q 50 80 70 65" stroke="#333" stroke-width="3" fill="none"/>
    </svg>`,
  },
  {
    id: 'japan-lantern',
    name: '燈籠',
    category: 'japan',
    tags: ['日本', '燈', '紅色'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="45" y="5" width="10" height="10" fill="#8b4513"/>
      <ellipse cx="50" cy="20" rx="25" ry="8" fill="#c41e3a"/>
      <ellipse cx="50" cy="70" rx="25" ry="8" fill="#c41e3a"/>
      <rect x="25" y="20" width="50" height="50" rx="5" fill="#c41e3a"/>
      <rect x="30" y="30" width="40" height="30" fill="#ffd700" opacity="0.3"/>
      <line x1="50" y1="78" x2="50" y2="95" stroke="#8b4513" stroke-width="3"/>
      <circle cx="50" cy="95" r="4" fill="#ffd700"/>
    </svg>`,
  },
  {
    id: 'japan-sushi',
    name: '壽司',
    category: 'japan',
    tags: ['日本', '美食', '壽司'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="70" rx="35" ry="15" fill="#ffffff"/>
      <ellipse cx="50" cy="65" rx="30" ry="12" fill="#ffffff"/>
      <ellipse cx="50" cy="50" rx="28" ry="20" fill="#fa8072"/>
      <rect x="22" y="45" width="56" height="10" fill="#fa8072"/>
      <rect x="40" y="30" width="20" height="5" fill="#2d5a27"/>
    </svg>`,
  },

  // ==========================================
  // 🇹🇭 泰國主題
  // ==========================================
  {
    id: 'thailand-temple',
    name: '泰國寺廟',
    category: 'thailand',
    tags: ['泰國', '寺廟', '金色'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 20,40 80,40" fill="#ffd700"/>
      <polygon points="50,20 30,45 70,45" fill="#ff8c00"/>
      <polygon points="50,35 35,55 65,55" fill="#ffd700"/>
      <rect x="35" y="55" width="30" height="40" fill="#8b4513"/>
      <rect x="42" y="70" width="16" height="25" fill="#2d1b0e"/>
    </svg>`,
  },
  {
    id: 'thailand-elephant',
    name: '大象',
    category: 'thailand',
    tags: ['泰國', '動物', '大象'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="55" cy="50" rx="30" ry="25" fill="#808080"/>
      <circle cx="30" cy="40" r="18" fill="#808080"/>
      <ellipse cx="20" cy="35" rx="8" ry="12" fill="#808080"/>
      <path d="M 15 50 Q 5 70 15 85" stroke="#808080" stroke-width="8" fill="none"/>
      <circle cx="25" cy="38" r="3" fill="#333"/>
      <ellipse cx="55" cy="75" rx="8" ry="15" fill="#808080"/>
      <ellipse cx="75" cy="75" rx="8" ry="15" fill="#808080"/>
    </svg>`,
  },
  {
    id: 'thailand-tuktuk',
    name: '嘟嘟車',
    category: 'thailand',
    tags: ['泰國', '交通', '嘟嘟車'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="35" width="60" height="35" rx="5" fill="#ff6b35"/>
      <rect x="25" y="40" width="25" height="20" fill="#87ceeb"/>
      <rect x="55" y="40" width="20" height="25" fill="#ffd700"/>
      <circle cx="30" cy="75" r="10" fill="#333"/>
      <circle cx="70" cy="75" r="10" fill="#333"/>
      <circle cx="30" cy="75" r="5" fill="#666"/>
      <circle cx="70" cy="75" r="5" fill="#666"/>
      <rect x="15" y="30" width="10" height="20" fill="#ff6b35"/>
    </svg>`,
  },
  {
    id: 'thailand-boat',
    name: '長尾船',
    category: 'thailand',
    tags: ['泰國', '船', '海灘'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 60 Q 50 70 90 60 L 85 75 Q 50 85 15 75 Z" fill="#8b4513"/>
      <rect x="45" y="30" width="4" height="30" fill="#8b4513"/>
      <polygon points="49,30 49,55 75,50" fill="#ffffff"/>
      <path d="M 5 65 Q 15 55 25 65" stroke="#40e0d0" stroke-width="3" fill="none"/>
      <path d="M 75 65 Q 85 55 95 65" stroke="#40e0d0" stroke-width="3" fill="none"/>
    </svg>`,
  },

  // ==========================================
  // 🇰🇷 韓國主題
  // ==========================================
  {
    id: 'korea-hanbok',
    name: '韓服',
    category: 'korea',
    tags: ['韓國', '服裝', '傳統'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="20" r="12" fill="#ffe4c4"/>
      <ellipse cx="50" cy="15" rx="10" ry="5" fill="#333"/>
      <path d="M 35 32 L 30 55 L 70 55 L 65 32" fill="#ff69b4"/>
      <path d="M 30 55 L 20 95 L 80 95 L 70 55" fill="#ff1493"/>
      <rect x="45" y="35" width="10" height="15" fill="#ffd700"/>
      <path d="M 45 50 L 40 65 M 55 50 L 60 65" stroke="#ffd700" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'korea-palace',
    name: '景福宮',
    category: 'korea',
    tags: ['韓國', '宮殿', '傳統'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,10 15,35 85,35" fill="#1a472a"/>
      <polygon points="50,20 25,38 75,38" fill="#2d5a27"/>
      <rect x="25" y="38" width="50" height="30" fill="#8b4513"/>
      <rect x="30" y="45" width="15" height="20" fill="#2d1b0e"/>
      <rect x="55" y="45" width="15" height="20" fill="#2d1b0e"/>
      <rect x="20" y="68" width="60" height="8" fill="#696969"/>
      <rect x="15" y="76" width="70" height="20" fill="#a0522d"/>
    </svg>`,
  },
  {
    id: 'korea-kimchi',
    name: '泡菜罈',
    category: 'korea',
    tags: ['韓國', '美食', '泡菜'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="25" rx="30" ry="10" fill="#8b4513"/>
      <path d="M 20 25 Q 15 50 20 80 Q 50 95 80 80 Q 85 50 80 25" fill="#cd853f"/>
      <ellipse cx="50" cy="80" rx="30" ry="8" fill="#a0522d"/>
      <ellipse cx="50" cy="30" rx="25" ry="8" fill="#ff6347"/>
      <circle cx="40" cy="32" r="3" fill="#228b22"/>
      <circle cx="55" cy="28" r="3" fill="#228b22"/>
      <circle cx="60" cy="35" r="2" fill="#228b22"/>
    </svg>`,
  },

  // ==========================================
  // 🏙️ 城市主題
  // ==========================================
  {
    id: 'city-skyline',
    name: '城市天際線',
    category: 'city',
    tags: ['城市', '建築', '天際線'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="50" width="15" height="50" fill="#4a5568"/>
      <rect x="22" y="35" width="12" height="65" fill="#2d3748"/>
      <rect x="36" y="20" width="18" height="80" fill="#4a5568"/>
      <rect x="56" y="40" width="14" height="60" fill="#2d3748"/>
      <rect x="72" y="55" width="10" height="45" fill="#4a5568"/>
      <rect x="84" y="45" width="12" height="55" fill="#2d3748"/>
      <rect x="40" y="25" width="4" height="8" fill="#ffd700"/>
      <rect x="44" y="30" width="3" height="5" fill="#ffd700"/>
    </svg>`,
  },
  {
    id: 'city-plane',
    name: '飛機',
    category: 'city',
    tags: ['旅遊', '飛機', '交通'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="50" rx="35" ry="10" fill="#e0e0e0"/>
      <polygon points="15,50 5,35 5,65" fill="#4a90d9"/>
      <polygon points="40,50 25,25 55,50 25,75" fill="#e0e0e0"/>
      <polygon points="75,50 85,40 85,60" fill="#4a90d9"/>
      <circle cx="25" cy="50" r="8" fill="#87ceeb"/>
      <circle cx="40" cy="50" r="5" fill="#87ceeb"/>
    </svg>`,
  },
  {
    id: 'city-luggage',
    name: '行李箱',
    category: 'city',
    tags: ['旅遊', '行李', '出發'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="25" width="40" height="55" rx="5" fill="#ff6b6b"/>
      <rect x="35" y="15" width="30" height="12" rx="3" fill="#333"/>
      <rect x="40" y="20" width="20" height="5" fill="#ff6b6b"/>
      <line x1="35" y1="45" x2="65" y2="45" stroke="#fff" stroke-width="2"/>
      <line x1="35" y1="55" x2="65" y2="55" stroke="#fff" stroke-width="2"/>
      <circle cx="38" cy="85" r="5" fill="#333"/>
      <circle cx="62" cy="85" r="5" fill="#333"/>
    </svg>`,
  },
  {
    id: 'city-passport',
    name: '護照',
    category: 'city',
    tags: ['旅遊', '護照', '證件'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="10" width="60" height="80" rx="5" fill="#1e3a5f"/>
      <circle cx="50" cy="45" r="18" fill="none" stroke="#ffd700" stroke-width="2"/>
      <circle cx="50" cy="45" r="12" fill="none" stroke="#ffd700" stroke-width="1"/>
      <text x="50" y="75" text-anchor="middle" fill="#ffd700" font-size="8">PASSPORT</text>
    </svg>`,
  },

  // ==========================================
  // 🍜 美食主題
  // ==========================================
  {
    id: 'food-ramen',
    name: '拉麵',
    category: 'food',
    tags: ['日本', '美食', '拉麵'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="70" rx="40" ry="20" fill="#ffffff"/>
      <path d="M 10 70 Q 10 45 50 45 Q 90 45 90 70" fill="#fff8dc"/>
      <ellipse cx="50" cy="55" rx="35" ry="15" fill="#f4a460"/>
      <path d="M 25 55 Q 35 65 45 55 Q 55 45 65 55 Q 75 65 85 55" stroke="#ffd700" stroke-width="3" fill="none"/>
      <circle cx="35" cy="50" r="8" fill="#fff"/>
      <circle cx="65" cy="50" r="8" fill="#fff"/>
      <ellipse cx="50" cy="45" rx="12" ry="6" fill="#cd853f"/>
      <rect x="75" y="30" width="3" height="30" fill="#8b4513"/>
      <rect x="80" y="30" width="3" height="25" fill="#8b4513"/>
    </svg>`,
  },
  {
    id: 'food-padthai',
    name: '泰式炒河粉',
    category: 'food',
    tags: ['泰國', '美食', '炒麵'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="65" rx="40" ry="25" fill="#f5f5dc"/>
      <ellipse cx="50" cy="55" rx="35" ry="20" fill="#daa520"/>
      <path d="M 25 50 Q 40 60 55 50 Q 70 40 80 55" stroke="#f4a460" stroke-width="4" fill="none"/>
      <circle cx="30" cy="45" r="5" fill="#ff6347"/>
      <circle cx="70" cy="50" r="5" fill="#ff6347"/>
      <ellipse cx="50" cy="40" rx="8" ry="4" fill="#228b22"/>
      <path d="M 60 35 L 75 20" stroke="#228b22" stroke-width="2"/>
      <ellipse cx="40" cy="55" rx="6" ry="3" fill="#ffd700"/>
    </svg>`,
  },
  {
    id: 'food-bbq',
    name: '韓式烤肉',
    category: 'food',
    tags: ['韓國', '美食', '烤肉'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="55" r="35" fill="#333"/>
      <circle cx="50" cy="55" r="30" fill="#4a4a4a"/>
      <line x1="25" y1="55" x2="75" y2="55" stroke="#666" stroke-width="2"/>
      <line x1="30" y1="45" x2="70" y2="45" stroke="#666" stroke-width="2"/>
      <line x1="30" y1="65" x2="70" y2="65" stroke="#666" stroke-width="2"/>
      <ellipse cx="40" cy="50" rx="10" ry="6" fill="#8b4513"/>
      <ellipse cx="60" cy="55" rx="8" ry="5" fill="#a0522d"/>
      <ellipse cx="45" cy="62" rx="7" ry="4" fill="#8b4513"/>
      <path d="M 35 35 Q 38 25 35 20" stroke="#ff6600" stroke-width="2" fill="none" opacity="0.7"/>
      <path d="M 50 30 Q 53 20 50 15" stroke="#ff6600" stroke-width="2" fill="none" opacity="0.7"/>
      <path d="M 65 35 Q 68 25 65 20" stroke="#ff6600" stroke-width="2" fill="none" opacity="0.7"/>
    </svg>`,
  },
  {
    id: 'food-boba',
    name: '珍珠奶茶',
    category: 'food',
    tags: ['台灣', '美食', '飲料'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 30 20 L 25 85 Q 25 95 50 95 Q 75 95 75 85 L 70 20 Z" fill="#f5deb3"/>
      <ellipse cx="50" cy="20" rx="20" ry="5" fill="#deb887"/>
      <ellipse cx="50" cy="30" rx="18" ry="15" fill="#d2691e" opacity="0.8"/>
      <circle cx="35" cy="80" r="5" fill="#1a1a1a"/>
      <circle cx="50" cy="82" r="5" fill="#1a1a1a"/>
      <circle cx="65" cy="78" r="5" fill="#1a1a1a"/>
      <circle cx="42" cy="75" r="4" fill="#1a1a1a"/>
      <circle cx="58" cy="76" r="4" fill="#1a1a1a"/>
      <rect x="48" y="5" width="4" height="25" fill="#00bcd4"/>
    </svg>`,
  },
  {
    id: 'food-coffee',
    name: '咖啡',
    category: 'food',
    tags: ['咖啡', '飲料', '早餐'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 35 L 25 85 Q 25 95 50 95 Q 75 95 75 85 L 80 35 Z" fill="#ffffff"/>
      <ellipse cx="50" cy="35" rx="30" ry="8" fill="#f5f5f5"/>
      <ellipse cx="50" cy="40" rx="25" ry="15" fill="#6f4e37"/>
      <path d="M 80 40 Q 95 45 95 60 Q 95 75 80 75" stroke="#ffffff" stroke-width="6" fill="none"/>
      <path d="M 35 25 Q 38 15 35 10" stroke="#999" stroke-width="2" fill="none"/>
      <path d="M 50 22 Q 53 12 50 7" stroke="#999" stroke-width="2" fill="none"/>
      <path d="M 65 25 Q 68 15 65 10" stroke="#999" stroke-width="2" fill="none"/>
    </svg>`,
  },

  // ==========================================
  // 🏳️‍🌈 彩虹/LGBTQ+主題
  // ==========================================
  {
    id: 'rainbow-flag',
    name: '彩虹旗',
    category: 'rainbow',
    tags: ['彩虹', 'LGBTQ', '驕傲'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="15" width="80" height="12" fill="#e40303"/>
      <rect x="10" y="27" width="80" height="12" fill="#ff8c00"/>
      <rect x="10" y="39" width="80" height="12" fill="#ffed00"/>
      <rect x="10" y="51" width="80" height="12" fill="#008026"/>
      <rect x="10" y="63" width="80" height="12" fill="#24408e"/>
      <rect x="10" y="75" width="80" height="12" fill="#732982"/>
      <rect x="5" y="10" width="5" height="85" fill="#8b4513"/>
    </svg>`,
  },
  {
    id: 'rainbow-heart',
    name: '彩虹愛心',
    category: 'rainbow',
    tags: ['彩虹', '愛心', '愛'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#e40303"/>
          <stop offset="20%" style="stop-color:#ff8c00"/>
          <stop offset="40%" style="stop-color:#ffed00"/>
          <stop offset="60%" style="stop-color:#008026"/>
          <stop offset="80%" style="stop-color:#24408e"/>
          <stop offset="100%" style="stop-color:#732982"/>
        </linearGradient>
      </defs>
      <path d="M 50 90 C 20 60 0 35 0 25 C 0 10 15 0 30 0 C 40 0 50 10 50 20 C 50 10 60 0 70 0 C 85 0 100 10 100 25 C 100 35 80 60 50 90 Z" fill="url(#rainbow)"/>
    </svg>`,
  },
  {
    id: 'rainbow-star',
    name: '彩虹星星',
    category: 'rainbow',
    tags: ['彩虹', '星星', '閃亮'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbowStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e40303"/>
          <stop offset="20%" style="stop-color:#ff8c00"/>
          <stop offset="40%" style="stop-color:#ffed00"/>
          <stop offset="60%" style="stop-color:#008026"/>
          <stop offset="80%" style="stop-color:#24408e"/>
          <stop offset="100%" style="stop-color:#732982"/>
        </linearGradient>
      </defs>
      <polygon points="50,5 61,40 98,40 68,60 79,95 50,75 21,95 32,60 2,40 39,40" fill="url(#rainbowStar)"/>
    </svg>`,
  },
  {
    id: 'rainbow-ribbon',
    name: '彩虹緞帶',
    category: 'rainbow',
    tags: ['彩虹', '緞帶', '支持'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 10 Q 30 30 30 50 Q 30 70 50 90 Q 70 70 70 50 Q 70 30 50 10" fill="#e40303"/>
      <path d="M 50 15 Q 33 33 33 50 Q 33 67 50 85 Q 67 67 67 50 Q 67 33 50 15" fill="#ff8c00"/>
      <path d="M 50 20 Q 36 36 36 50 Q 36 64 50 80 Q 64 64 64 50 Q 64 36 50 20" fill="#ffed00"/>
      <path d="M 50 25 Q 39 39 39 50 Q 39 61 50 75 Q 61 61 61 50 Q 61 39 50 25" fill="#008026"/>
      <path d="M 50 30 Q 42 42 42 50 Q 42 58 50 70 Q 58 58 58 50 Q 58 42 50 30" fill="#24408e"/>
      <path d="M 50 35 Q 45 45 45 50 Q 45 55 50 65 Q 55 55 55 50 Q 55 45 50 35" fill="#732982"/>
    </svg>`,
  },

  // ==========================================
  // ✈️ 通用旅遊
  // ==========================================
  {
    id: 'travel-beach',
    name: '海灘',
    category: 'travel',
    tags: ['海灘', '度假', '夏天'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="50" fill="#87ceeb"/>
      <rect x="0" y="50" width="100" height="50" fill="#f4d03f"/>
      <circle cx="80" cy="20" r="12" fill="#ffd700"/>
      <path d="M 25 50 L 25 80" stroke="#8b4513" stroke-width="3"/>
      <path d="M 25 50 Q 10 40 25 30 Q 40 40 25 50" fill="#228b22"/>
      <path d="M 25 45 Q 5 35 25 25 Q 45 35 25 45" fill="#32cd32"/>
      <ellipse cx="70" cy="75" rx="20" ry="8" fill="#ffd700"/>
      <path d="M 0 50 Q 25 45 50 50 Q 75 55 100 50" fill="#40e0d0"/>
    </svg>`,
  },
  {
    id: 'travel-mountain',
    name: '山脈',
    category: 'travel',
    tags: ['山', '自然', '風景'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="100" fill="#87ceeb"/>
      <polygon points="0,100 30,40 60,100" fill="#6b8e23"/>
      <polygon points="25,100 55,30 85,100" fill="#556b2f"/>
      <polygon points="50,100 75,45 100,100" fill="#6b8e23"/>
      <polygon points="55,30 45,45 65,45" fill="#ffffff"/>
      <circle cx="15" cy="25" r="10" fill="#ffffff"/>
      <circle cx="25" cy="20" r="12" fill="#ffffff"/>
      <circle cx="35" cy="25" r="8" fill="#ffffff"/>
    </svg>`,
  },
  {
    id: 'travel-camera',
    name: '相機',
    category: 'travel',
    tags: ['相機', '拍照', '紀念'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="30" width="70" height="50" rx="5" fill="#333"/>
      <rect x="35" y="20" width="30" height="12" rx="2" fill="#444"/>
      <circle cx="50" cy="55" r="18" fill="#1a1a1a"/>
      <circle cx="50" cy="55" r="14" fill="#4169e1"/>
      <circle cx="50" cy="55" r="8" fill="#1a1a1a"/>
      <circle cx="50" cy="55" r="4" fill="#87ceeb"/>
      <rect x="70" y="35" width="10" height="8" rx="2" fill="#ff6b6b"/>
      <circle cx="25" cy="38" r="4" fill="#ffd700"/>
    </svg>`,
  },
  {
    id: 'travel-map',
    name: '地圖',
    category: 'travel',
    tags: ['地圖', '導航', '探索'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="10,15 35,5 65,15 90,5 90,85 65,95 35,85 10,95" fill="#f5deb3"/>
      <line x1="35" y1="5" x2="35" y2="85" stroke="#d2b48c" stroke-width="2"/>
      <line x1="65" y1="15" x2="65" y2="95" stroke="#d2b48c" stroke-width="2"/>
      <circle cx="50" cy="40" r="8" fill="#e74c3c"/>
      <path d="M 50 32 L 50 25" stroke="#e74c3c" stroke-width="3"/>
      <path d="M 20 50 Q 40 45 50 55 Q 60 65 80 50" stroke="#3498db" stroke-width="2" fill="none"/>
    </svg>`,
  },

  // ==========================================
  // 🌿 自然主題
  // ==========================================
  {
    id: 'nature-palm',
    name: '棕櫚樹',
    category: 'nature',
    tags: ['樹', '熱帶', '海灘'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="45" y="40" width="10" height="55" fill="#8b4513"/>
      <path d="M 50 40 Q 20 35 5 50" stroke="#228b22" stroke-width="8" fill="none"/>
      <path d="M 50 40 Q 30 20 15 25" stroke="#228b22" stroke-width="8" fill="none"/>
      <path d="M 50 40 Q 50 10 50 5" stroke="#228b22" stroke-width="8" fill="none"/>
      <path d="M 50 40 Q 70 20 85 25" stroke="#228b22" stroke-width="8" fill="none"/>
      <path d="M 50 40 Q 80 35 95 50" stroke="#228b22" stroke-width="8" fill="none"/>
      <ellipse cx="50" cy="95" rx="20" ry="5" fill="#f4d03f"/>
    </svg>`,
  },
  {
    id: 'nature-flower',
    name: '花朵',
    category: 'nature',
    tags: ['花', '自然', '美麗'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="47" y="50" width="6" height="45" fill="#228b22"/>
      <ellipse cx="35" cy="75" rx="15" ry="8" fill="#228b22" transform="rotate(-30 35 75)"/>
      <ellipse cx="65" cy="80" rx="12" ry="6" fill="#228b22" transform="rotate(30 65 80)"/>
      <circle cx="50" cy="35" r="12" fill="#ffd700"/>
      <circle cx="50" cy="15" r="12" fill="#ff69b4"/>
      <circle cx="30" cy="25" r="12" fill="#ff69b4"/>
      <circle cx="70" cy="25" r="12" fill="#ff69b4"/>
      <circle cx="35" cy="45" r="12" fill="#ff69b4"/>
      <circle cx="65" cy="45" r="12" fill="#ff69b4"/>
    </svg>`,
  },
  {
    id: 'nature-sunset',
    name: '夕陽',
    category: 'nature',
    tags: ['太陽', '日落', '風景'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="100" height="60" fill="#ff7f50"/>
      <rect x="0" y="60" width="100" height="40" fill="#1a1a2e"/>
      <circle cx="50" cy="60" r="25" fill="#ffd700"/>
      <path d="M 0 60 Q 25 50 50 60 Q 75 70 100 60" fill="#ff6347"/>
      <line x1="50" y1="25" x2="50" y2="10" stroke="#ffd700" stroke-width="3"/>
      <line x1="25" y1="40" x2="15" y2="30" stroke="#ffd700" stroke-width="3"/>
      <line x1="75" y1="40" x2="85" y2="30" stroke="#ffd700" stroke-width="3"/>
    </svg>`,
  },
]

/**
 * 根據分類取得插圖
 */
export function getIllustrationsByCategory(category: IllustrationCategory): Illustration[] {
  return ILLUSTRATIONS.filter(i => i.category === category)
}

/**
 * 搜尋插圖
 */
export function searchIllustrations(query: string): Illustration[] {
  const lowerQuery = query.toLowerCase()
  return ILLUSTRATIONS.filter(i =>
    i.name.toLowerCase().includes(lowerQuery) ||
    i.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * 取得所有插圖
 */
export function getAllIllustrations(): Illustration[] {
  return ILLUSTRATIONS
}
