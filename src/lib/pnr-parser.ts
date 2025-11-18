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
  segments: FlightSegment[];
  ticketingDeadline: Date | null;
  cancellationDeadline: Date | null;
  specialRequests: string[];
  otherInfo: string[];
  contactInfo: string[];
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
 * 解析 Amadeus PNR 電報
 */
export function parseAmadeusPNR(rawPNR: string): ParsedPNR {
  const lines = rawPNR.split('\n').map(line => line.trim()).filter(Boolean);

  logger.log('📋 開始解析電報，共', lines.length, '行');

  const result: ParsedPNR = {
    recordLocator: '',
    passengerNames: [],
    segments: [],
    ticketingDeadline: null,
    cancellationDeadline: null,
    specialRequests: [],
    otherInfo: [],
    contactInfo: [],
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

    // 1. 解析旅客姓名 (e.g., "1.WU/MINGTUNG  2.CHANG/TSEYUN")
    // 可能在同一行有多個旅客
    const multiNameMatch = line.match(/(\d+\.[A-Z]+\/[A-Z]+(?:\s+(?:MR|MRS|MS|MISS|MSTR|CHD|INF))?)/gi);
    if (multiNameMatch) {
      for (const match of multiNameMatch) {
        const nameOnly = match.replace(/^\d+\./, '').trim();
        if (nameOnly && !result.passengerNames.includes(nameOnly)) {
          result.passengerNames.push(nameOnly);
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
    if (line.match(/^SR\s+/i) || line.match(/^SSR\s+/i)) {
      result.specialRequests.push(line.replace(/^S{1,2}R\s+/i, '').trim());
      continue;
    }

    // 5. 解析 OSI (Other Service Information)
    if (line.match(/^OSI\s+/i)) {
      result.otherInfo.push(line.replace(/^OSI\s+/i, '').trim());
      continue;
    }

    // 6. 解析聯絡資訊 (e.g., "AP TPE 02-2712-8888")
    const contactMatch = line.match(/^AP[EM]?\s+(.+)/i);
    if (contactMatch) {
      result.contactInfo.push(contactMatch[1].trim());
      continue;
    }
  }

  return result;
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
