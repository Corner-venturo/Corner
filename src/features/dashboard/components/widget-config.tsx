import { Calculator, DollarSign, Clock, Clipboard, Sparkles, Cloud } from 'lucide-react';
import type { WidgetConfig } from '../types';
import { CalculatorWidget } from './calculator-widget';
import { CurrencyWidget } from './currency-widget';
import { TimerWidget } from './timer-widget';
import { NotesWidget } from './notes-widget';
import { ManifestationWidget } from './manifestation-widget';
import { WeatherWidget } from './weather-widget';

// 小工具配置
export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  { id: 'manifestation', name: '顯化魔法', icon: Sparkles, component: ManifestationWidget, span: 1 },
  { id: 'weather', name: '天氣查詢', icon: Cloud, component: WeatherWidget },
  { id: 'calculator', name: '計算機', icon: Calculator, component: CalculatorWidget },
  { id: 'currency', name: '匯率換算', icon: DollarSign, component: CurrencyWidget },
  { id: 'timer', name: '計時器', icon: Clock, component: TimerWidget },
  { id: 'notes', name: '便條紙', icon: Clipboard, component: NotesWidget },
];
