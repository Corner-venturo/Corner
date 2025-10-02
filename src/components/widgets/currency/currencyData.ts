/**
 * 匯率相關常數和資料
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const currencies: Currency[] = [
  { code: 'USD', name: '美金', symbol: '$' },
  { code: 'TWD', name: '台幣', symbol: 'NT$' },
  { code: 'KRW', name: '韓元', symbol: '₩' },
  { code: 'JPY', name: '日圓', symbol: '¥' },
  { code: 'GBP', name: '英鎊', symbol: '£' },
  { code: 'CNY', name: '人民幣', symbol: '¥' },
  { code: 'VND', name: '越南盾', symbol: '₫' },
  { code: 'IDR', name: '印尼盾', symbol: 'Rp' }
];

export type ExchangeRates = Record<string, Record<string, number>>;

export const defaultExchangeRates: ExchangeRates = {
  USD: { USD: 1, TWD: 31.5, KRW: 1300, JPY: 150, GBP: 0.79, CNY: 7.2, VND: 24000, IDR: 15600 },
  TWD: { USD: 0.032, TWD: 1, KRW: 41.3, JPY: 4.76, GBP: 0.025, CNY: 0.23, VND: 762, IDR: 495 },
  KRW: { USD: 0.00077, TWD: 0.024, KRW: 1, JPY: 0.115, GBP: 0.00061, CNY: 0.0055, VND: 18.5, IDR: 12 },
  JPY: { USD: 0.0067, TWD: 0.21, KRW: 8.67, JPY: 1, GBP: 0.0053, CNY: 0.048, VND: 160, IDR: 104 },
  GBP: { USD: 1.27, TWD: 40, KRW: 1646, JPY: 190, GBP: 1, CNY: 9.1, VND: 30480, IDR: 19812 },
  CNY: { USD: 0.139, TWD: 4.35, KRW: 180.6, JPY: 20.8, GBP: 0.11, CNY: 1, VND: 3333, IDR: 2167 },
  VND: { USD: 0.000042, TWD: 0.0013, KRW: 0.054, JPY: 0.00625, GBP: 0.000033, CNY: 0.0003, VND: 1, IDR: 0.65 },
  IDR: { USD: 0.000064, TWD: 0.002, KRW: 0.083, JPY: 0.0096, GBP: 0.00005, CNY: 0.00046, VND: 1.54, IDR: 1 }
};
