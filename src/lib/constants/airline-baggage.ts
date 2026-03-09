/**
 * 航空公司行李規定
 * 常見航空公司的免費託運行李額度
 */

export interface BaggageAllowance {
  pieces: number // 件數
  weightKg: number // 每件重量(公斤)
  weightLb: number // 每件重量(磅)
}

export interface FareClassBaggage {
  fareClass: string // 票種代碼 (如 C, J, D)
  fareName: string // 票種名稱 (如 尊寵, 經典, 基本)
  allowance: BaggageAllowance
}

export interface CabinBaggage {
  cabin: string // 艙等名稱
  fareClasses: FareClassBaggage[]
}

export interface AirlineRoutePolicy {
  routeType: string // 航線類型
  description: string // 描述
  cabins: CabinBaggage[]
}

export interface AirlineBaggagePolicy {
  code: string // IATA 代碼
  name: string // 航空公司名稱
  nameEn: string // 英文名稱
  routes: AirlineRoutePolicy[]
  lastUpdated: string // 最後更新日期
  notes?: string[] // 備註
}

// 長榮航空
export const EVA_AIR: AirlineBaggagePolicy = {
  code: 'BR',
  name: '長榮航空',
  nameEn: 'EVA Air',
  lastUpdated: '2024-12',
  routes: [
    {
      routeType: 'long-haul',
      description: '長程航線 (往返美國、加拿大、歐洲、澳洲和紐西蘭)',
      cabins: [
        {
          cabin: '皇璽桂冠艙 / 桂冠艙 / 商務艙',
          fareClasses: [
            {
              fareClass: 'C',
              fareName: '尊寵',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
            {
              fareClass: 'J',
              fareName: '經典',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
            {
              fareClass: 'D',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
          ],
        },
        {
          cabin: '豪華經濟艙',
          fareClasses: [
            {
              fareClass: 'K',
              fareName: '尊寵',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'T/L',
              fareName: '經典',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'P',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
          ],
        },
        {
          cabin: '經濟艙',
          fareClasses: [
            {
              fareClass: 'B/Y',
              fareName: '尊寵',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'Q/H/M',
              fareName: '經典',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'V/W/S',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'A',
              fareName: '輕省',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
          ],
        },
      ],
    },
    {
      routeType: 'short-haul',
      description: '短程航線 (亞洲區域)',
      cabins: [
        {
          cabin: '皇璽桂冠艙 / 桂冠艙 / 商務艙',
          fareClasses: [
            {
              fareClass: 'C',
              fareName: '尊寵',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
            {
              fareClass: 'J',
              fareName: '經典',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
            {
              fareClass: 'D',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
          ],
        },
        {
          cabin: '豪華經濟艙',
          fareClasses: [
            {
              fareClass: 'K',
              fareName: '尊寵',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'T/L',
              fareName: '經典',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'P',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
          ],
        },
        {
          cabin: '經濟艙',
          fareClasses: [
            {
              fareClass: 'B/Y',
              fareName: '尊寵',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'Q/H/M',
              fareName: '經典',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'V/W/S',
              fareName: '基本',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'A',
              fareName: '輕省',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
          ],
        },
      ],
    },
  ],
  notes: [
    '以上為免費託運行李額度，不含手提行李',
    '手提行李: 1件 7公斤 + 1件隨身物品',
    '嬰兒票可額外託運1件嬰兒車',
  ],
}

// 中華航空
export const CHINA_AIRLINES: AirlineBaggagePolicy = {
  code: 'CI',
  name: '中華航空',
  nameEn: 'China Airlines',
  lastUpdated: '2024-12',
  routes: [
    {
      routeType: 'long-haul',
      description: '長程航線 (美國/加拿大/歐洲/紐澳)',
      cabins: [
        {
          cabin: '商務艙',
          fareClasses: [
            {
              fareClass: 'C/J/D',
              fareName: '全艙等',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
          ],
        },
        {
          cabin: '豪華經濟艙',
          fareClasses: [
            {
              fareClass: 'W',
              fareName: '全艙等',
              allowance: { pieces: 2, weightKg: 28, weightLb: 62 },
            },
          ],
        },
        {
          cabin: '經濟艙',
          fareClasses: [
            {
              fareClass: 'X',
              fareName: '酬賓機票',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'M/B/Y',
              fareName: '靈活',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'T/V/K',
              fareName: '標準',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'N/H/Q/R',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'L',
              fareName: '特惠',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
          ],
        },
      ],
    },
    {
      routeType: 'short-haul',
      description: '短程航線 (亞洲區域)',
      cabins: [
        {
          cabin: '商務艙',
          fareClasses: [
            {
              fareClass: 'C/J/D',
              fareName: '全艙等',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
          ],
        },
        {
          cabin: '經濟艙',
          fareClasses: [
            {
              fareClass: 'X',
              fareName: '酬賓機票',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'M/B/Y',
              fareName: '靈活',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'T/V/K',
              fareName: '標準',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'N/H/Q/R',
              fareName: '基本',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'L',
              fareName: '特惠',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
          ],
        },
      ],
    },
    {
      routeType: 'transtasman',
      description: '紐澳跨海航線 (澳洲/紐西蘭之間)',
      cabins: [
        {
          cabin: '經濟艙',
          fareClasses: [
            {
              fareClass: 'X',
              fareName: '酬賓機票',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'M/B/Y',
              fareName: '靈活',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'T/V/K',
              fareName: '標準',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'N/H/Q/R',
              fareName: '基本',
              allowance: { pieces: 0, weightKg: 0, weightLb: 0 },
            },
            {
              fareClass: 'L',
              fareName: '特惠',
              allowance: { pieces: 0, weightKg: 0, weightLb: 0 },
            },
          ],
        },
      ],
    },
  ],
  notes: ['每件行李重量限制為 23 公斤（50 磅）', '手提行李: 1件 7公斤'],
}

// 星宇航空
export const STARLUX: AirlineBaggagePolicy = {
  code: 'JX',
  name: '星宇航空',
  nameEn: 'STARLUX Airlines',
  lastUpdated: '2024-12',
  routes: [
    {
      routeType: 'short-haul',
      description: '短程航線 (亞洲各航點與關島)',
      cabins: [
        {
          cabin: '頭等艙',
          fareClasses: [
            {
              fareClass: 'AF',
              fareName: '全額',
              allowance: { pieces: 3, weightKg: 32, weightLb: 70 },
            },
          ],
        },
        {
          cabin: '商務艙',
          fareClasses: [
            {
              fareClass: 'J',
              fareName: '全額',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
            {
              fareClass: 'C',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
            {
              fareClass: 'D',
              fareName: '超值',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
          ],
        },
        {
          cabin: '豪華經濟艙',
          fareClasses: [
            {
              fareClass: 'W',
              fareName: '全額',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'R',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'E',
              fareName: '超值',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
          ],
        },
        {
          cabin: '經濟艙',
          fareClasses: [
            {
              fareClass: 'H/B/Y',
              fareName: '全額',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'L/M/K',
              fareName: '基本',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'N/S/V',
              fareName: '超值',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'Q',
              fareName: '限量',
              allowance: { pieces: 1, weightKg: 23, weightLb: 50 },
            },
          ],
        },
      ],
    },
  ],
  notes: ['手提行李: 1件 7公斤 + 1件隨身物品'],
}

// 日本航空
export const JAL: AirlineBaggagePolicy = {
  code: 'JL',
  name: '日本航空',
  nameEn: 'Japan Airlines',
  lastUpdated: '2024-12',
  routes: [
    {
      routeType: 'international',
      description: '國際線',
      cabins: [
        {
          cabin: '商務艙',
          fareClasses: [
            {
              fareClass: 'C/J/D',
              fareName: '全艙等',
              allowance: { pieces: 3, weightKg: 32, weightLb: 70 },
            },
          ],
        },
        {
          cabin: '經濟艙',
          fareClasses: [
            {
              fareClass: 'Y/B/H/K',
              fareName: 'Flex',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'M/L/V',
              fareName: 'Saver',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
          ],
        },
      ],
    },
  ],
  notes: ['手提行李: 1件 10公斤'],
}

// 全日空
export const ANA: AirlineBaggagePolicy = {
  code: 'NH',
  name: '全日空',
  nameEn: 'All Nippon Airways',
  lastUpdated: '2024-12',
  routes: [
    {
      routeType: 'international',
      description: '國際線',
      cabins: [
        {
          cabin: '商務艙',
          fareClasses: [
            {
              fareClass: 'C/J/D',
              fareName: '全艙等',
              allowance: { pieces: 2, weightKg: 32, weightLb: 70 },
            },
          ],
        },
        {
          cabin: '經濟艙',
          fareClasses: [
            {
              fareClass: 'Y/B/M',
              fareName: 'Flex',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
            {
              fareClass: 'H/K/L',
              fareName: 'Basic',
              allowance: { pieces: 2, weightKg: 23, weightLb: 50 },
            },
          ],
        },
      ],
    },
  ],
  notes: ['手提行李: 1件 10公斤'],
}

// 所有航空公司
export const ALL_AIRLINES: AirlineBaggagePolicy[] = [EVA_AIR, CHINA_AIRLINES, STARLUX, JAL, ANA]

// 根據航空公司代碼取得政策
export function getAirlineBaggagePolicy(code: string): AirlineBaggagePolicy | undefined {
  return ALL_AIRLINES.find(a => a.code === code.toUpperCase())
}

// 格式化行李資訊為訊息
export function formatBaggageInfoMessage(airline?: AirlineBaggagePolicy): string {
  if (!airline) {
    // 返回所有常見航空公司的簡要資訊
    let message = '✈️ 常見航空公司行李額度\n'
    message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'

    for (const a of ALL_AIRLINES) {
      message += `🏷️ ${a.name} (${a.code})\n`
      for (const route of a.routes) {
        if (route.routeType !== 'all') {
          message += `   ${route.description}\n`
        }
        for (const cabin of route.cabins) {
          for (const fc of cabin.fareClasses) {
            const { pieces, weightKg } = fc.allowance
            message += `   ${cabin.cabin} ${fc.fareClass}: ${pieces}件x${weightKg}kg\n`
          }
        }
      }
      message += '\n'
    }

    message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    message += '💡 輸入航空代碼查看詳細資訊 (如: BR, CI, JX)'

    return message
  }

  // 返回特定航空公司的詳細資訊
  let message = `✈️ ${airline.name} (${airline.code}) 行李規定\n`
  message += `更新日期: ${airline.lastUpdated}\n`
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'

  for (const route of airline.routes) {
    message += `📍 ${route.description}\n\n`

    for (const cabin of route.cabins) {
      message += `┌ ${cabin.cabin}\n`
      for (const fc of cabin.fareClasses) {
        const { pieces, weightKg, weightLb } = fc.allowance
        message += `│ ${fc.fareName} (${fc.fareClass}): ${pieces}件各${weightKg}kg(${weightLb}磅)\n`
      }
      message += '└\n\n'
    }
  }

  if (airline.notes && airline.notes.length > 0) {
    message += '📝 備註:\n'
    for (const note of airline.notes) {
      message += `• ${note}\n`
    }
  }

  return message
}
