import { format } from 'date-fns'

export interface City {
  code: string
  name: string
}

export interface Destination {
  code: string
  name: string
  cities: City[]
}

export const DESTINATIONS: Record<string, Destination> = {
  THI: {
    code: 'THI',
    name: '泰國',
    cities: [
      { code: 'BKK', name: '曼谷' },
      { code: 'CNX', name: '清邁' },
      { code: 'HKT', name: '普吉' },
      { code: 'USM', name: '蘇美島' },
      { code: 'KBV', name: '甲米' },
      { code: 'UTH', name: '烏隆' },
    ],
  },
  VNM: {
    code: 'VNM',
    name: '越南',
    cities: [
      { code: 'HAN', name: '河內' },
      { code: 'SGN', name: '胡志明' },
      { code: 'DAD', name: '峴港' },
      { code: 'PQC', name: '富國島' },
      { code: 'HUE', name: '順化' },
      { code: 'DLI', name: '大叻' },
    ],
  },
  JPN: {
    code: 'JPN',
    name: '日本',
    cities: [
      { code: 'TYO', name: '東京' },
      { code: 'OSA', name: '大阪' },
      { code: 'KYO', name: '京都' },
      { code: 'CTS', name: '札幌' },
      { code: 'OKA', name: '沖繩' },
      { code: 'NGO', name: '名古屋' },
      { code: 'FUK', name: '福岡' },
      { code: 'HIJ', name: '廣島' },
    ],
  },
  KOR: {
    code: 'KOR',
    name: '韓國',
    cities: [
      { code: 'SEL', name: '首爾' },
      { code: 'PUS', name: '釜山' },
      { code: 'JEJ', name: '濟州' },
      { code: 'ICN', name: '仁川' },
      { code: 'DGU', name: '大邱' },
    ],
  },
  CHN: {
    code: 'CHN',
    name: '中國大陸',
    cities: [
      { code: 'PEK', name: '北京' },
      { code: 'SHA', name: '上海' },
      { code: 'CAN', name: '廣州' },
      { code: 'SZX', name: '深圳' },
      { code: 'XMN', name: '廈門' },
      { code: 'HGH', name: '杭州' },
      { code: 'NKG', name: '南京' },
      { code: 'CTU', name: '成都' },
    ],
  },
  MYS: {
    code: 'MYS',
    name: '馬來西亞',
    cities: [
      { code: 'KUL', name: '吉隆坡' },
      { code: 'PEN', name: '檳城' },
      { code: 'JHB', name: '新山' },
      { code: 'KCH', name: '古晉' },
      { code: 'LGK', name: '蘭卡威' },
      { code: 'SBW', name: '沙巴' },
    ],
  },
  SGP: {
    code: 'SGP',
    name: '新加坡',
    cities: [{ code: 'SIN', name: '新加坡' }],
  },
  IDN: {
    code: 'IDN',
    name: '印尼',
    cities: [
      { code: 'CGK', name: '雅加達' },
      { code: 'DPS', name: '峇里島' },
      { code: 'JOG', name: '日惹' },
      { code: 'SOC', name: '梭羅' },
    ],
  },
  PHL: {
    code: 'PHL',
    name: '菲律賓',
    cities: [
      { code: 'MNL', name: '馬尼拉' },
      { code: 'CEB', name: '宿霧' },
      { code: 'DVO', name: '達沃' },
      { code: 'ILO', name: '怡朗' },
    ],
  },
  USA: {
    code: 'USA',
    name: '美國',
    cities: [
      { code: 'LAX', name: '洛杉磯' },
      { code: 'NYC', name: '紐約' },
      { code: 'LAS', name: '拉斯維加斯' },
      { code: 'SFO', name: '舊金山' },
      { code: 'SEA', name: '西雅圖' },
      { code: 'CHI', name: '芝加哥' },
    ],
  },
  CAN: {
    code: 'CAN',
    name: '加拿大',
    cities: [
      { code: 'YVR', name: '溫哥華' },
      { code: 'YYZ', name: '多倫多' },
      { code: 'YUL', name: '蒙特婁' },
      { code: 'YYC', name: '卡加利' },
    ],
  },
  AUS: {
    code: 'AUS',
    name: '澳洲',
    cities: [
      { code: 'SYD', name: '雪梨' },
      { code: 'MEL', name: '墨爾本' },
      { code: 'BNE', name: '布里斯本' },
      { code: 'PER', name: '伯斯' },
      { code: 'ADL', name: '阿德萊德' },
    ],
  },
  NZL: {
    code: 'NZL',
    name: '紐西蘭',
    cities: [
      { code: 'AKL', name: '奧克蘭' },
      { code: 'CHC', name: '基督城' },
      { code: 'WLG', name: '威靈頓' },
      { code: 'ZQN', name: '皇后鎮' },
    ],
  },
  EUR: {
    code: 'EUR',
    name: '歐洲',
    cities: [
      { code: 'LON', name: '倫敦' },
      { code: 'PAR', name: '巴黎' },
      { code: 'ROM', name: '羅馬' },
      { code: 'BCN', name: '巴塞隆納' },
      { code: 'BER', name: '柏林' },
      { code: 'AMS', name: '阿姆斯特丹' },
      { code: 'ZUR', name: '蘇黎世' },
      { code: 'VIE', name: '維也納' },
    ],
  },
  TUR: {
    code: 'TUR',
    name: '土耳其',
    cities: [
      { code: 'IST', name: '伊斯坦堡' },
      { code: 'AYT', name: '安塔利亞' },
      { code: 'ESB', name: '安卡拉' },
    ],
  },
}

// 團號生成相關
let sequenceCounter = 1

function getSequence(): string {
  const seq = sequenceCounter.toString().padStart(3, '0')
  sequenceCounter++
  if (sequenceCounter > 999) sequenceCounter = 1
  return seq
}

/**
 * 生成團號
 * @param countryCode 國家代碼 (如: THI, JPN)
 * @param cityCode 城市代碼 (如: BKK, TYO)
 * @param date 出發日期
 * @param isSpecial 是否為特殊團
 * @returns 團號 (如: BKK241225001 或 SPC241225001)
 */
export function generateTourCode(
  countryCode: string,
  cityCode: string,
  date: Date,
  isSpecial: boolean = false
): string {
  if (isSpecial) {
    return `SPC${format(date, 'yyMMdd')}${getSequence()}`
  }
  return `${cityCode}${format(date, 'yyMMdd')}${getSequence()}`
}

/**
 * 生成報價單編號
 * @param date 日期
 * @returns 報價單編號 (如: Q241225001)
 */
export function generateQuoteNumber(date: Date): string {
  return `Q${format(date, 'yyMMdd')}${getSequence()}`
}

/**
 * 生成訂單編號
 * @param tourCode 團號
 * @returns 訂單編號 (如: BKK241225001-001)
 */
export function generateOrderNumber(tourCode: string): string {
  return `${tourCode}-${getSequence()}`
}

/**
 * 取得所有目的地選項
 */
export function getAllDestinations(): Destination[] {
  return Object.values(DESTINATIONS)
}

/**
 * 根據國家代碼取得城市列表
 */
export function getCitiesByCountry(countryCode: string): City[] {
  return DESTINATIONS[countryCode]?.cities || []
}

/**
 * 根據城市代碼取得城市名稱
 */
export function getCityName(cityCode: string): string {
  for (const destination of Object.values(DESTINATIONS)) {
    const city = destination.cities.find(c => c.code === cityCode)
    if (city) return city.name
  }
  return cityCode
}

/**
 * 根據國家代碼取得國家名稱
 */
export function getCountryName(countryCode: string): string {
  return DESTINATIONS[countryCode]?.name || countryCode
}

/**
 * 解析團號獲取資訊
 * @param tourCode 團號
 * @returns 解析後的資訊
 */
export function parseTourCode(tourCode: string) {
  if (tourCode.startsWith('SPC')) {
    return {
      isSpecial: true,
      countryCode: 'SPECIAL',
      cityCode: 'SPC',
      date: tourCode.substring(3, 9),
      sequence: tourCode.substring(9),
    }
  }

  // 找出城市代碼
  for (const destination of Object.values(DESTINATIONS)) {
    for (const city of destination.cities) {
      if (tourCode.startsWith(city.code)) {
        return {
          isSpecial: false,
          countryCode: destination.code,
          cityCode: city.code,
          date: tourCode.substring(city.code.length, city.code.length + 6),
          sequence: tourCode.substring(city.code.length + 6),
        }
      }
    }
  }

  return null
}
