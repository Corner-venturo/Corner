// 各地區的交通和活動選項資料庫

export interface TransportOption {
  id: string;
  name: string;
  price_per_person?: number;
  pricePerGroup?: number;
  capacity?: number;
  is_group_cost?: boolean;
}

export interface ActivityOption {
  id: string;
  name: string;
  category: string;
  adultPrice?: number;
  childPrice?: number;
  groupDiscount?: number;
}

export interface RegionOptions {
  transport: TransportOption[];
  activities: ActivityOption[];
}

// 清邁選項
export const chiangMaiOptions: RegionOptions = {
  transport: [
    { id: 'cm-airport-transfer', name: '機場接送', price_per_person: 150, pricePerGroup: 800, is_group_cost: true },
    { id: 'cm-city-halfday', name: '古城包車半日', price_per_person: 200, pricePerGroup: 1200, is_group_cost: true },
    { id: 'cm-city-fullday', name: '古城包車一日', price_per_person: 350, pricePerGroup: 2100, is_group_cost: true },
    { id: 'cm-night-market', name: '夜市包車', price_per_person: 100, pricePerGroup: 600, is_group_cost: true },
    { id: 'cm-doi-suthep', name: '素帖山包車', price_per_person: 250, pricePerGroup: 1500, is_group_cost: true },
    { id: 'cm-taxi', name: '計程車', price_per_person: 50, is_group_cost: false },
    { id: 'cm-tuk-tuk', name: '嘟嘟車', price_per_person: 80, is_group_cost: false },
  ],
  activities: [
    { id: 'cm-elephant-sanctuary', name: '大象保護區', category: '生態體驗', adultPrice: 1500, childPrice: 1000 },
    { id: 'cm-doi-suthep-temple', name: '雙龍寺', category: '寺廟', adultPrice: 50, childPrice: 30 },
    { id: 'cm-night-safari', name: '夜間動物園', category: '休閒娛樂', adultPrice: 800, childPrice: 400 },
    { id: 'cm-tiger-kingdom', name: '老虎王國', category: '動物體驗', adultPrice: 1000, childPrice: 800 },
    { id: 'cm-flight-gibbon', name: '叢林飛索', category: '冒險活動', adultPrice: 2500, childPrice: 2000 },
    { id: 'cm-cooking-class', name: '烹飪課程', category: '文化體驗', adultPrice: 1200, childPrice: 800 },
    { id: 'cm-massage-spa', name: '泰式按摩', category: '休閒娛樂', adultPrice: 600, childPrice: 400 },
  ]
};

// 曼谷選項
export const bangkokOptions: RegionOptions = {
  transport: [
    { id: 'bkk-airport-transfer', name: '機場接送', price_per_person: 200, pricePerGroup: 1000, is_group_cost: true },
    { id: 'bkk-city-tour', name: '市區觀光包車', price_per_person: 300, pricePerGroup: 1800, is_group_cost: true },
    { id: 'bkk-floating-market', name: '水上市場包車', price_per_person: 400, pricePerGroup: 2400, is_group_cost: true },
    { id: 'bkk-bts-day-pass', name: 'BTS一日券', price_per_person: 140, is_group_cost: false },
    { id: 'bkk-mrt-day-pass', name: 'MRT一日券', price_per_person: 120, is_group_cost: false },
    { id: 'bkk-taxi', name: '計程車', price_per_person: 100, is_group_cost: false },
  ],
  activities: [
    { id: 'bkk-grand-palace', name: '大皇宮', category: '歷史古蹟', adultPrice: 500, childPrice: 250 },
    { id: 'bkk-wat-pho', name: '臥佛寺', category: '寺廟', adultPrice: 200, childPrice: 100 },
    { id: 'bkk-chatuchak', name: '恰圖恰市集', category: '購物', adultPrice: 0, childPrice: 0 },
    { id: 'bkk-floating-market', name: '丹能莎朵水上市場', category: '文化體驗', adultPrice: 300, childPrice: 200 },
    { id: 'bkk-jim-thompson', name: '金湯普森博物館', category: '博物館', adultPrice: 200, childPrice: 100 },
    { id: 'bkk-dinner-cruise', name: '昭披耶河遊船晚餐', category: '休閒娛樂', adultPrice: 1800, childPrice: 1200 },
  ]
};

// 東京選項
export const tokyoOptions: RegionOptions = {
  transport: [
    { id: 'tyo-airport-narita', name: '成田機場接送', price_per_person: 600, pricePerGroup: 3600, is_group_cost: true },
    { id: 'tyo-airport-haneda', name: '羽田機場接送', price_per_person: 500, pricePerGroup: 3000, is_group_cost: true },
    { id: 'tyo-jr-pass-7day', name: 'JR Pass 7日券', price_per_person: 8500, is_group_cost: false },
    { id: 'tyo-tokyo-metro-24h', name: '東京地鐵24小時券', price_per_person: 240, is_group_cost: false },
    { id: 'tyo-private-car', name: '包車一日', price_per_person: 1200, pricePerGroup: 7200, is_group_cost: true },
    { id: 'tyo-taxi', name: '計程車', price_per_person: 200, is_group_cost: false },
  ],
  activities: [
    { id: 'tyo-tokyo-skytree', name: '東京晴空塔', category: '觀光景點', adultPrice: 2100, childPrice: 950 },
    { id: 'tyo-tokyo-tower', name: '東京鐵塔', category: '觀光景點', adultPrice: 1200, childPrice: 700 },
    { id: 'tyo-disney-land', name: '東京迪士尼樂園', category: '主題樂園', adultPrice: 7900, childPrice: 4700 },
    { id: 'tyo-disney-sea', name: '東京迪士尼海洋', category: '主題樂園', adultPrice: 7900, childPrice: 4700 },
    { id: 'tyo-senso-ji', name: '淺草寺', category: '寺廟', adultPrice: 0, childPrice: 0 },
    { id: 'tyo-meiji-shrine', name: '明治神宮', category: '神社', adultPrice: 0, childPrice: 0 },
    { id: 'tyo-studio-ghibli', name: '吉卜力美術館', category: '博物館', adultPrice: 1000, childPrice: 100 },
  ]
};

// 地區選項映射
export const regionOptionsMap = {
  '清邁': chiangMaiOptions,
  '曼谷': bangkokOptions,
  '東京': tokyoOptions,
} as const;

export type RegionName = keyof typeof regionOptionsMap;

// 取得地區選項
export const getRegionOptions = (region: RegionName): RegionOptions => {
  return regionOptionsMap[region] || { transport: [], activities: [] };
};