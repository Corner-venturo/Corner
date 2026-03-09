/**
 * 機場資料 Seed Script
 *
 * 資料來源：OpenFlights (https://openflights.org/data.html)
 * 包含全球 7000+ 機場的 IATA 代碼
 *
 * 使用方式：
 * npx tsx scripts/seed-data/seed-airports.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// 載入 .env.local
dotenv.config({ path: '.env.local' })

// Supabase 設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 請設定環境變數 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 常用機場的中文名稱（手動維護，優先填入）
const CHINESE_NAMES: Record<string, { name_zh: string; city_name_zh: string }> = {
  // 台灣
  TPE: { name_zh: '台灣桃園國際機場', city_name_zh: '台北' },
  TSA: { name_zh: '台北松山機場', city_name_zh: '台北' },
  KHH: { name_zh: '高雄國際機場', city_name_zh: '高雄' },
  RMQ: { name_zh: '台中國際機場', city_name_zh: '台中' },

  // 日本
  NRT: { name_zh: '成田國際機場', city_name_zh: '東京' },
  HND: { name_zh: '東京羽田機場', city_name_zh: '東京' },
  KIX: { name_zh: '關西國際機場', city_name_zh: '大阪' },
  ITM: { name_zh: '大阪伊丹機場', city_name_zh: '大阪' },
  NGO: { name_zh: '中部國際機場', city_name_zh: '名古屋' },
  CTS: { name_zh: '新千歲機場', city_name_zh: '札幌' },
  FUK: { name_zh: '福岡機場', city_name_zh: '福岡' },
  OKA: { name_zh: '那霸機場', city_name_zh: '沖繩' },
  KOJ: { name_zh: '鹿兒島機場', city_name_zh: '鹿兒島' },
  HIJ: { name_zh: '廣島機場', city_name_zh: '廣島' },
  SDJ: { name_zh: '仙台機場', city_name_zh: '仙台' },
  KMQ: { name_zh: '小松機場', city_name_zh: '金澤' },
  TOY: { name_zh: '富山機場', city_name_zh: '富山' },
  MMY: { name_zh: '宮古機場', city_name_zh: '宮古島' },
  ISG: { name_zh: '石垣機場', city_name_zh: '石垣島' },

  // 韓國
  ICN: { name_zh: '仁川國際機場', city_name_zh: '首爾' },
  GMP: { name_zh: '金浦國際機場', city_name_zh: '首爾' },
  PUS: { name_zh: '金海國際機場', city_name_zh: '釜山' },
  CJU: { name_zh: '濟州國際機場', city_name_zh: '濟州' },

  // 中國
  PEK: { name_zh: '北京首都國際機場', city_name_zh: '北京' },
  PKX: { name_zh: '北京大興國際機場', city_name_zh: '北京' },
  PVG: { name_zh: '上海浦東國際機場', city_name_zh: '上海' },
  SHA: { name_zh: '上海虹橋國際機場', city_name_zh: '上海' },
  CAN: { name_zh: '廣州白雲國際機場', city_name_zh: '廣州' },
  SZX: { name_zh: '深圳寶安國際機場', city_name_zh: '深圳' },
  HKG: { name_zh: '香港國際機場', city_name_zh: '香港' },
  MFM: { name_zh: '澳門國際機場', city_name_zh: '澳門' },

  // 東南亞
  BKK: { name_zh: '曼谷素萬那普機場', city_name_zh: '曼谷' },
  DMK: { name_zh: '曼谷廊曼機場', city_name_zh: '曼谷' },
  CNX: { name_zh: '清邁國際機場', city_name_zh: '清邁' },
  HKT: { name_zh: '普吉國際機場', city_name_zh: '普吉島' },
  SIN: { name_zh: '新加坡樟宜機場', city_name_zh: '新加坡' },
  KUL: { name_zh: '吉隆坡國際機場', city_name_zh: '吉隆坡' },
  MNL: { name_zh: '馬尼拉乃乃亞奎諾機場', city_name_zh: '馬尼拉' },
  SGN: { name_zh: '胡志明市新山一機場', city_name_zh: '胡志明市' },
  HAN: { name_zh: '河內內排機場', city_name_zh: '河內' },
  DAD: { name_zh: '峴港國際機場', city_name_zh: '峴港' },
  REP: { name_zh: '暹粒國際機場', city_name_zh: '暹粒' },
  DPS: { name_zh: '峇里島乃古拉萊機場', city_name_zh: '峇里島' },
  CGK: { name_zh: '雅加達蘇卡諾哈達機場', city_name_zh: '雅加達' },
  RGN: { name_zh: '仰光國際機場', city_name_zh: '仰光' },

  // 歐洲
  LHR: { name_zh: '倫敦希斯洛機場', city_name_zh: '倫敦' },
  CDG: { name_zh: '巴黎戴高樂機場', city_name_zh: '巴黎' },
  FRA: { name_zh: '法蘭克福機場', city_name_zh: '法蘭克福' },
  AMS: { name_zh: '阿姆斯特丹史基浦機場', city_name_zh: '阿姆斯特丹' },
  FCO: { name_zh: '羅馬菲烏米奇諾機場', city_name_zh: '羅馬' },
  MAD: { name_zh: '馬德里巴拉哈斯機場', city_name_zh: '馬德里' },
  BCN: { name_zh: '巴塞隆納機場', city_name_zh: '巴塞隆納' },
  MUC: { name_zh: '慕尼黑機場', city_name_zh: '慕尼黑' },
  ZRH: { name_zh: '蘇黎世機場', city_name_zh: '蘇黎世' },
  VIE: { name_zh: '維也納機場', city_name_zh: '維也納' },
  PRG: { name_zh: '布拉格機場', city_name_zh: '布拉格' },
  IST: { name_zh: '伊斯坦堡機場', city_name_zh: '伊斯坦堡' },

  // 美洲
  LAX: { name_zh: '洛杉磯國際機場', city_name_zh: '洛杉磯' },
  SFO: { name_zh: '舊金山國際機場', city_name_zh: '舊金山' },
  JFK: { name_zh: '紐約乃迺迺迪機場', city_name_zh: '紐約' },
  YVR: { name_zh: '溫哥華國際機場', city_name_zh: '溫哥華' },
  YYZ: { name_zh: '多倫多皮爾森機場', city_name_zh: '多倫多' },

  // 大洋洲
  SYD: { name_zh: '雪梨金斯福德機場', city_name_zh: '雪梨' },
  MEL: { name_zh: '墨爾本機場', city_name_zh: '墨爾本' },
  AKL: { name_zh: '奧克蘭機場', city_name_zh: '奧克蘭' },

  // 中東
  DXB: { name_zh: '杜拜國際機場', city_name_zh: '杜拜' },
  DOH: { name_zh: '多哈哈馬德機場', city_name_zh: '多哈' },

  // 南美洲
  LPB: { name_zh: '拉巴斯國際機場', city_name_zh: '拉巴斯' },
  GRU: { name_zh: '聖保羅瓜魯霍斯機場', city_name_zh: '聖保羅' },
}

// 國家代碼對應（ISO 3166-1 alpha-2）
const COUNTRY_CODES: Record<string, string> = {
  Taiwan: 'TW',
  Japan: 'JP',
  'South Korea': 'KR',
  China: 'CN',
  'Hong Kong': 'HK',
  Macau: 'MO',
  Thailand: 'TH',
  Singapore: 'SG',
  Malaysia: 'MY',
  Philippines: 'PH',
  Vietnam: 'VN',
  Cambodia: 'KH',
  Indonesia: 'ID',
  Myanmar: 'MM',
  'United Kingdom': 'GB',
  France: 'FR',
  Germany: 'DE',
  Netherlands: 'NL',
  Italy: 'IT',
  Spain: 'ES',
  Switzerland: 'CH',
  Austria: 'AT',
  'Czech Republic': 'CZ',
  Turkey: 'TR',
  'United States': 'US',
  Canada: 'CA',
  Australia: 'AU',
  'New Zealand': 'NZ',
  'United Arab Emirates': 'AE',
  Qatar: 'QA',
  Bolivia: 'BO',
  Brazil: 'BR',
  Iceland: 'IS',
  Greenland: 'GL',
  'Papua New Guinea': 'PG',
}

interface AirportData {
  iata_code: string
  icao_code: string | null
  english_name: string
  name_zh: string | null
  city_name_en: string
  city_name_zh: string | null
  city_code: string | null
  country_code: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
}

async function fetchAirportsData(): Promise<string> {
  const response = await fetch(
    'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'
  )
  return response.text()
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}

function parseAirportsCSV(csv: string): AirportData[] {
  const lines = csv.trim().split('\n')
  const airports: AirportData[] = []

  for (const line of lines) {
    const fields = parseCSVLine(line)

    // OpenFlights format:
    // 0: ID, 1: Name, 2: City, 3: Country, 4: IATA, 5: ICAO, 6: Lat, 7: Lon, 8: Alt, 9: TZ offset, 10: DST, 11: Timezone, 12: Type, 13: Source
    const iata = fields[4]

    // 跳過沒有 IATA 代碼的機場
    if (!iata || iata === '\\N' || iata.length !== 3) {
      continue
    }

    const countryName = fields[3]
    const countryCode = COUNTRY_CODES[countryName] || null
    const chineseData = CHINESE_NAMES[iata]

    airports.push({
      iata_code: iata,
      icao_code: fields[5] === '\\N' ? null : fields[5],
      english_name: fields[1],
      name_zh: chineseData?.name_zh || null,
      city_name_en: fields[2],
      city_name_zh: chineseData?.city_name_zh || null,
      city_code: null, // 可以之後補充
      country_code: countryCode,
      latitude: parseFloat(fields[6]) || null,
      longitude: parseFloat(fields[7]) || null,
      timezone: fields[11] === '\\N' ? null : fields[11],
    })
  }

  return airports
}

async function seedAirports() {
  console.log('🛫 開始 seed 機場資料...\n')

  // 1. 下載資料
  console.log('📥 下載 OpenFlights 資料...')
  const csv = await fetchAirportsData()

  // 2. 解析資料
  console.log('🔄 解析 CSV 資料...')
  const airports = parseAirportsCSV(csv)
  console.log(`   找到 ${airports.length} 個有效機場\n`)

  // 3. 檢查現有資料
  const { count: existingCount } = await supabase
    .from('ref_airports')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 現有資料: ${existingCount || 0} 筆`)

  if (existingCount && existingCount > 0) {
    console.log('⚠️  資料表已有資料，將使用 upsert 更新...\n')
  }

  // 4. 批次插入（每次 500 筆）
  const batchSize = 500
  let inserted = 0
  let updated = 0
  let errors = 0

  for (let i = 0; i < airports.length; i += batchSize) {
    const batch = airports.slice(i, i + batchSize)

    const { error } = await supabase.from('ref_airports').upsert(batch, {
      onConflict: 'iata_code',
      ignoreDuplicates: false,
    })

    if (error) {
      console.error(`❌ 批次 ${Math.floor(i / batchSize) + 1} 失敗:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      process.stdout.write(`\r✅ 已處理: ${inserted}/${airports.length}`)
    }
  }

  console.log('\n')

  // 5. 統計結果
  const { count: finalCount } = await supabase
    .from('ref_airports')
    .select('*', { count: 'exact', head: true })

  const { count: withChineseCount } = await supabase
    .from('ref_airports')
    .select('*', { count: 'exact', head: true })
    .not('name_zh', 'is', null)

  console.log('📈 Seed 完成統計:')
  console.log(`   總機場數: ${finalCount}`)
  console.log(`   有中文名稱: ${withChineseCount}`)
  console.log(`   常用機場已設定: ${Object.keys(CHINESE_NAMES).length} 個`)

  if (errors > 0) {
    console.log(`   ⚠️  錯誤: ${errors} 筆`)
  }

  console.log('\n🎉 完成!')
}

// 執行
seedAirports().catch(console.error)
