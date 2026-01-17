/**
 * Amadeus PNR 電報解析器
 * 支援免費、純前端的電報解析，不需要呼叫任何 API
 *
 * 範例電報格式：
 * 1. JOHNSON/BRIAN MR
 * 2  UA 978 Y 18JUL GRUIAH HK1 1830 2345
 * 3  UA 123 Y 18JUL IAHLAX HK1 0100 0345
 * 8  TK TL03JUN/ABCB23129
 * AP TPE 02-2712-8888
 */

import { logger } from '@/lib/utils/logger'

/**
 * 電報解析錯誤
 */

/** PNR 解析來源格式 */
export type PnrSourceFormat = 'ticket_order_detail' | 'e_ticket' | 'amadeus_pnr' | 'html_confirmation';

export interface ParsedPNR {
  recordLocator: string;
  passengerNames: string[];
  passengers: PassengerInfo[];  // 2026-01-02: 完整旅客資訊（含嬰兒/兒童）
  segments: FlightSegment[];
  ticketingDeadline: Date | null;
  cancellationDeadline: Date | null;
  specialRequests: EnhancedSSR[];
  otherInfo: EnhancedOSI[];
  contactInfo: string[];
  validation: ValidationResult;
  // 2025-12-29: PNR Enhancement - Fare Monitoring
  fareData: ParsedFareData | null;
  // 2026-01-04: 機票號碼
  ticketNumbers: Array<{ number: string; passenger: string }>;
  // 2026-01-17: 識別來源格式（僅 ticket_order_detail 的 fareData 為成本價）
  sourceFormat?: PnrSourceFormat;
}

/**
 * 旅客資訊（含嬰兒/兒童）
 */
export interface PassengerInfo {
  index: number;            // 旅客序號 (1-based)
  name: string;             // 姓名 (SURNAME/GIVENNAME)
  type: 'ADT' | 'CHD' | 'INF' | 'INS';  // ADT=成人, CHD=兒童, INF=嬰兒(不佔位), INS=嬰兒(佔位)
  birthDate?: string;       // 出生日期 (DDMMMYY 格式)
  infant?: {                // 附帶的嬰兒資訊
    name: string;           // 嬰兒姓名
    birthDate: string;      // 嬰兒出生日期
  };
}

/**
 * 票價解析結果
 */
export interface ParsedFareData {
  currency: string;          // TWD, USD, etc.
  baseFare: number | null;   // 票價（不含稅）
  taxes: number | null;      // 稅金
  totalFare: number;         // 總價
  fareBasis: string | null;  // Fare Basis Code
  validatingCarrier: string | null; // 開票航空公司
  taxBreakdown: TaxItem[];   // 稅金明細
  perPassenger: boolean;     // 是否為每人價格
  raw: string;               // 原始票價資訊
}

export interface TaxItem {
  code: string;   // YQ, OI, G3, etc.
  amount: number;
  currency?: string;
}

export interface EnhancedSSR {
  code: string;          // VGML, WCHR, SPML 等
  description?: string;  // 自由文字部分
  segments?: number[];   // 指定航段
  passenger?: number;    // 指定旅客
  airline?: string;      // 指定航空公司
  raw: string;          // 原始文字
  category: SSRCategory;
}

export interface EnhancedOSI {
  airline: string;       // 航空公司代碼 (YY=通用)
  message: string;       // OSI內容
  raw: string;          // 原始文字
  category: OSICategory;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export enum SSRCategory {
  MEAL = 'MEAL',        // 餐食相關
  MEDICAL = 'MEDICAL',  // 醫療相關
  SEAT = 'SEAT',        // 座位相關
  BAGGAGE = 'BAGGAGE',  // 行李相關
  FREQUENT = 'FREQUENT', // 會員相關
  PASSENGER = 'PASSENGER', // 旅客類型 (INFT, CHLD)
  OTHER = 'OTHER'       // 其他
}

export enum OSICategory {
  CONTACT = 'CONTACT',   // 聯絡資訊
  MEDICAL = 'MEDICAL',   // 醫療資訊
  VIP = 'VIP',          // VIP服務
  GENERAL = 'GENERAL'    // 一般資訊
}

export interface FlightSegment {
  lineNumber?: number;
  airline: string;
  flightNumber: string;
  class: string;
  departureDate: string; // DDMMM format (e.g., 18JUL)
  origin: string;
  destination: string;
  status: string; // HK, TK, UC, etc.
  passengers: number;
  departureTime?: string; // HHMM
  arrivalTime?: string; // HHMM
  aircraft?: string;
  // === 擴充欄位 (2026-01-04) - 列印時顯示 ===
  departureTerminal?: string; // 出發航站
  arrivalTerminal?: string; // 抵達航站
  meal?: string; // 航班餐食
  isDirect?: boolean; // 是否直飛
  duration?: string; // 飛行時間
}

/**
 * SSR代碼分類映射
 */
const SSR_CATEGORIES: Record<string, SSRCategory> = {
  // 餐食類
  'VGML': SSRCategory.MEAL, 'AVML': SSRCategory.MEAL, 'HNML': SSRCategory.MEAL,
  'KOSV': SSRCategory.MEAL, 'MOML': SSRCategory.MEAL, 'SPML': SSRCategory.MEAL,
  'BBML': SSRCategory.MEAL, 'CHML': SSRCategory.MEAL, 'GFML': SSRCategory.MEAL,
  // 醫療類
  'WCHR': SSRCategory.MEDICAL, 'WCHS': SSRCategory.MEDICAL, 'WCHC': SSRCategory.MEDICAL,
  'MAAS': SSRCategory.MEDICAL, 'MEDA': SSRCategory.MEDICAL, 'OXRG': SSRCategory.MEDICAL,
  'DEAF': SSRCategory.MEDICAL, 'BLND': SSRCategory.MEDICAL, 'DPNA': SSRCategory.MEDICAL,
  // 座位類
  'RQST': SSRCategory.SEAT, 'NSSA': SSRCategory.SEAT, 'NSST': SSRCategory.SEAT,
  'EXST': SSRCategory.SEAT, 'BULK': SSRCategory.SEAT, 'ADIR': SSRCategory.SEAT,
  // 行李類
  'CBBG': SSRCategory.BAGGAGE, 'BIKE': SSRCategory.BAGGAGE, 'GOLF': SSRCategory.BAGGAGE,
  'SURF': SSRCategory.BAGGAGE, 'SKIS': SSRCategory.BAGGAGE, 'OOXY': SSRCategory.BAGGAGE,
  // 會員類
  'FQTV': SSRCategory.FREQUENT, 'FQTU': SSRCategory.FREQUENT, 'FQTR': SSRCategory.FREQUENT,
  // 旅客類型
  'INFT': SSRCategory.PASSENGER, 'CHLD': SSRCategory.PASSENGER,
};

/**
 * OSI關鍵字分類映射
 */
const OSI_KEYWORDS: Array<{ keywords: string[], category: OSICategory }> = [
  { keywords: ['CONTACT', 'PHONE', 'EMAIL', 'MOBILE'], category: OSICategory.CONTACT },
  { keywords: ['MEDICAL', 'DOCTOR', 'OXYGEN', 'MEDICATION'], category: OSICategory.MEDICAL },
  { keywords: ['VIP', 'PRIORITY', 'SPECIAL', 'CELEBRITY'], category: OSICategory.VIP },
];

/**
 * 驗證AMADEUS PNR格式
 */
export function validateAmadeusPNR(rawPNR: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  const lines = rawPNR.split('\n').map(line => line.trim()).filter(Boolean);
  
  if (lines.length === 0) {
    errors.push('電報內容不能為空');
    return { isValid: false, errors, warnings, suggestions };
  }
  
  // 檢查Header (RP/開頭)
  const hasHeader = lines.some(line => line.startsWith('RP/'));
  if (!hasHeader) {
    warnings.push('建議包含Header資訊 (RP/...)');
  }
  
  // 檢查旅客姓名格式
  const hasValidNames = lines.some(line => /\d+\.[A-Z]+\/[A-Z]+/g.test(line));
  if (!hasValidNames) {
    errors.push('未找到有效的旅客姓名格式 (例: 1.SMITH/JOHN)');
  }
  
  // 檢查航班資訊
  const hasFlightSegments = lines.some(line => 
    /^\d+\s+[A-Z0-9]{2}\s+\d{1,4}\s+[A-Z]\s+\d{2}[A-Z]{3}/i.test(line));
  if (!hasFlightSegments) {
    warnings.push('未找到航班資訊');
  }
  
  // 檢查出票期限
  const hasTicketingDeadline = lines.some(line => 
    /(?:ON OR BEFORE|BEFORE)\s+\d{2}[A-Z]{3}/i.test(line));
  if (!hasTicketingDeadline) {
    suggestions.push('建議包含出票期限資訊');
  }
  
  // 檢查SSR格式
  lines.forEach((line, idx) => {
    if (line.match(/^SR[A-Z]{4}/i)) {
      const match = line.match(/^SR([A-Z]{4})(?:-(.+?))?(?:\/S(\d+(?:-\d+)?))?(?:\/P(\d+))?/i);
      if (!match) {
        warnings.push(`第${idx + 1}行SSR格式可能不正確: ${line}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * 解析增強型SSR
 */
function parseEnhancedSSR(line: string): EnhancedSSR | null {
  const match = line.match(/^SR([A-Z]{4})(?:-(.+?))?(?:\/S(\d+(?:-\d+)?))?(?:\/P(\d+))?(?:\/([A-Z]{2}))?/i);
  if (!match) return null;
  
  const code = match[1].toUpperCase();
  const description = match[2]?.trim();
  const segmentStr = match[3];
  const passenger = match[4] ? parseInt(match[4]) : undefined;
  const airline = match[5];
  
  // 解析航段範圍
  let segments: number[] | undefined;
  if (segmentStr) {
    if (segmentStr.includes('-')) {
      const [start, end] = segmentStr.split('-').map(Number);
      segments = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
      segments = [parseInt(segmentStr)];
    }
  }
  
  return {
    code,
    description,
    segments,
    passenger,
    airline,
    raw: line,
    category: SSR_CATEGORIES[code] || SSRCategory.OTHER
  };
}

/**
 * 解析增強型OSI
 */
function parseEnhancedOSI(line: string): EnhancedOSI | null {
  const match = line.match(/^OS([A-Z]{2})\s+(.+)/i);
  if (!match) return null;
  
  const airline = match[1].toUpperCase();
  const message = match[2].trim();
  
  // 根據關鍵字分類
  let category = OSICategory.GENERAL;
  for (const { keywords, category: cat } of OSI_KEYWORDS) {
    if (keywords.some(keyword => message.toUpperCase().includes(keyword))) {
      category = cat;
      break;
    }
  }
  
  return {
    airline,
    message,
    raw: line,
    category
  };
}

/**
 * 合併跨行的 PNR 行（以空格開頭的行是上一行的延續）
 *
 * 修復日期: 2026-01-04
 * 問題: OPW/OPC 出票期限行可能跨行顯示，導致解析失敗
 * 範例:
 *   9 OPW-02JAN:1903/1C7/BR REQUIRES TICKET ON OR BEFORE
 *         05JAN:1903 TPE TIME ZONE/TKT/S3-4
 *
 * 原本解析器逐行處理，第一行有 "ON OR BEFORE" 但日期 "05JAN" 在延續行
 * 修復: 先將延續行（以 4+ 空格開頭）合併到上一行，再進行解析
 */
function mergeMultilineEntries(rawPNR: string): string[] {
  const rawLines = rawPNR.split('\n');
  const mergedLines: string[] = [];

  for (const line of rawLines) {
    // 判斷是否為延續行（以多個空格開頭）
    const isContinuation = /^\s{4,}/.test(line) && mergedLines.length > 0;

    if (isContinuation) {
      // 將延續行內容附加到上一行
      mergedLines[mergedLines.length - 1] += ' ' + line.trim();
    } else if (line.trim()) {
      mergedLines.push(line.trim());
    }
  }

  return mergedLines;
}

/**
 * 解析 Amadeus PNR 電報
 */
export function parseAmadeusPNR(rawPNR: string): ParsedPNR {
  // 先合併跨行的內容
  const lines = mergeMultilineEntries(rawPNR);

  logger.log('📋 開始解析電報，共', lines.length, '行');

  // 先驗證格式
  const validation = validateAmadeusPNR(rawPNR);
  
  const result: ParsedPNR = {
    recordLocator: '',
    passengerNames: [],
    passengers: [],
    segments: [],
    ticketingDeadline: null,
    cancellationDeadline: null,
    specialRequests: [],
    otherInfo: [],
    contactInfo: [],
    validation,
    fareData: null,
    ticketNumbers: [],
    sourceFormat: 'amadeus_pnr',
  };

  for (const line of lines) {
    logger.log('  檢查行:', line);
    // 0. 解析 Header Line 提取 Record Locator
    // 格式: "RP/TPEW123ML/TPEW123ML        AA/SU  16NOV25/1238Z   FUM2GY"
    // Record Locator 在最後 6 個字元
    if (line.startsWith('RP/') && !result.recordLocator) {
      const headerMatch = line.match(/([A-Z0-9]{6})$/);
      if (headerMatch) {
        result.recordLocator = headerMatch[1];
      }
      continue;
    }

    // 1. 解析旅客姓名 (支援嬰兒/兒童格式)
    // 格式範例:
    // - "1.CHEN/YIHSUAN" - 普通成人
    // - "5.PENG/ICHEN(INFHO/HAOYU/06MAY24)" - 成人帶嬰兒
    // - "6.LIN/PINHSUAN(CHD/30JUN22)" - 兒童
    const passengerLineMatch = line.match(/(\d+)\.([A-Z]+\/[A-Z]+)(?:\(([^)]+)\))?/gi);
    if (passengerLineMatch) {
      for (const match of passengerLineMatch) {
        const passengerMatch = match.match(/(\d+)\.([A-Z]+\/[A-Z]+)(?:\(([^)]+)\))?/i);
        if (passengerMatch) {
          const index = parseInt(passengerMatch[1]);
          const name = passengerMatch[2];
          const extra = passengerMatch[3]; // INF.../CHD/...

          // 加入姓名列表（向後兼容）
          if (name && !result.passengerNames.includes(name)) {
            result.passengerNames.push(name);
          }

          // 建立詳細旅客資訊
          const passenger: PassengerInfo = {
            index,
            name,
            type: 'ADT',
          };

          if (extra) {
            // 檢查是否為兒童: (CHD/30JUN22) 或 (CHD30JUN22)
            const chdMatch = extra.match(/^CHD\/?(\d{2}[A-Z]{3}\d{2})$/i);
            if (chdMatch) {
              passenger.type = 'CHD';
              passenger.birthDate = chdMatch[1];
              logger.log('    ✅ 找到兒童:', name, '生日:', chdMatch[1]);
            }

            // 檢查是否帶嬰兒: (INFHO/HAOYU/06MAY24)
            // 格式: INF + 嬰兒姓氏 + / + 嬰兒名字 + / + 出生日期
            // 注意: INF 和姓氏之間沒有分隔符
            const infMatch = extra.match(/^INF([A-Z]+)\/([A-Z]+)\/(\d{2}[A-Z]{3}\d{2})$/i);
            if (infMatch) {
              passenger.infant = {
                name: `${infMatch[1]}/${infMatch[2]}`,
                birthDate: infMatch[3],
              };
              logger.log('    ✅ 找到嬰兒:', passenger.infant.name, '生日:', infMatch[3], '隨行成人:', name);
            }

            // 備用格式: (INF SURNAME/GIVENNAME DDMMMYY) - 有空格分隔
            if (!passenger.infant) {
              const infMatch2 = extra.match(/^INF\s+([A-Z]+\/[A-Z]+)\s+(\d{2}[A-Z]{3}\d{2})$/i);
              if (infMatch2) {
                passenger.infant = {
                  name: infMatch2[1],
                  birthDate: infMatch2[2],
                };
                logger.log('    ✅ 找到嬰兒(備用格式):', passenger.infant.name, '生日:', infMatch2[2]);
              }
            }
          }

          result.passengers.push(passenger);
        }
      }
      continue;
    }

    // 2. 解析航班資訊
    // 格式1: "3  BR 116 Q 15JAN 4 TPECTS HK2  0930 1405  15JAN  E  BR/FUM2GY"
    // 格式2: "2 MU5008 I 18JAN 7*TPEPVG HK1 1500 1705 18JAN E CA/NB77E7" (無空格+星號)
    const segmentMatch = line.match(
      /^(\d+)\s+([A-Z0-9]{2})\s*(\d{1,4})\s+([A-Z])\s+(\d{2}[A-Z]{3})\s+\d?\*?\s*([A-Z]{6})\s+([A-Z]{2})(\d+)\s+(\d{4})\s+(\d{4})/i
    );

    if (segmentMatch) {
      const origin = segmentMatch[6].substring(0, 3);
      const destination = segmentMatch[6].substring(3, 6);

      result.segments.push({
        lineNumber: parseInt(segmentMatch[1]),
        airline: segmentMatch[2],
        flightNumber: segmentMatch[3],
        class: segmentMatch[4],
        departureDate: segmentMatch[5],
        origin: origin,
        destination: destination,
        status: segmentMatch[7],
        passengers: parseInt(segmentMatch[8]),
        departureTime: segmentMatch[9],
        arrivalTime: segmentMatch[10],
      });
      continue;
    }

    // 3. 解析出票期限 (從 OPW 或 OPC 行)
    // 格式: "OPW-20NOV:2038/1C7/BR REQUIRES TICKET ON OR BEFORE 23NOV:2038"
    const opwMatch = line.match(/(?:ON OR BEFORE|BEFORE)\s+(\d{2})([A-Z]{3}):?\d*/i);
    if (opwMatch) {
      logger.log('    ✅ 找到出票期限!', opwMatch);
      const day = opwMatch[1];
      const monthStr = opwMatch[2].toUpperCase();
      const deadline = parseAmadeusDate(day, monthStr);
      logger.log('    📅 解析日期:', deadline);
      result.ticketingDeadline = deadline;
      continue;
    }

    // 4. 解析 SSR (Special Service Requests)

    // 4a. 解析嬰兒 SSR: "15 SSR INFT CI HK1 HO/HAOYU 06MAY24/S9/P5"
    const ssrInftMatch = line.match(/^\d+\s+SSR\s+INFT\s+([A-Z]{2})\s+([A-Z]{2})(\d+)\s+([A-Z]+\/[A-Z]+)\s+(\d{2}[A-Z]{3}\d{2})(?:\/S(\d+))?(?:\/P(\d+))?/i);
    if (ssrInftMatch) {
      const infantName = ssrInftMatch[4];
      const infantBirthDate = ssrInftMatch[5];
      const segmentNum = ssrInftMatch[6] ? parseInt(ssrInftMatch[6]) : undefined;
      const passengerNum = ssrInftMatch[7] ? parseInt(ssrInftMatch[7]) : undefined;

      result.specialRequests.push({
        code: 'INFT',
        description: `嬰兒: ${infantName} (${infantBirthDate})`,
        segments: segmentNum ? [segmentNum] : undefined,
        passenger: passengerNum,
        airline: ssrInftMatch[1],
        raw: line,
        category: SSRCategory.PASSENGER
      });

      // 更新對應旅客的嬰兒資訊
      if (passengerNum) {
        const passenger = result.passengers.find(p => p.index === passengerNum);
        if (passenger && !passenger.infant) {
          passenger.infant = {
            name: infantName,
            birthDate: infantBirthDate,
          };
        }
      }
      continue;
    }

    // 4b. 解析兒童 SSR: "16 SSR CHLD CI HK1 30JUN22/P6"
    const ssrChldMatch = line.match(/^\d+\s+SSR\s+CHLD\s+([A-Z]{2})\s+([A-Z]{2})(\d+)\s+(\d{2}[A-Z]{3}\d{2})(?:\/P(\d+))?/i);
    if (ssrChldMatch) {
      const childBirthDate = ssrChldMatch[4];
      const passengerNum = ssrChldMatch[5] ? parseInt(ssrChldMatch[5]) : undefined;

      result.specialRequests.push({
        code: 'CHLD',
        description: `兒童 (${childBirthDate})`,
        passenger: passengerNum,
        airline: ssrChldMatch[1],
        raw: line,
        category: SSRCategory.PASSENGER
      });

      // 更新對應旅客的類型和出生日期
      if (passengerNum) {
        const passenger = result.passengers.find(p => p.index === passengerNum);
        if (passenger) {
          passenger.type = 'CHD';
          passenger.birthDate = childBirthDate;
        }
      }
      continue;
    }

    // 4c. 標準增強型 SSR
    if (line.match(/^SR[A-Z]{4}/i)) {
      const ssr = parseEnhancedSSR(line);
      if (ssr) {
        result.specialRequests.push(ssr);
        continue;
      }
    }

    // 4d. 舊格式SSR兼容
    if (line.match(/^SR\s+/i) || line.match(/^SSR\s+/i)) {
      const rawText = line.replace(/^S{1,2}R\s+/i, '').trim();
      result.specialRequests.push({
        code: 'UNKN',
        description: rawText,
        raw: line,
        category: SSRCategory.OTHER
      });
      continue;
    }

    // 5. 解析增強型 OSI (Other Service Information)
    if (line.match(/^OS[A-Z]{2}\s+/i)) {
      const osi = parseEnhancedOSI(line);
      if (osi) {
        result.otherInfo.push(osi);
        continue;
      }
    }
    
    // 舊格式OSI兼容
    if (line.match(/^OSI\s+/i)) {
      const message = line.replace(/^OSI\s+/i, '').trim();
      result.otherInfo.push({
        airline: 'YY',
        message,
        raw: line,
        category: OSICategory.GENERAL
      });
      continue;
    }

    // 6. 解析聯絡資訊 (e.g., "AP TPE 02-2712-8888")
    const contactMatch = line.match(/^AP[EM]?\s+(.+)/i);
    if (contactMatch) {
      result.contactInfo.push(contactMatch[1].trim());
      continue;
    }

    // 7. 解析機票號碼 FA 行 (e.g., "11 FA PAX 731-6328181969/ETMF/TWD44194/02JAN26/...")
    const faMatch = line.match(/(?:^\d+\s+)?FA\s+PAX\s+(\d{3})-?(\d{10,})/i);
    if (faMatch) {
      result.ticketNumbers.push({
        number: `${faMatch[1]}-${faMatch[2]}`,
        passenger: '',
      });
      logger.log('    ✅ 找到機票號碼:', `${faMatch[1]}-${faMatch[2]}`);
      continue;
    }
  }

  // 8. 解析票價資訊（在循環結束後處理）
  result.fareData = parseFareFromTelegram(rawPNR);

  return result;
}

/**
 * 從 Amadeus 電報解析票價資訊
 *
 * 常見票價格式：
 * - FV BR                    (Validating Carrier)
 * - K FARE USD320.00         (Base Fare)
 * - K TAX 45.00XT            (Taxes)
 * - K TOTAL USD365.00        (Total)
 *
 * 或 TST 格式：
 * - FXP/R,U                  (Fare Quote command)
 * - 01 WU/MINGTUNG
 * - FARE  TWD10000
 * - TAX   1500YQ 150OI 50G3
 * - TOTAL TWD11700
 *
 * 或 HTML 確認單格式：
 * - 票價：TWD 10,000
 * - 稅金：TWD 1,500
 * - 合計：TWD 11,500
 */
export function parseFareFromTelegram(rawPNR: string): ParsedFareData | null {
  const lines = rawPNR.split('\n').map(line => line.trim());
  const fullText = rawPNR.toUpperCase();

  let currency = 'TWD';
  let baseFare: number | null = null;
  let taxes: number | null = null;
  let totalFare: number | null = null;
  let fareBasis: string | null = null;
  let validatingCarrier: string | null = null;
  const taxBreakdown: TaxItem[] = [];
  let perPassenger = true;
  const rawFareLines: string[] = [];

  // 1. 解析 Validating Carrier (FV XX)
  const fvMatch = fullText.match(/FV\s+([A-Z]{2})/);
  if (fvMatch) {
    validatingCarrier = fvMatch[1];
  }

  // 2. 解析 Fare Basis (K FB- 或 FBA-)
  const fbMatch = fullText.match(/(?:K\s+FB-?|FBA-?)\s*([A-Z0-9]+)/i);
  if (fbMatch) {
    fareBasis = fbMatch[1];
  }

  for (const line of lines) {
    const upperLine = line.toUpperCase();

    // 3. 解析標準 K FARE 格式
    // K FARE USD320.00 或 K FARE TWD10000
    const kFareMatch = upperLine.match(/K\s+FARE\s+([A-Z]{3})[\s]*([\d,]+(?:\.\d{2})?)/);
    if (kFareMatch) {
      currency = kFareMatch[1];
      baseFare = parseFloat(kFareMatch[2].replace(/,/g, ''));
      rawFareLines.push(line);
      continue;
    }

    // 4. 解析 K TAX 格式
    // K TAX 45.00XT 或 K TAX USD45.00
    const kTaxMatch = upperLine.match(/K\s+TAX\s+(?:([A-Z]{3})[\s]*)?([\d,]+(?:\.\d{2})?)/);
    if (kTaxMatch) {
      if (kTaxMatch[1]) currency = kTaxMatch[1];
      taxes = parseFloat(kTaxMatch[2].replace(/,/g, ''));
      rawFareLines.push(line);

      // 嘗試解析稅金代碼
      const taxCodeMatch = upperLine.match(/([\d.]+)([A-Z]{2})/g);
      if (taxCodeMatch) {
        for (const match of taxCodeMatch) {
          const [, amount, code] = match.match(/([\d.]+)([A-Z]{2})/) || [];
          if (amount && code) {
            taxBreakdown.push({ code, amount: parseFloat(amount) });
          }
        }
      }
      continue;
    }

    // 5. 解析 K TOTAL 格式
    // K TOTAL USD365.00 或 K TOTAL TWD11700
    const kTotalMatch = upperLine.match(/K\s+TOTAL\s+([A-Z]{3})[\s]*([\d,]+(?:\.\d{2})?)/);
    if (kTotalMatch) {
      currency = kTotalMatch[1];
      totalFare = parseFloat(kTotalMatch[2].replace(/,/g, ''));
      rawFareLines.push(line);
      continue;
    }

    // 6. 解析 TST/FXP 格式 (直接的 FARE/TAX/TOTAL)
    // FARE  TWD10000 或 FARE TWD 10,000
    const fareMatch = upperLine.match(/^FARE\s+([A-Z]{3})[\s]*([\d,]+(?:\.\d{2})?)/);
    if (fareMatch) {
      currency = fareMatch[1];
      baseFare = parseFloat(fareMatch[2].replace(/,/g, ''));
      rawFareLines.push(line);
      continue;
    }

    // TAX   1500YQ 150OI 50G3 或 TAX TWD 1,500
    const taxMatch = upperLine.match(/^TAX\s+(?:([A-Z]{3})[\s]*)?([\d,]+(?:\.\d{2})?)/);
    if (taxMatch) {
      const taxAmount = parseFloat(taxMatch[2].replace(/,/g, ''));
      if (taxMatch[1]) {
        currency = taxMatch[1];
        taxes = taxAmount;
      } else {
        // 嘗試加總多個稅金 (1500YQ 150OI 50G3)
        const allTaxes = upperLine.match(/([\d]+)([A-Z]{2})/g);
        if (allTaxes) {
          taxes = 0;
          for (const t of allTaxes) {
            const [, amount, code] = t.match(/([\d]+)([A-Z]{2})/) || [];
            if (amount && code) {
              const taxAmt = parseFloat(amount);
              taxes += taxAmt;
              taxBreakdown.push({ code, amount: taxAmt });
            }
          }
        } else {
          taxes = taxAmount;
        }
      }
      rawFareLines.push(line);
      continue;
    }

    // TOTAL TWD11700 或 TOTAL TWD 11,700
    const totalMatch = upperLine.match(/^TOTAL\s+([A-Z]{3})[\s]*([\d,]+(?:\.\d{2})?)/);
    if (totalMatch) {
      currency = totalMatch[1];
      totalFare = parseFloat(totalMatch[2].replace(/,/g, ''));
      rawFareLines.push(line);
      continue;
    }

    // 7. 解析中文 HTML 確認單格式
    // 票價：TWD 10,000 或 票價: NT$ 10,000
    const cnFareMatch = line.match(/票價[:：]\s*(?:NT\$|TWD|USD)?\s*([\d,]+)/);
    if (cnFareMatch) {
      baseFare = parseFloat(cnFareMatch[1].replace(/,/g, ''));
      rawFareLines.push(line);
      continue;
    }

    // 稅金：TWD 1,500
    const cnTaxMatch = line.match(/稅金[:：]\s*(?:NT\$|TWD|USD)?\s*([\d,]+)/);
    if (cnTaxMatch) {
      taxes = parseFloat(cnTaxMatch[1].replace(/,/g, ''));
      rawFareLines.push(line);
      continue;
    }

    // 合計：TWD 11,500 或 總計：TWD 11,500
    const cnTotalMatch = line.match(/[合總]計[:：]\s*(?:NT\$|TWD|USD)?\s*([\d,]+)/);
    if (cnTotalMatch) {
      totalFare = parseFloat(cnTotalMatch[1].replace(/,/g, ''));
      rawFareLines.push(line);
      continue;
    }

    // 8. 解析 GRAND TOTAL 格式 (通常是全部旅客總價)
    const grandTotalMatch = upperLine.match(/GRAND\s+TOTAL\s+([A-Z]{3})[\s]*([\d,]+(?:\.\d{2})?)/);
    if (grandTotalMatch) {
      currency = grandTotalMatch[1];
      totalFare = parseFloat(grandTotalMatch[2].replace(/,/g, ''));
      perPassenger = false;
      rawFareLines.push(line);
      continue;
    }
  }

  // 如果沒有找到任何票價資訊，返回 null
  if (totalFare === null && baseFare === null) {
    return null;
  }

  // 如果只有 base fare 和 taxes，計算 total
  if (totalFare === null && baseFare !== null) {
    totalFare = baseFare + (taxes || 0);
  }

  // 如果只有 total 和 taxes，計算 base fare
  if (baseFare === null && totalFare !== null && taxes !== null) {
    baseFare = totalFare - taxes;
  }

  return {
    currency,
    baseFare,
    taxes,
    totalFare: totalFare || 0,
    fareBasis,
    validatingCarrier,
    taxBreakdown,
    perPassenger,
    raw: rawFareLines.join('\n')
  };
}

/**
 * 解析 Amadeus 日期格式 (DDMMM) 轉換為 Date
 * 例如：03JUN → 2024-06-03 或 2025-06-03 (根據當前日期判斷年份)
 */
function parseAmadeusDate(day: string, monthStr: string): Date | null {
  const monthMap: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };

  const month = monthMap[monthStr];
  if (month === undefined) return null;

  const dayNum = parseInt(day, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 如果日期在過去，使用明年
  let year = currentYear;
  if (month < currentMonth || (month === currentMonth && dayNum < now.getDate())) {
    year++;
  }

  return new Date(year, month, dayNum);
}

/**
 * 格式化航班資訊為可讀字串
 */
export function formatSegment(segment: FlightSegment): string {
  const { airline, flightNumber, origin, destination, departureDate, departureTime } = segment;
  const time = departureTime ? ` ${departureTime.slice(0, 2)}:${departureTime.slice(2)}` : '';
  return `${airline}${flightNumber} ${origin}→${destination} (${departureDate}${time})`;
}

/**
 * 從 PNR 提取所有重要日期，用於建立行事曆和待辦事項
 */
export function extractImportantDates(parsed: ParsedPNR): {
  ticketingDeadline: Date | null;
  departureDates: Array<{ date: Date; description: string }>;
} {
  const departureDates: Array<{ date: Date; description: string }> = [];

  for (const segment of parsed.segments) {
    const date = parseAmadeusDate(
      segment.departureDate.slice(0, 2),
      segment.departureDate.slice(2, 5)
    );
    if (date) {
      departureDates.push({
        date,
        description: formatSegment(segment),
      });
    }
  }

  return {
    ticketingDeadline: parsed.ticketingDeadline,
    departureDates,
  };
}

/**
 * 檢查 PNR 是否需要緊急處理（出票期限在 3 天內）
 */
export function isUrgent(ticketingDeadline: Date | null): boolean {
  if (!ticketingDeadline) return false;
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  return ticketingDeadline <= threeDaysLater;
}

/**
 * 解析 HTML 格式的機票確認單（公司系統匯出）
 * 格式範例：角落旅行社的機票確認單 HTML
 */
export interface ParsedHTMLConfirmation {
  recordLocator: string; // 電腦代號
  passengerNames: string[]; // 旅客姓名
  segments: Array<{
    airline: string; // 航空公司
    flightNumber: string; // 航班號
    departureDate: string; // 出發日期
    departureTime: string; // 出發時間
    departureAirport: string; // 出發機場
    arrivalTime: string; // 抵達時間
    arrivalAirport: string; // 抵達機場
    cabin: string; // 艙等
    status: string; // 訂位狀態
    aircraft?: string; // 機型
    terminal?: string; // 航站
    duration?: string; // 飛行時間
    meal?: boolean; // 是否有餐點
  }>;
  ticketNumbers: Array<{ number: string; passenger: string }>; // 機票號碼
  airlineContacts: string[]; // 航空公司確認電話
}

export function parseHTMLConfirmation(html: string): ParsedHTMLConfirmation {
  const result: ParsedHTMLConfirmation = {
    recordLocator: '',
    passengerNames: [],
    segments: [],
    ticketNumbers: [],
    airlineContacts: [],
  };

  // 移除 HTML 標籤，保留換行
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')  // <br> 轉換成換行
    .replace(/<[^>]*>/g, '\n')      // 其他標籤轉換成換行
    .replace(/\r\n/g, '\n')         // 統一換行符號
    .replace(/\r/g, '\n');

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. 解析電腦代號 (e.g., "電腦代號: DMTQ65 - 亞瑪迪斯")
    const rlMatch = line.match(/電腦代號[:：]?\s*([A-Z0-9]{6})/i);
    if (rlMatch) {
      result.recordLocator = rlMatch[1];
      continue;
    }

    // 2. 解析旅客姓名 (e.g., "旅客姓名:01. WU/MINGTUNG")
    const nameMatch = line.match(/旅客姓名[:：]?\s*\d+\.\s*([A-Z\/]+(?:\s+(?:MR|MRS|MS))?)/i);
    if (nameMatch) {
      result.passengerNames.push(nameMatch[1].trim());
      continue;
    }

    // 3. 解析航班資訊
    // 航空公司行: "長榮航空(BR801) 飛行01小時55分 /直飛"
    const airlineMatch = line.match(/^(.+?)\(([A-Z]{2}\d+)\)/);
    if (airlineMatch && i + 2 < lines.length) {
      const airline = airlineMatch[1].trim();
      const flightNumber = airlineMatch[2];

      // 提取飛行時間（如果有）
      const durationMatch = line.match(/飛行(\d+小時\d+分)/);
      const duration = durationMatch ? durationMatch[1] : undefined;

      // 檢查下一行是否為出發資訊
      const nextLine = lines[i + 1];
      const arrivalLine = lines[i + 2];

      // 出發: "12月04日(四) 10:00 出發:臺灣桃園機場(TAIPEI TAIWAN TAOYUAN) 航站2 /經濟 /OK"
      // 格式變化：機場名稱可能包含括號，航站可能沒有
      const depMatch = nextLine.match(
        /(\d+月\d+日)\([^)]+\)\s*(\d{2}:\d{2})\s*出發[:：]\s*([^/]+?)\s*(?:航站(\d+)\s*)?\/([^/]+)\s*\/([A-Z]+)/i
      );

      // 抵達: "11:55 抵達:澳門(MACAU APT) /空中巴士A321 /餐點"
      const arrMatch = arrivalLine.match(
        /(\d{2}:\d{2})\s*抵達[:：]\s*([^/]+?)\s*(?:航站(\d+)\s*)?\/([^/]+)\s*\/(.+)/i
      );

      if (depMatch && arrMatch) {
        // 清理機場名稱（移除括號中的英文）
        const cleanAirport = (name: string) => {
          return name.replace(/\([^)]+\)/g, '').trim();
        };

        const segment = {
          airline,
          flightNumber,
          departureDate: depMatch[1],
          departureTime: depMatch[2],
          departureAirport: cleanAirport(depMatch[3]),
          departureTerminal: depMatch[4] || undefined,
          cabin: depMatch[5].trim(),
          status: depMatch[6].trim(),
          arrivalTime: arrMatch[1],
          arrivalAirport: cleanAirport(arrMatch[2]),
          arrivalTerminal: arrMatch[3] || undefined,
          aircraft: arrMatch[4].trim(),
          meal: arrMatch[5].includes('餐點'),
          duration,
        };

        result.segments.push(segment);
        i += 2; // 跳過已處理的行
        continue;
      }
    }

    // 4. 解析機票號碼 (e.g., "機票號碼: 695-6327547167 - WU/MINGTUNG")
    const ticketMatch = line.match(/機票號碼[:：]?\s*([0-9-]+)\s*-\s*([A-Z\/]+)/i);
    if (ticketMatch) {
      result.ticketNumbers.push({
        number: ticketMatch[1],
        passenger: ticketMatch[2],
      });
      continue;
    }

    // 4b. 解析 GDS FA 行機票號碼 (e.g., "FA PAX 731-6328181969/ETMF/TWD44194/02JAN26/...")
    // 也處理帶行號的格式 (e.g., "11 FA PAX 731-6328181969/...")
    const faMatch = line.match(/(?:^\d+\s+)?FA\s+PAX\s+(\d{3})-?(\d{10,})/i);
    if (faMatch) {
      result.ticketNumbers.push({
        number: `${faMatch[1]}-${faMatch[2]}`,
        passenger: '', // FA 行通常不包含旅客名，需要從其他地方關聯
      });
      continue;
    }

    // 5. 解析航空公司確認電話
    const contactMatch = line.match(/航空公司確認電話[:：]?\s*(.+)/i);
    if (contactMatch) {
      result.airlineContacts.push(contactMatch[1].trim());
      // 繼續讀取下一行，可能還有更多電話
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^[a-z一-龥]+[:：]/i)) {
        result.airlineContacts.push(lines[j].trim());
        j++;
      }
      i = j - 1;
      continue;
    }
  }

  return result;
}

/**
 * 解析電子機票確認單（E-Ticket Confirmation）
 *
 * 格式範例（英文版）：
 * NAME: YU/CHIENHSUN
 * TICKET NUMBER : ETKT 781 6392510194
 * BOOKING REF : AMADEUS: D5WX26, AIRLINE: CA/NB77E7
 * FROM /TO        FLIGHT  CL DATE   DEP      FARE BASIS ...
 * TAIPEI TAIWAN   MU 5008 I  18JAN  1500     ISE0WCJ2   ...
 */
export function parseETicketConfirmation(input: string): ParsedPNR {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);

  logger.log('📋 開始解析電子機票，共', lines.length, '行');

  const result: ParsedPNR = {
    recordLocator: '',
    passengerNames: [],
    passengers: [],
    segments: [],
    ticketingDeadline: null,
    cancellationDeadline: null,
    specialRequests: [],
    otherInfo: [],
    contactInfo: [],
    validation: { isValid: true, errors: [], warnings: [], suggestions: [] },
    fareData: null,
    ticketNumbers: [],
    sourceFormat: 'e_ticket',
  };

  // 票價資訊（注意：電子機票的金額是售價，非成本）
  let baseFare: number | null = null;
  let taxes: number | null = null;
  let totalFare: number | null = null;
  const taxBreakdown: TaxItem[] = [];

  // 航班解析狀態
  let currentSegment: Partial<FlightSegment> | null = null;
  let expectingArrival = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();

    // 1. 解析旅客姓名: NAME: YU/CHIENHSUN
    const nameMatch = line.match(/NAME\s*[:：]\s*([A-Z]+\/[A-Z]+)/i);
    if (nameMatch) {
      const name = nameMatch[1].toUpperCase();
      result.passengerNames.push(name);
      result.passengers.push({
        index: result.passengers.length + 1,
        name,
        type: 'ADT',
      });
      logger.log('  ✅ 找到旅客:', name);
      continue;
    }

    // 2. 解析機票號碼: TICKET NUMBER : ETKT 781 6392510194
    const ticketMatch = line.match(/TICKET\s+NUMBER\s*[:：]\s*(?:ETKT\s+)?(\d{3})\s+(\d+)/i);
    if (ticketMatch) {
      const ticketNumber = `${ticketMatch[1]}-${ticketMatch[2]}`;
      result.ticketNumbers.push({
        number: ticketNumber,
        passenger: result.passengerNames[result.ticketNumbers.length] || '',
      });
      logger.log('  ✅ 找到機票號碼:', ticketNumber);
      continue;
    }

    // 3. 解析訂位代號: BOOKING REF : AMADEUS: D5WX26, AIRLINE: CA/NB77E7
    const bookingMatch = line.match(/BOOKING\s+REF\s*[:：]\s*AMADEUS\s*[:：]?\s*([A-Z0-9]{5,6})/i);
    if (bookingMatch) {
      result.recordLocator = bookingMatch[1];
      logger.log('  ✅ 找到訂位代號:', bookingMatch[1]);
      continue;
    }

    // 4. 解析航班表格行（檢測表頭之後的航班資料）
    // 航班行格式: TAIPEI TAIWAN   MU 5008 I  18JAN  1500 ...
    // 匹配模式: 地點名稱 + 航空公司代碼 + 航班號 + 艙等 + 日期 + 時間
    const flightMatch = line.match(/^([A-Z\s]+?)\s+([A-Z]{2})\s+(\d{1,4})\s+([A-Z])\s+(\d{2}[A-Z]{3})\s+(\d{4})\s+/i);
    if (flightMatch && !line.includes('FROM') && !line.includes('FLIGHT')) {
      // 儲存上一段航班（如果有）
      if (currentSegment && currentSegment.airline) {
        result.segments.push(currentSegment as FlightSegment);
      }

      const origin = extractAirportCode(flightMatch[1].trim());
      currentSegment = {
        airline: flightMatch[2].toUpperCase(),
        flightNumber: flightMatch[3],
        class: flightMatch[4].toUpperCase(),
        departureDate: flightMatch[5].toUpperCase(),
        origin: origin,
        destination: '', // 待從下方抵達行取得
        status: 'HK',
        passengers: result.passengerNames.length || 1,
        departureTime: flightMatch[6],
      };

      // 檢查同一行是否有 OK/HK/TK 等狀態
      const statusMatch = line.match(/\s+(OK|HK|TK|RR|UC|UN|NO|XX)\s*$/i);
      if (statusMatch) {
        currentSegment.status = statusMatch[1].toUpperCase();
      }

      expectingArrival = true;
      logger.log('  ✅ 找到航班:', (currentSegment.airline || '') + (currentSegment.flightNumber || ''), '從', origin);
      continue;
    }

    // 5. 解析航站資訊: TERMINAL:2
    const terminalMatch = line.match(/TERMINAL\s*[:：]\s*(\d+)/i);
    if (terminalMatch && currentSegment) {
      if (expectingArrival && !currentSegment.arrivalTerminal) {
        // 如果還在等抵達資訊，這是出發航站
        currentSegment.departureTerminal = terminalMatch[1];
      } else {
        currentSegment.arrivalTerminal = terminalMatch[1];
      }
      continue;
    }

    // 6. 解析抵達資訊: SHANGHAI PUDONG   ARRIVAL TIME: 1705   ARRIVAL DATE: 18JAN
    const arrivalMatch = line.match(/^([A-Z\s]+?)\s+ARRIVAL\s+TIME\s*[:：]\s*(\d{4})\s+ARRIVAL\s+DATE\s*[:：]\s*(\d{2}[A-Z]{3})/i);
    if (arrivalMatch && currentSegment && expectingArrival) {
      const destination = extractAirportCode(arrivalMatch[1].trim());
      currentSegment.destination = destination;
      currentSegment.arrivalTime = arrivalMatch[2];
      expectingArrival = false;
      logger.log('    抵達:', destination, '時間:', arrivalMatch[2]);
      continue;
    }

    // 7. 解析票價資訊
    // AIR FARE : TWD 10350
    const airFareMatch = line.match(/AIR\s+FARE\s*[:：]\s*([A-Z]{3})\s+([\d,]+)/i);
    if (airFareMatch) {
      baseFare = parseFloat(airFareMatch[2].replace(/,/g, ''));
      continue;
    }

    // TAX : TWD 500TW TWD 227CN (多個稅項)
    const taxMatch = line.match(/^TAX\s*[:：]\s*(.+)/i);
    if (taxMatch) {
      const taxParts = taxMatch[1].match(/([A-Z]{3})\s+([\d,]+)([A-Z]{2})/gi);
      if (taxParts) {
        taxes = 0;
        for (const part of taxParts) {
          const m = part.match(/([A-Z]{3})\s+([\d,]+)([A-Z]{2})/i);
          if (m) {
            const amount = parseFloat(m[2].replace(/,/g, ''));
            taxes += amount;
            taxBreakdown.push({ code: m[3], amount, currency: m[1] });
          }
        }
      }
      continue;
    }

    // AIRLINE SURCHARGES : TWD 1591YQ
    const surchargeMatch = line.match(/AIRLINE\s+SURCHARGES?\s*[:：]\s*([A-Z]{3})\s+([\d,]+)([A-Z]{2})/i);
    if (surchargeMatch) {
      const amount = parseFloat(surchargeMatch[2].replace(/,/g, ''));
      if (taxes === null) taxes = 0;
      taxes += amount;
      taxBreakdown.push({ code: surchargeMatch[3], amount, currency: surchargeMatch[1] });
      continue;
    }

    // TOTAL : TWD 12668
    const totalMatch = line.match(/^TOTAL\s*[:：]\s*([A-Z]{3})\s+([\d,]+)/i);
    if (totalMatch) {
      totalFare = parseFloat(totalMatch[2].replace(/,/g, ''));
      continue;
    }
  }

  // 儲存最後一段航班
  if (currentSegment && currentSegment.airline && currentSegment.destination) {
    result.segments.push(currentSegment as FlightSegment);
  }

  // 組合票價資料
  if (totalFare !== null || baseFare !== null) {
    result.fareData = {
      currency: 'TWD',
      baseFare,
      taxes,
      totalFare: totalFare || (baseFare || 0) + (taxes || 0),
      fareBasis: null,
      validatingCarrier: null,
      taxBreakdown,
      perPassenger: true,
      raw: '',
    };
  }

  logger.log('📋 電子機票解析完成:', {
    旅客數: result.passengerNames.length,
    航班數: result.segments.length,
    訂位代號: result.recordLocator,
  });

  return result;
}

/**
 * 從地點名稱提取機場代碼（簡化版）
 */
function extractAirportCode(locationName: string): string {
  const upperName = locationName.toUpperCase();

  // 常見機場對照表
  const airportMap: Record<string, string> = {
    'TAIPEI': 'TPE',
    'TAOYUAN': 'TPE',
    'TAIPEI TAIWAN': 'TPE',
    'SONGSHAN': 'TSA',
    'KAOHSIUNG': 'KHH',
    'SHANGHAI': 'PVG',
    'SHANGHAI PUDONG': 'PVG',
    'HONG KONG': 'HKG',
    'TOKYO': 'NRT',
    'NARITA': 'NRT',
    'HANEDA': 'HND',
    'OSAKA': 'KIX',
    'KANSAI': 'KIX',
    'SEOUL': 'ICN',
    'INCHEON': 'ICN',
    'SINGAPORE': 'SIN',
    'BANGKOK': 'BKK',
    'HARBIN': 'HRB',
    'HARBIN TAIPING': 'HRB',
    'MACAU': 'MFM',
  };

  // 嘗試匹配
  for (const [key, code] of Object.entries(airportMap)) {
    if (upperName.includes(key)) {
      return code;
    }
  }

  // 如果找不到，嘗試提取三字母代碼
  const codeMatch = upperName.match(/\(([A-Z]{3})\)/);
  if (codeMatch) {
    return codeMatch[1];
  }

  // 返回名稱的前三個字母
  return upperName.replace(/[^A-Z]/g, '').slice(0, 3) || 'XXX';
}

/**
 * 解析「機票訂單明細」格式（開票系統匯出）
 *
 * 格式特徵：
 * - 包含「機票訂單明細」或「銷售摘要」字樣
 * - 票號格式：781-6392510194
 * - 金額明細：金額、附加費、稅金、小計
 * - 訂位記錄：內嵌完整 Amadeus PNR
 */
export function parseTicketOrderDetail(input: string): ParsedPNR {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);

  logger.log('📋 開始解析機票訂單明細，共', lines.length, '行');

  // 先初始化結果
  const result: ParsedPNR = {
    recordLocator: '',
    passengerNames: [],
    passengers: [],
    segments: [],
    ticketingDeadline: null,
    cancellationDeadline: null,
    specialRequests: [],
    otherInfo: [],
    contactInfo: [],
    validation: { isValid: true, errors: [], warnings: [], suggestions: [] },
    fareData: null,
    ticketNumbers: [],
    sourceFormat: 'ticket_order_detail',  // ⭐️ 僅此格式的金額為成本價
  };

  // 解析票價資訊（成本價格）
  let baseFare: number | null = null;
  let surcharge: number | null = null;
  let taxes: number | null = null;
  let totalFare: number | null = null;
  let currentPassenger = '';

  // 找出訂位記錄區塊的起始位置
  let pnrStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('訂位記錄') || lines[i].startsWith('/$---') || lines[i].startsWith('RP/')) {
      pnrStartIndex = i;
      break;
    }
  }

  // 解析上方的票務資訊
  for (let i = 0; i < (pnrStartIndex > 0 ? pnrStartIndex : lines.length); i++) {
    const line = lines[i];

    // 解析旅客姓名（英文格式 SURNAME/GIVENNAME）
    const nameMatch = line.match(/^([A-Z]+\/[A-Z]+)$/);
    if (nameMatch) {
      currentPassenger = nameMatch[1];
      if (!result.passengerNames.includes(currentPassenger)) {
        result.passengerNames.push(currentPassenger);
        result.passengers.push({
          index: result.passengers.length + 1,
          name: currentPassenger,
          type: 'ADT',
        });
      }
      logger.log('  ✅ 找到旅客:', currentPassenger);
      continue;
    }

    // 解析機票號碼（格式：781-6392510194）
    const ticketMatch = line.match(/^(\d{3})-(\d{10,})$/);
    if (ticketMatch) {
      const ticketNumber = `${ticketMatch[1]}-${ticketMatch[2]}`;
      result.ticketNumbers.push({
        number: ticketNumber,
        passenger: currentPassenger,
      });
      logger.log('  ✅ 找到機票號碼:', ticketNumber);
      continue;
    }

    // 解析金額（票面價）- 支援兩種格式
    // 格式1: 「金　額」在一行，數字在下一行
    // 格式2: 「金　額	9,833」或「金　額 9,833」在同一行
    if (line === '金　額' || line === '金額') {
      if (i + 1 < lines.length) {
        const amount = parseFloat(lines[i + 1].replace(/,/g, ''));
        if (!isNaN(amount)) {
          baseFare = amount;
          logger.log('  ✅ 找到金額（下一行）:', amount);
        }
      }
      continue;
    }
    const baseFareMatch = line.match(/^金[\s　]*額[\s\t:：]*([0-9,]+)/);
    if (baseFareMatch) {
      baseFare = parseFloat(baseFareMatch[1].replace(/,/g, ''));
      logger.log('  ✅ 找到金額（同一行）:', baseFare);
      continue;
    }

    // 解析附加費
    if (line === '附加費') {
      if (i + 1 < lines.length) {
        const amount = parseFloat(lines[i + 1].replace(/,/g, ''));
        if (!isNaN(amount)) {
          surcharge = amount;
          logger.log('  ✅ 找到附加費（下一行）:', amount);
        }
      }
      continue;
    }
    const surchargeMatch = line.match(/^附加費[\s\t:：]*([0-9,]+)/);
    if (surchargeMatch) {
      surcharge = parseFloat(surchargeMatch[1].replace(/,/g, ''));
      logger.log('  ✅ 找到附加費（同一行）:', surcharge);
      continue;
    }

    // 解析稅金
    if (line === '稅　金' || line === '稅金') {
      if (i + 1 < lines.length) {
        const amount = parseFloat(lines[i + 1].replace(/,/g, ''));
        if (!isNaN(amount)) {
          taxes = amount;
          logger.log('  ✅ 找到稅金（下一行）:', amount);
        }
      }
      continue;
    }
    const taxMatch = line.match(/^稅[\s　]*金[\s\t:：]*([0-9,]+)/);
    if (taxMatch) {
      taxes = parseFloat(taxMatch[1].replace(/,/g, ''));
      logger.log('  ✅ 找到稅金（同一行）:', taxes);
      continue;
    }

    // 解析小計
    if (line === '小　計' || line === '小計') {
      if (i + 1 < lines.length) {
        const amount = parseFloat(lines[i + 1].replace(/,/g, ''));
        if (!isNaN(amount)) {
          totalFare = amount;
          logger.log('  ✅ 找到小計（下一行）:', amount);
        }
      }
      continue;
    }
    const totalMatch = line.match(/^小[\s　]*計[\s\t:：]*([0-9,]+)/);
    if (totalMatch) {
      totalFare = parseFloat(totalMatch[1].replace(/,/g, ''));
      logger.log('  ✅ 找到小計（同一行）:', totalFare);
      continue;
    }

    // 解析訂單編號（用作備用 record locator）
    const orderMatch = line.match(/訂單編號[:：]\s*(\d+)/);
    if (orderMatch && !result.recordLocator) {
      // 先暫存，如果 PNR 裡沒有再用這個
      result.contactInfo.push(`訂單編號: ${orderMatch[1]}`);
    }
  }

  // 解析內嵌的 PNR
  if (pnrStartIndex > 0) {
    // 提取 PNR 區塊
    const pnrLines = lines.slice(pnrStartIndex).filter(l =>
      !l.includes('訂位記錄') && l.trim()
    );
    const pnrText = pnrLines.join('\n');

    // 使用 Amadeus PNR 解析器
    const pnrResult = parseAmadeusPNR(pnrText);

    // 合併結果
    if (pnrResult.recordLocator) {
      result.recordLocator = pnrResult.recordLocator;
    }
    if (pnrResult.segments.length > 0) {
      result.segments = pnrResult.segments;
    }
    if (pnrResult.passengerNames.length > 0 && result.passengerNames.length === 0) {
      result.passengerNames = pnrResult.passengerNames;
      result.passengers = pnrResult.passengers;
    }
    if (pnrResult.ticketingDeadline) {
      result.ticketingDeadline = pnrResult.ticketingDeadline;
    }
    result.specialRequests = pnrResult.specialRequests;
    result.otherInfo = pnrResult.otherInfo;
    if (pnrResult.contactInfo.length > 0) {
      result.contactInfo.push(...pnrResult.contactInfo);
    }
  }

  // 組合票價資料
  if (totalFare !== null || baseFare !== null) {
    const totalTaxes = (taxes || 0) + (surcharge || 0);
    result.fareData = {
      currency: 'TWD',
      baseFare,
      taxes: totalTaxes,
      totalFare: totalFare || (baseFare || 0) + totalTaxes,
      fareBasis: null,
      validatingCarrier: null,
      taxBreakdown: [],
      perPassenger: true,
      raw: `金額: ${baseFare}, 附加費: ${surcharge}, 稅金: ${taxes}, 小計: ${totalFare}`,
    };
  }

  logger.log('📋 機票訂單明細解析完成:', {
    旅客數: result.passengerNames.length,
    航班數: result.segments.length,
    訂位代號: result.recordLocator,
    票號數: result.ticketNumbers.length,
    票價資料: result.fareData ? {
      金額: result.fareData.baseFare,
      稅金: result.fareData.taxes,
      小計: result.fareData.totalFare,
    } : '無',
    來源格式: result.sourceFormat,
  });

  return result;
}

/**
 * 智能檢測並解析 PNR（自動判斷格式）
 *
 * 支援三種格式：
 * 1. 機票訂單明細（開票系統匯出）⭐️ 機票成本以此為準
 *    - 金額（票面價）、附加費、稅金、小計
 *    - 這是「成本價格」，用於計算 flight_cost
 *    - 內嵌 Amadeus PNR
 *
 * 2. 電子機票（E-Ticket）- 金額為「售後價格」，不用於成本計算
 *    - 旅客姓名、機票號碼、訂位代號
 *    - 航班資訊
 *    - AIR FARE / TAX / TOTAL 是售價，非成本
 *
 * 3. Amadeus PNR 電報 - 無金額資訊
 *    - 旅客姓名、航班資訊
 *    - 出票期限
 *    - FA 行機票號碼
 */
export function parseFlightConfirmation(input: string): ParsedHTMLConfirmation | ParsedPNR {
  // 檢測是否為 HTML 格式
  if (input.includes('<html') || input.includes('<!DOCTYPE') || input.includes('電腦代號')) {
    return parseHTMLConfirmation(input);
  }

  // 檢測是否為「機票訂單明細」格式（開票系統匯出）
  // ⭐️ 機票金額以此格式為準（有 金額/附加費/稅金/小計）
  if (input.includes('機票訂單明細') || input.includes('銷售摘要') ||
      (input.includes('金　額') && input.includes('小　計') && input.includes('訂位記錄'))) {
    return parseTicketOrderDetail(input);
  }

  // 檢測是否為電子機票格式（包含 TICKET NUMBER 和 BOOKING REF）
  // 金額為選填，不一定提供
  if (input.includes('TICKET NUMBER') && (input.includes('BOOKING REF') || input.includes('NAME:'))) {
    return parseETicketConfirmation(input);
  }

  // 否則當作 Amadeus 電報處理
  return parseAmadeusPNR(input);
}
