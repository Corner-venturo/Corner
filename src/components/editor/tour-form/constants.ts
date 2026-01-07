import {
  Building2,
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Plane,
  MapPin,
} from 'lucide-react'
import { IconOption } from './types'

export const iconOptions: IconOption[] = [
  { value: 'IconBuilding', label: '建築/飯店', component: Building2 },
  { value: 'IconToolsKitchen2', label: '餐食', component: UtensilsCrossed },
  { value: 'IconSparkles', label: '特色', component: Sparkles },
  { value: 'IconCalendar', label: '行程', component: Calendar },
  { value: 'IconPlane', label: '航班', component: Plane },
  { value: 'IconMapPin', label: '景點', component: MapPin },
]

// 時差對照表（相對於台灣 UTC+8）
export const timezoneOffset: Record<string, number> = {
  中國大陸: 0, // UTC+8 (與台灣相同)
  日本: 1, // UTC+9
  韓國: 1, // UTC+9
  泰國: -1, // UTC+7
  越南: -1, // UTC+7
  馬來西亞: 0, // UTC+8
  新加坡: 0, // UTC+8
  印尼: 0, // UTC+8 (雅加達)
  菲律賓: 0, // UTC+8
  美國: -16, // UTC-8 (洛杉磯) - 注意：美國跨多個時區
  加拿大: -16, // UTC-8 (溫哥華) - 注意：加拿大跨多個時區
  澳洲: 2, // UTC+10 (雪梨) - 注意：澳洲跨多個時區
  紐西蘭: 4, // UTC+12
  歐洲: -7, // UTC+1 (倫敦) - 注意：歐洲跨多個時區
  土耳其: -5, // UTC+3
}
