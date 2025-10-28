import {
  Calculator,
  DollarSign,
  FileText,
  CheckSquare
} from 'lucide-react';
import { TabConfig, ExchangeRates } from './types';

export const TABS: TabConfig[] = [
  { id: 'calculator', label: '計算機', icon: Calculator },
  { id: 'currency', label: '匯率', icon: DollarSign },
  { id: 'notes', label: '筆記', icon: FileText },
  { id: 'checklist', label: '清單', icon: CheckSquare }
];

export const EXCHANGE_RATES: ExchangeRates = {
  USD: { TWD: 31.5, EUR: 0.85, JPY: 110 },
  TWD: { USD: 0.032, EUR: 0.027, JPY: 3.5 },
  EUR: { USD: 1.18, TWD: 37.1, JPY: 129 },
  JPY: { USD: 0.009, TWD: 0.29, EUR: 0.008 }
};

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: '美元 (USD)' },
  { value: 'TWD', label: '台幣 (TWD)' },
  { value: 'EUR', label: '歐元 (EUR)' },
  { value: 'JPY', label: '日圓 (JPY)' }
];

export const STORAGE_KEYS = {
  NOTES: 'venturo-notes',
  CHECKLISTS: 'venturo-checklists'
};
