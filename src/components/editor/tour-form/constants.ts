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

// 城市圖片對照表（擴充版）
export const cityImages: Record<string, string> = {
  // 日本
  東京: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=75&auto=format&fit=crop',
  京都: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=75&auto=format&fit=crop',
  大阪: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1200&q=75&auto=format&fit=crop',
  札幌: 'https://images.unsplash.com/photo-1560932124-d6095cd5d5d7?w=1200&q=75&auto=format&fit=crop',
  沖繩: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop',
  名古屋:
    'https://images.unsplash.com/photo-1583499976516-20fdb6a0d463?w=1200&q=75&auto=format&fit=crop',
  福岡: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=75&auto=format&fit=crop',
  廣島: 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=1200&q=75&auto=format&fit=crop',

  // 中國大陸
  北京: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=75&auto=format&fit=crop',
  上海: 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=1200&q=75&auto=format&fit=crop',
  廣州: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=1200&q=75&auto=format&fit=crop',
  深圳: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=1200&q=75&auto=format&fit=crop',
  廈門: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop',
  杭州: 'https://images.unsplash.com/photo-1581481615985-ba4775734a9b?w=1200&q=75&auto=format&fit=crop',
  南京: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=1200&q=75&auto=format&fit=crop',
  成都: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=75&auto=format&fit=crop',

  // 泰國
  曼谷: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=75&auto=format&fit=crop',
  清邁: 'https://images.unsplash.com/photo-1563492065213-4c4bb194eefc?w=1200&q=75&auto=format&fit=crop',
  普吉: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=75&auto=format&fit=crop',
  蘇美島:
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1200&q=75&auto=format&fit=crop',
  甲米: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=75&auto=format&fit=crop',
  烏隆: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=1200&q=75&auto=format&fit=crop',

  // 越南
  河內: 'https://images.unsplash.com/photo-1509030458710-f24f3682df0d?w=1200&q=75&auto=format&fit=crop',
  胡志明:
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=75&auto=format&fit=crop',
  峴港: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=75&auto=format&fit=crop',
  富國島:
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop',
  順化: 'https://images.unsplash.com/photo-1555881675-d8d8d7b1c157?w=1200&q=75&auto=format&fit=crop',
  大叻: 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=1200&q=75&auto=format&fit=crop',

  // 韓國
  首爾: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1200&q=75&auto=format&fit=crop',
  釜山: 'https://images.unsplash.com/photo-1541996861-12e48df50bf5?w=1200&q=75&auto=format&fit=crop',
  濟州: 'https://images.unsplash.com/photo-1598973621853-f9a8a6e9a592?w=1200&q=75&auto=format&fit=crop',
  仁川: 'https://images.unsplash.com/photo-1585124804253-3e34e05c9120?w=1200&q=75&auto=format&fit=crop',
  大邱: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1200&q=75&auto=format&fit=crop',

  // 馬來西亞
  吉隆坡:
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=75&auto=format&fit=crop',
  檳城: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop',
  新山: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=75&auto=format&fit=crop',
  古晉: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=1200&q=75&auto=format&fit=crop',
  蘭卡威:
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=75&auto=format&fit=crop',
  沙巴: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1200&q=75&auto=format&fit=crop',

  // 新加坡
  新加坡:
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=75&auto=format&fit=crop',

  // 印尼
  雅加達:
    'https://images.unsplash.com/photo-1555333145-4acf190da336?w=1200&q=75&auto=format&fit=crop',
  峇里島:
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=75&auto=format&fit=crop',
  日惹: 'https://images.unsplash.com/photo-1558007652-8e8f7238e978?w=1200&q=75&auto=format&fit=crop',
  梭羅: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=75&auto=format&fit=crop',

  // 菲律賓
  馬尼拉:
    'https://images.unsplash.com/photo-1542704792-e30daa0f905e?w=1200&q=75&auto=format&fit=crop',
  宿霧: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop',
  達沃: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=75&auto=format&fit=crop',
  怡朗: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=75&auto=format&fit=crop',

  // 美國
  洛杉磯:
    'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=1200&q=75&auto=format&fit=crop',
  紐約: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=75&auto=format&fit=crop',
  拉斯維加斯:
    'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=75&auto=format&fit=crop',
  舊金山:
    'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=1200&q=75&auto=format&fit=crop',
  西雅圖:
    'https://images.unsplash.com/photo-1555883006-0f5a0915a80f?w=1200&q=75&auto=format&fit=crop',
  芝加哥:
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=75&auto=format&fit=crop',

  // 加拿大
  溫哥華:
    'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=1200&q=75&auto=format&fit=crop',
  多倫多:
    'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1200&q=75&auto=format&fit=crop',
  蒙特婁:
    'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1200&q=75&auto=format&fit=crop',
  卡加利:
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=75&auto=format&fit=crop',

  // 澳洲
  雪梨: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=75&auto=format&fit=crop',
  墨爾本:
    'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=1200&q=75&auto=format&fit=crop',
  布里斯本:
    'https://images.unsplash.com/photo-1524168272322-bf73616d9cb5?w=1200&q=75&auto=format&fit=crop',
  伯斯: 'https://images.unsplash.com/photo-1591695287818-5f5d1e0bf9d3?w=1200&q=75&auto=format&fit=crop',
  阿德萊德:
    'https://images.unsplash.com/photo-1585779034823-7e9ac8faec70?w=1200&q=75&auto=format&fit=crop',

  // 紐西蘭
  奧克蘭:
    'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&q=75&auto=format&fit=crop',
  基督城:
    'https://images.unsplash.com/photo-1568454537842-d933259bb258?w=1200&q=75&auto=format&fit=crop',
  威靈頓:
    'https://images.unsplash.com/photo-1589690810328-8bc609bb749c?w=1200&q=75&auto=format&fit=crop',
  皇后鎮:
    'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&q=75&auto=format&fit=crop',

  // 歐洲
  倫敦: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=75&auto=format&fit=crop',
  巴黎: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=75&auto=format&fit=crop',
  羅馬: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=75&auto=format&fit=crop',
  巴塞隆納:
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=75&auto=format&fit=crop',
  柏林: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&q=75&auto=format&fit=crop',
  阿姆斯特丹:
    'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200&q=75&auto=format&fit=crop',
  蘇黎世:
    'https://images.unsplash.com/photo-1565530844911-ec9e0d0cd81b?w=1200&q=75&auto=format&fit=crop',
  維也納:
    'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=75&auto=format&fit=crop',

  // 土耳其
  伊斯坦堡:
    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=75&auto=format&fit=crop',
  安塔利亞:
    'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=75&auto=format&fit=crop',
  安卡拉:
    'https://images.unsplash.com/photo-1611415008993-8a88f0d67e67?w=1200&q=75&auto=format&fit=crop',
}

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
