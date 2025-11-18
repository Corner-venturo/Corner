import {
  Calculator,
  DollarSign,
  Clock,
  Clipboard,
  Sparkles,
  Cloud,
  Plane,
  CloudSun,
} from 'lucide-react'
import type { WidgetConfig } from '../types'
import { CalculatorWidget } from './calculator-widget'
import { CurrencyWidget } from './currency-widget'
import { TimerWidget } from './timer-widget'
import { NotesWidget } from './notes-widget'
import { ManifestationWidget } from './manifestation-widget'
import { WeatherWidget } from './weather-widget'
import { WeatherWidgetWeekly } from './weather-widget-weekly'
import { FlightWidget } from './flight-widget'

// 小工具配置
export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'manifestation',
    name: '顯化魔法',
    icon: Sparkles as any,
    component: ManifestationWidget as any,
    span: 1,
  },
  { id: 'flight', name: '航班查詢', icon: Plane as any, component: FlightWidget as any, span: 1 },
  { id: 'weather', name: '天氣查詢', icon: Cloud as any, component: WeatherWidget as any, span: 1 },
  {
    id: 'weather-weekly',
    name: '天氣週報',
    icon: CloudSun as any,
    component: WeatherWidgetWeekly as any,
    span: 2,
  },
  { id: 'calculator', name: '計算機', icon: Calculator as any, component: CalculatorWidget as any, span: 1 },
  { id: 'currency', name: '匯率換算', icon: DollarSign as any, component: CurrencyWidget as any, span: 1 },
  { id: 'timer', name: '計時器', icon: Clock as any, component: TimerWidget as any, span: 1 },
  { id: 'notes', name: '便條紙', icon: Clipboard as any, component: NotesWidget as any, span: 1 },
]
