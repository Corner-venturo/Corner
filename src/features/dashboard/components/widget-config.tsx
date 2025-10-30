import {
  Calculator,
  DollarSign,
  Clock,
  Clipboard,
  Sparkles,
  Cloud,
  Plane,
  CloudSun,
  Shield,
  Banknote,
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
import { VisaWidget } from './visa-widget'
import { RemittanceWidget } from './remittance-widget'

// 小工具配置
export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'manifestation',
    name: '顯化魔法',
    icon: Sparkles,
    component: ManifestationWidget,
    span: 1,
  },
  { id: 'flight', name: '航班查詢', icon: Plane, component: FlightWidget, span: 1 },
  { id: 'visa', name: '簽證查詢', icon: Shield, component: VisaWidget, span: 1 },
  { id: 'remittance', name: '匯款比較', icon: Banknote, component: RemittanceWidget, span: 1 },
  { id: 'weather', name: '天氣查詢', icon: Cloud, component: WeatherWidget, span: 1 },
  {
    id: 'weather-weekly',
    name: '天氣週報',
    icon: CloudSun,
    component: WeatherWidgetWeekly,
    span: 2,
  },
  { id: 'calculator', name: '計算機', icon: Calculator, component: CalculatorWidget, span: 1 },
  { id: 'currency', name: '匯率換算', icon: DollarSign, component: CurrencyWidget, span: 1 },
  { id: 'timer', name: '計時器', icon: Clock, component: TimerWidget, span: 1 },
  { id: 'notes', name: '便條紙', icon: Clipboard, component: NotesWidget, span: 1 },
]
