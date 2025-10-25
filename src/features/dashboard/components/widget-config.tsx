import { Calculator, DollarSign, Clock, Clipboard, BarChart3 } from 'lucide-react';
import type { WidgetConfig } from '../types';
import { CalculatorWidget } from './calculator-widget';
import { CurrencyWidget } from './currency-widget';
import { TimerWidget } from './timer-widget';
import { NotesWidget } from './notes-widget';
import { StatsWidget } from './stats-widget';

// 小工具配置
export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  { id: 'stats', name: '統計資訊', icon: BarChart3, component: StatsWidget, span: 2 },
  { id: 'calculator', name: '計算機', icon: Calculator, component: CalculatorWidget },
  { id: 'currency', name: '匯率換算', icon: DollarSign, component: CurrencyWidget },
  { id: 'timer', name: '計時器', icon: Clock, component: TimerWidget },
  { id: 'notes', name: '便條紙', icon: Clipboard, component: NotesWidget },
];
