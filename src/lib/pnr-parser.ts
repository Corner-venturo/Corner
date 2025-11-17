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
