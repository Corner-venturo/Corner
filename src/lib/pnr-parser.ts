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
 * 解析 Amadeus PNR 電報
 */
export function parseAmadeusPNR(rawPNR: string): ParsedPNR {
  const lines = rawPNR.split('\n').map(line => line.trim()).filter(Boolean);

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
    // 格式: "3  BR 116 Q 15JAN 4 TPECTS HK2  0930 1405  15JAN  E  BR/FUM2GY"
    const segmentMatch = line.match(
      /^(\d+)\s+([A-Z0-9]{2})\s+(\d{1,4})\s+([A-Z])\s+(\d{2}[A-Z]{3})\s+\d?\s*([A-Z]{6})\s+([A-Z]{2})(\d+)\s+(\d{4})\s+(\d{4})/i
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
 * 智能檢測並解析 PNR（自動判斷格式）
 */
export function parseFlightConfirmation(input: string): ParsedHTMLConfirmation | ParsedPNR {
  // 檢測是否為 HTML 格式
  if (input.includes('<html') || input.includes('<!DOCTYPE') || input.includes('電腦代號')) {
    return parseHTMLConfirmation(input);
  }

  // 否則當作 Amadeus 電報處理
  return parseAmadeusPNR(input);
}
