/**
 * 機票訂單明細（開票系統匯出）解析器
 */

import { logger } from '@/lib/utils/logger';
import { ParsedPNR } from '../types';
import { parseAmadeusPNR } from './amadeus';

/**
 * 解析「機票訂單明細」格式
 */
export function parseTicketOrderDetail(input: string): ParsedPNR {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);

  logger.log('📋 開始解析機票訂單明細，共', lines.length, '行');

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
    sourceFormat: 'ticket_order_detail',
  };

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

    // 解析旅客姓名
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

    // 解析機票號碼
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

    // 解析金額（標籤在一行，數字在下一行）
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
    // 解析金額（同一行格式）
    const baseFareMatch = line.match(/^金[\s　]*額[\s\t:：]*([0-9,]+)/);
    if (baseFareMatch) {
      baseFare = parseFloat(baseFareMatch[1].replace(/,/g, ''));
      logger.log('  ✅ 找到金額（同一行）:', baseFare);
      continue;
    }

    // 解析附加費（標籤在一行）
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
    // 解析附加費（同一行格式）
    const surchargeMatch = line.match(/^附加費[\s\t:：]*([0-9,]+)/);
    if (surchargeMatch) {
      surcharge = parseFloat(surchargeMatch[1].replace(/,/g, ''));
      logger.log('  ✅ 找到附加費（同一行）:', surcharge);
      continue;
    }

    // 解析稅金（標籤在一行）
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
    // 解析稅金（同一行格式）
    const taxMatch = line.match(/^稅[\s　]*金[\s\t:：]*([0-9,]+)/);
    if (taxMatch) {
      taxes = parseFloat(taxMatch[1].replace(/,/g, ''));
      logger.log('  ✅ 找到稅金（同一行）:', taxes);
      continue;
    }

    // 解析小計（標籤在一行）
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
    // 解析小計（同一行格式）
    const totalMatch = line.match(/^小[\s　]*計[\s\t:：]*([0-9,]+)/);
    if (totalMatch) {
      totalFare = parseFloat(totalMatch[1].replace(/,/g, ''));
      logger.log('  ✅ 找到小計（同一行）:', totalFare);
      continue;
    }

    // 解析訂單編號
    const orderMatch = line.match(/訂單編號[:：]\s*(\d+)/);
    if (orderMatch && !result.recordLocator) {
      result.contactInfo.push(`訂單編號: ${orderMatch[1]}`);
    }
  }

  // 解析內嵌的 PNR
  if (pnrStartIndex > 0) {
    const pnrLines = lines.slice(pnrStartIndex).filter(l =>
      !l.includes('訂位記錄') && l.trim()
    );
    const pnrText = pnrLines.join('\n');

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
