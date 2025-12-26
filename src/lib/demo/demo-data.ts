// DEMO 展示用假資料
// 這些資料不會存入資料庫，僅供展示使用

export interface DemoTour {
  id: string
  tour_code: string
  tour_name: string
  destination: string
  country: string
  start_date: string
  end_date: string
  days: number
  status: 'draft' | 'published' | 'confirmed' | 'departed' | 'completed'
  price: number
  capacity: number
  enrolled: number
  cover_image: string
}

export interface DemoOrder {
  id: string
  order_number: string
  tour_code: string
  tour_name: string
  customer_name: string
  customer_phone: string
  pax: number
  total_amount: number
  paid_amount: number
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  created_at: string
  departure_date: string
}

export interface DemoCustomer {
  id: string
  name: string
  english_name: string
  phone: string
  email: string
  passport_number: string
  passport_expiry: string
  birthday: string
  gender: 'M' | 'F'
  nationality: string
  total_orders: number
  total_spent: number
  last_trip: string
  vip_level: 'normal' | 'silver' | 'gold' | 'platinum'
}

export interface DemoPayment {
  id: string
  order_number: string
  customer_name: string
  amount: number
  method: 'cash' | 'transfer' | 'credit_card' | 'check'
  status: 'pending' | 'confirmed' | 'failed'
  date: string
  note: string
}

export interface DemoCalendarEvent {
  id: string
  title: string
  type: 'departure' | 'meeting' | 'deadline' | 'reminder'
  date: string
  tour_code?: string
  description?: string
}

// ============ 行程資料 ============
export const demoTours: DemoTour[] = [
  {
    id: 't1',
    tour_code: 'JP2501',
    tour_name: '北海道雪祭豪華5日',
    destination: '札幌、小樽、旭川',
    country: '日本',
    start_date: '2025-02-05',
    end_date: '2025-02-09',
    days: 5,
    status: 'confirmed',
    price: 58800,
    capacity: 20,
    enrolled: 18,
    cover_image: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800'
  },
  {
    id: 't2',
    tour_code: 'JP2502',
    tour_name: '京都賞櫻經典6日',
    destination: '京都、大阪、奈良',
    country: '日本',
    start_date: '2025-03-28',
    end_date: '2025-04-02',
    days: 6,
    status: 'published',
    price: 62800,
    capacity: 16,
    enrolled: 12,
    cover_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'
  },
  {
    id: 't3',
    tour_code: 'EU2503',
    tour_name: '瑞士阿爾卑斯山深度10日',
    destination: '蘇黎世、乙乙、琉森',
    country: '瑞士',
    start_date: '2025-06-15',
    end_date: '2025-06-24',
    days: 10,
    status: 'published',
    price: 168000,
    capacity: 12,
    enrolled: 6,
    cover_image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800'
  },
  {
    id: 't4',
    tour_code: 'KR2504',
    tour_name: '首爾美食購物4日',
    destination: '首爾、明洞、弘大',
    country: '韓國',
    start_date: '2025-01-25',
    end_date: '2025-01-28',
    days: 4,
    status: 'departed',
    price: 28800,
    capacity: 20,
    enrolled: 20,
    cover_image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800'
  },
  {
    id: 't5',
    tour_code: 'TW2505',
    tour_name: '花東秘境深度3日',
    destination: '花蓮、台東、池上',
    country: '台灣',
    start_date: '2025-02-15',
    end_date: '2025-02-17',
    days: 3,
    status: 'draft',
    price: 12800,
    capacity: 16,
    enrolled: 0,
    cover_image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800'
  },
  {
    id: 't6',
    tour_code: 'VN2506',
    tour_name: '越南峴港會安5日',
    destination: '峴港、會安、巴拿山',
    country: '越南',
    start_date: '2025-03-10',
    end_date: '2025-03-14',
    days: 5,
    status: 'published',
    price: 32800,
    capacity: 20,
    enrolled: 8,
    cover_image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800'
  },
  {
    id: 't7',
    tour_code: 'JP2507',
    tour_name: '東京迪士尼親子5日',
    destination: '東京、橫濱、箱根',
    country: '日本',
    start_date: '2025-04-05',
    end_date: '2025-04-09',
    days: 5,
    status: 'confirmed',
    price: 52800,
    capacity: 24,
    enrolled: 22,
    cover_image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800'
  },
  {
    id: 't8',
    tour_code: 'TH2508',
    tour_name: '曼谷芭達雅豪華6日',
    destination: '曼谷、芭達雅、華欣',
    country: '泰國',
    start_date: '2025-02-20',
    end_date: '2025-02-25',
    days: 6,
    status: 'completed',
    price: 35800,
    capacity: 20,
    enrolled: 20,
    cover_image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800'
  }
]

// ============ 訂單資料 ============
export const demoOrders: DemoOrder[] = [
  {
    id: 'o1',
    order_number: 'ORD-2025-0001',
    tour_code: 'JP2501',
    tour_name: '北海道雪祭豪華5日',
    customer_name: '王大明',
    customer_phone: '0912-345-678',
    pax: 2,
    total_amount: 117600,
    paid_amount: 117600,
    status: 'paid',
    created_at: '2024-12-15',
    departure_date: '2025-02-05'
  },
  {
    id: 'o2',
    order_number: 'ORD-2025-0002',
    tour_code: 'JP2501',
    tour_name: '北海道雪祭豪華5日',
    customer_name: '李美玲',
    customer_phone: '0923-456-789',
    pax: 4,
    total_amount: 235200,
    paid_amount: 120000,
    status: 'confirmed',
    created_at: '2024-12-18',
    departure_date: '2025-02-05'
  },
  {
    id: 'o3',
    order_number: 'ORD-2025-0003',
    tour_code: 'JP2502',
    tour_name: '京都賞櫻經典6日',
    customer_name: '張志豪',
    customer_phone: '0934-567-890',
    pax: 2,
    total_amount: 125600,
    paid_amount: 62800,
    status: 'confirmed',
    created_at: '2025-01-02',
    departure_date: '2025-03-28'
  },
  {
    id: 'o4',
    order_number: 'ORD-2025-0004',
    tour_code: 'EU2503',
    tour_name: '瑞士阿爾卑斯山深度10日',
    customer_name: '陳雅琪',
    customer_phone: '0945-678-901',
    pax: 2,
    total_amount: 336000,
    paid_amount: 336000,
    status: 'paid',
    created_at: '2025-01-05',
    departure_date: '2025-06-15'
  },
  {
    id: 'o5',
    order_number: 'ORD-2025-0005',
    tour_code: 'KR2504',
    tour_name: '首爾美食購物4日',
    customer_name: '林建宏',
    customer_phone: '0956-789-012',
    pax: 3,
    total_amount: 86400,
    paid_amount: 86400,
    status: 'paid',
    created_at: '2025-01-10',
    departure_date: '2025-01-25'
  },
  {
    id: 'o6',
    order_number: 'ORD-2025-0006',
    tour_code: 'JP2507',
    tour_name: '東京迪士尼親子5日',
    customer_name: '黃雅芬',
    customer_phone: '0967-890-123',
    pax: 4,
    total_amount: 211200,
    paid_amount: 100000,
    status: 'confirmed',
    created_at: '2025-01-12',
    departure_date: '2025-04-05'
  },
  {
    id: 'o7',
    order_number: 'ORD-2025-0007',
    tour_code: 'VN2506',
    tour_name: '越南峴港會安5日',
    customer_name: '吳佳穎',
    customer_phone: '0978-901-234',
    pax: 2,
    total_amount: 65600,
    paid_amount: 0,
    status: 'pending',
    created_at: '2025-01-15',
    departure_date: '2025-03-10'
  },
  {
    id: 'o8',
    order_number: 'ORD-2025-0008',
    tour_code: 'JP2502',
    tour_name: '京都賞櫻經典6日',
    customer_name: '許文龍',
    customer_phone: '0989-012-345',
    pax: 6,
    total_amount: 376800,
    paid_amount: 200000,
    status: 'confirmed',
    created_at: '2025-01-18',
    departure_date: '2025-03-28'
  }
]

// ============ 客戶資料 ============
export const demoCustomers: DemoCustomer[] = [
  {
    id: 'c1',
    name: '王大明',
    english_name: 'WANG TA MING',
    phone: '0912-345-678',
    email: 'wang.daming@email.com',
    passport_number: 'A123456789',
    passport_expiry: '2028-05-15',
    birthday: '1975-03-20',
    gender: 'M',
    nationality: '中華民國',
    total_orders: 8,
    total_spent: 456800,
    last_trip: '2024-11-15',
    vip_level: 'gold'
  },
  {
    id: 'c2',
    name: '李美玲',
    english_name: 'LEE MEI LING',
    phone: '0923-456-789',
    email: 'meiling.lee@email.com',
    passport_number: 'B234567890',
    passport_expiry: '2027-08-22',
    birthday: '1982-07-08',
    gender: 'F',
    nationality: '中華民國',
    total_orders: 5,
    total_spent: 289000,
    last_trip: '2024-09-20',
    vip_level: 'silver'
  },
  {
    id: 'c3',
    name: '張志豪',
    english_name: 'CHANG CHIH HAO',
    phone: '0934-567-890',
    email: 'chihhao.chang@email.com',
    passport_number: 'C345678901',
    passport_expiry: '2029-01-10',
    birthday: '1990-11-25',
    gender: 'M',
    nationality: '中華民國',
    total_orders: 3,
    total_spent: 168500,
    last_trip: '2024-08-05',
    vip_level: 'normal'
  },
  {
    id: 'c4',
    name: '陳雅琪',
    english_name: 'CHEN YA CHI',
    phone: '0945-678-901',
    email: 'yachi.chen@email.com',
    passport_number: 'D456789012',
    passport_expiry: '2026-12-30',
    birthday: '1988-04-12',
    gender: 'F',
    nationality: '中華民國',
    total_orders: 12,
    total_spent: 892000,
    last_trip: '2024-12-01',
    vip_level: 'platinum'
  },
  {
    id: 'c5',
    name: '林建宏',
    english_name: 'LIN CHIEN HUNG',
    phone: '0956-789-012',
    email: 'chienhung.lin@email.com',
    passport_number: 'E567890123',
    passport_expiry: '2027-06-18',
    birthday: '1985-09-03',
    gender: 'M',
    nationality: '中華民國',
    total_orders: 6,
    total_spent: 325600,
    last_trip: '2024-10-12',
    vip_level: 'silver'
  },
  {
    id: 'c6',
    name: '黃雅芬',
    english_name: 'HUANG YA FEN',
    phone: '0967-890-123',
    email: 'yafen.huang@email.com',
    passport_number: 'F678901234',
    passport_expiry: '2028-03-25',
    birthday: '1992-01-17',
    gender: 'F',
    nationality: '中華民國',
    total_orders: 2,
    total_spent: 98500,
    last_trip: '2024-07-28',
    vip_level: 'normal'
  },
  {
    id: 'c7',
    name: '吳佳穎',
    english_name: 'WU CHIA YING',
    phone: '0978-901-234',
    email: 'chiayin.wu@email.com',
    passport_number: 'G789012345',
    passport_expiry: '2029-09-08',
    birthday: '1995-06-30',
    gender: 'F',
    nationality: '中華民國',
    total_orders: 1,
    total_spent: 65600,
    last_trip: '',
    vip_level: 'normal'
  },
  {
    id: 'c8',
    name: '許文龍',
    english_name: 'HSU WEN LUNG',
    phone: '0989-012-345',
    email: 'wenlung.hsu@email.com',
    passport_number: 'H890123456',
    passport_expiry: '2027-11-14',
    birthday: '1978-12-05',
    gender: 'M',
    nationality: '中華民國',
    total_orders: 15,
    total_spent: 1250000,
    last_trip: '2024-12-20',
    vip_level: 'platinum'
  }
]

// ============ 付款記錄 ============
export const demoPayments: DemoPayment[] = [
  {
    id: 'p1',
    order_number: 'ORD-2025-0001',
    customer_name: '王大明',
    amount: 60000,
    method: 'transfer',
    status: 'confirmed',
    date: '2024-12-16',
    note: '訂金'
  },
  {
    id: 'p2',
    order_number: 'ORD-2025-0001',
    customer_name: '王大明',
    amount: 57600,
    method: 'transfer',
    status: 'confirmed',
    date: '2025-01-20',
    note: '尾款'
  },
  {
    id: 'p3',
    order_number: 'ORD-2025-0002',
    customer_name: '李美玲',
    amount: 120000,
    method: 'credit_card',
    status: 'confirmed',
    date: '2024-12-20',
    note: '訂金'
  },
  {
    id: 'p4',
    order_number: 'ORD-2025-0003',
    customer_name: '張志豪',
    amount: 62800,
    method: 'transfer',
    status: 'confirmed',
    date: '2025-01-05',
    note: '訂金'
  },
  {
    id: 'p5',
    order_number: 'ORD-2025-0004',
    customer_name: '陳雅琪',
    amount: 168000,
    method: 'transfer',
    status: 'confirmed',
    date: '2025-01-06',
    note: '訂金'
  },
  {
    id: 'p6',
    order_number: 'ORD-2025-0004',
    customer_name: '陳雅琪',
    amount: 168000,
    method: 'transfer',
    status: 'confirmed',
    date: '2025-01-15',
    note: '尾款'
  },
  {
    id: 'p7',
    order_number: 'ORD-2025-0006',
    customer_name: '黃雅芬',
    amount: 100000,
    method: 'cash',
    status: 'confirmed',
    date: '2025-01-14',
    note: '訂金'
  },
  {
    id: 'p8',
    order_number: 'ORD-2025-0008',
    customer_name: '許文龍',
    amount: 200000,
    method: 'check',
    status: 'confirmed',
    date: '2025-01-19',
    note: '訂金'
  }
]

// ============ 日曆事件 ============
export const demoCalendarEvents: DemoCalendarEvent[] = [
  {
    id: 'e1',
    title: '北海道雪祭團出發',
    type: 'departure',
    date: '2025-02-05',
    tour_code: 'JP2501',
    description: '18位旅客，長榮航空'
  },
  {
    id: 'e2',
    title: '京都賞櫻團出發',
    type: 'departure',
    date: '2025-03-28',
    tour_code: 'JP2502',
    description: '12位旅客，日本航空'
  },
  {
    id: 'e3',
    title: '首爾團出發',
    type: 'departure',
    date: '2025-01-25',
    tour_code: 'KR2504',
    description: '20位旅客，大韓航空'
  },
  {
    id: 'e4',
    title: '北海道團說明會',
    type: 'meeting',
    date: '2025-01-28',
    description: '下午2點，公司會議室'
  },
  {
    id: 'e5',
    title: '瑞士團尾款截止',
    type: 'deadline',
    date: '2025-05-15',
    tour_code: 'EU2503',
    description: '請通知所有旅客'
  },
  {
    id: 'e6',
    title: '東京親子團出發',
    type: 'departure',
    date: '2025-04-05',
    tour_code: 'JP2507',
    description: '22位旅客，星宇航空'
  },
  {
    id: 'e7',
    title: '越南團說明會',
    type: 'meeting',
    date: '2025-03-01',
    description: '下午3點，線上會議'
  },
  {
    id: 'e8',
    title: '京都團訂金截止',
    type: 'deadline',
    date: '2025-02-15',
    tour_code: 'JP2502'
  }
]

// ============ 統計數據 ============
export const demoStats = {
  // 本月統計
  monthly: {
    revenue: 1256800,
    orders: 24,
    newCustomers: 12,
    departedTours: 3
  },
  // 年度統計
  yearly: {
    revenue: 15680000,
    orders: 286,
    customers: 180,
    tours: 48
  },
  // 即將出團
  upcomingDepartures: [
    { tour_code: 'KR2504', tour_name: '首爾美食購物4日', date: '2025-01-25', pax: 20 },
    { tour_code: 'JP2501', tour_name: '北海道雪祭豪華5日', date: '2025-02-05', pax: 18 },
    { tour_code: 'TW2505', tour_name: '花東秘境深度3日', date: '2025-02-15', pax: 0 },
    { tour_code: 'VN2506', tour_name: '越南峴港會安5日', date: '2025-03-10', pax: 8 }
  ],
  // 待收款
  pendingPayments: [
    { order_number: 'ORD-2025-0002', customer: '李美玲', amount: 115200 },
    { order_number: 'ORD-2025-0003', customer: '張志豪', amount: 62800 },
    { order_number: 'ORD-2025-0006', customer: '黃雅芬', amount: 111200 },
    { order_number: 'ORD-2025-0007', customer: '吳佳穎', amount: 65600 },
    { order_number: 'ORD-2025-0008', customer: '許文龍', amount: 176800 }
  ]
}

// 工具函數：格式化金額
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// 工具函數：取得狀態顯示
export function getStatusDisplay(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    // 行程狀態
    draft: { label: '草稿', color: 'bg-muted text-morandi-secondary' },
    published: { label: '已發布', color: 'bg-status-info-bg text-status-info' },
    confirmed: { label: '已成團', color: 'bg-green-100 text-green-600' },
    departed: { label: '出團中', color: 'bg-purple-100 text-purple-600' },
    completed: { label: '已結束', color: 'bg-muted text-morandi-secondary' },
    // 訂單狀態
    pending: { label: '待確認', color: 'bg-yellow-100 text-yellow-600' },
    paid: { label: '已付清', color: 'bg-green-100 text-green-600' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-600' },
    // VIP 等級
    normal: { label: '一般', color: 'bg-muted text-morandi-secondary' },
    silver: { label: '銀卡', color: 'bg-slate-200 text-slate-700' },
    gold: { label: '金卡', color: 'bg-amber-100 text-amber-700' },
    platinum: { label: '白金', color: 'bg-purple-100 text-purple-700' }
  }
  return statusMap[status] || { label: status, color: 'bg-muted text-morandi-secondary' }
}
