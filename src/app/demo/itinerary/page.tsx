'use client'

import { useState } from 'react'
import {
  FileText,
  Plane,
  MapPin,
  Clock,
  Utensils,
  Hotel,
  Camera,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star
} from 'lucide-react'

// Demo itinerary data
const demoItinerary = {
  title: '北海道雪祭豪華5日',
  subtitle: '札幌雪祭 × 小樽運河 × 旭山動物園',
  code: 'JP2501',
  dates: '2025/02/05 - 2025/02/09',
  price: 58800,
  coverImage: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=1200',
  highlights: ['札幌雪祭現場體驗', '小樽運河夜景', '旭山動物園企鵝散步', '北海道三大螃蟹吃到飽'],
  days: [
    {
      day: 1,
      title: '台北 → 札幌',
      date: '2025/02/05',
      highlight: '抵達北海道，札幌市區觀光',
      activities: [
        { time: '07:00', title: '桃園國際機場集合', icon: 'plane' },
        { time: '09:30', title: '搭乘長榮航空 BR116 前往札幌', icon: 'plane' },
        { time: '14:30', title: '抵達新千歲機場', icon: 'plane' },
        { time: '16:00', title: '札幌市區觀光：時計台、大通公園', icon: 'camera' },
        { time: '18:30', title: '晚餐：北海道三大螃蟹吃到飽', icon: 'food' }
      ],
      meals: { breakfast: '機上輕食', lunch: '機上餐點', dinner: '蟹道樂螃蟹會席' },
      hotel: '札幌王子大飯店 或同級',
      image: 'https://images.unsplash.com/photo-1549693578-d683be217e58?w=800'
    },
    {
      day: 2,
      title: '札幌雪祭',
      date: '2025/02/06',
      highlight: '札幌雪祭主會場，冰雕藝術體驗',
      activities: [
        { time: '08:00', title: '飯店享用早餐', icon: 'food' },
        { time: '09:30', title: '大通公園雪祭會場（冰雕觀賞）', icon: 'camera' },
        { time: '12:00', title: '午餐：札幌拉麵共和國', icon: 'food' },
        { time: '14:00', title: '札幌電視塔觀景', icon: 'camera' },
        { time: '15:30', title: '薄野冰祭會場', icon: 'camera' },
        { time: '18:00', title: '晚餐：成吉思汗烤肉', icon: 'food' }
      ],
      meals: { breakfast: '飯店內', lunch: '札幌拉麵', dinner: '成吉思汗烤肉' },
      hotel: '札幌王子大飯店 或同級',
      image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800'
    },
    {
      day: 3,
      title: '小樽浪漫之旅',
      date: '2025/02/07',
      highlight: '小樽運河、音樂盒博物館、玻璃工藝',
      activities: [
        { time: '08:00', title: '飯店享用早餐', icon: 'food' },
        { time: '09:30', title: '前往小樽（車程約40分鐘）', icon: 'bus' },
        { time: '10:30', title: '小樽運河散步', icon: 'camera' },
        { time: '11:30', title: '北一硝子玻璃工藝館', icon: 'camera' },
        { time: '12:30', title: '午餐：政壽司本店', icon: 'food' },
        { time: '14:00', title: '小樽音樂盒堂', icon: 'camera' },
        { time: '15:30', title: 'LeTAO雙層起司蛋糕品嚐', icon: 'food' },
        { time: '18:00', title: '小樽運河夜景', icon: 'camera' },
        { time: '19:30', title: '晚餐：海鮮居酒屋', icon: 'food' }
      ],
      meals: { breakfast: '飯店內', lunch: '政壽司本店', dinner: '海鮮居酒屋' },
      hotel: '札幌王子大飯店 或同級',
      image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=800'
    },
    {
      day: 4,
      title: '旭山動物園',
      date: '2025/02/08',
      highlight: '企鵝散步、北極熊館、雪之美術館',
      activities: [
        { time: '07:30', title: '飯店享用早餐', icon: 'food' },
        { time: '08:30', title: '前往旭川（車程約2小時）', icon: 'bus' },
        { time: '10:30', title: '旭山動物園（企鵝散步11:00）', icon: 'camera' },
        { time: '13:00', title: '午餐：旭川拉麵', icon: 'food' },
        { time: '14:30', title: '雪之美術館', icon: 'camera' },
        { time: '16:30', title: '返回札幌', icon: 'bus' },
        { time: '19:00', title: '晚餐：懷石料理', icon: 'food' }
      ],
      meals: { breakfast: '飯店內', lunch: '旭川拉麵', dinner: '懷石料理' },
      hotel: '札幌王子大飯店 或同級',
      image: 'https://images.unsplash.com/photo-1551415923-a2297c7fda79?w=800'
    },
    {
      day: 5,
      title: '札幌 → 台北',
      date: '2025/02/09',
      highlight: '免稅店購物、返回溫暖的家',
      activities: [
        { time: '08:00', title: '飯店享用早餐', icon: 'food' },
        { time: '09:30', title: '三井OUTLET購物', icon: 'shopping' },
        { time: '12:00', title: '前往新千歲機場', icon: 'bus' },
        { time: '13:30', title: '機場免稅店', icon: 'shopping' },
        { time: '15:30', title: '搭乘長榮航空 BR115 返回台北', icon: 'plane' },
        { time: '19:00', title: '抵達桃園國際機場，結束美好旅程', icon: 'plane' }
      ],
      meals: { breakfast: '飯店內', lunch: '機場自理', dinner: '機上餐點' },
      hotel: '溫暖的家',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800'
    }
  ]
}

export default function DemoItineraryPage() {
  const [expandedDays, setExpandedDays] = useState<number[]>([1, 2])

  const toggleDay = (day: number) => {
    setExpandedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const expandAll = () => setExpandedDays(demoItinerary.days.map(d => d.day))
  const collapseAll = () => setExpandedDays([])

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'plane': return <Plane size={14} />
      case 'camera': return <Camera size={14} />
      case 'food': return <Utensils size={14} />
      case 'bus': return <MapPin size={14} />
      case 'shopping': return <Star size={14} />
      default: return <MapPin size={14} />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-teal-500" />
            行程表預覽
          </h1>
          <p className="text-slate-500 mt-1">客戶端行程表展示效果</p>
        </div>
        <button className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all">
          <ExternalLink size={18} />
          開啟完整頁面
        </button>
      </div>

      {/* Preview Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Hero Section */}
        <div className="relative h-[400px] overflow-hidden">
          <img
            src={demoItinerary.coverImage}
            alt={demoItinerary.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
              {demoItinerary.code}
            </span>
            <h2 className="text-4xl font-bold text-white mb-2">{demoItinerary.title}</h2>
            <p className="text-xl text-white/80 mb-4">{demoItinerary.subtitle}</p>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>{demoItinerary.dates}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-400">NT$ {demoItinerary.price.toLocaleString()}</span>
                <span className="text-white/60">/人</span>
              </div>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="px-8 py-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
          <h3 className="font-bold text-slate-800 mb-3">行程亮點</h3>
          <div className="flex flex-wrap gap-2">
            {demoItinerary.highlights.map((highlight, index) => (
              <span
                key={index}
                className="bg-white px-4 py-2 rounded-full text-sm text-slate-700 border border-amber-200 shadow-sm"
              >
                ✨ {highlight}
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">每日行程</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              全部展開
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              全部收合
            </button>
          </div>
        </div>

        {/* Daily Itinerary */}
        <div className="divide-y divide-slate-100">
          {demoItinerary.days.map((day) => {
            const isExpanded = expandedDays.includes(day.day)
            return (
              <div key={day.day} className="transition-all">
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(day.day)}
                  className="w-full px-8 py-5 flex items-center gap-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                    <span className="text-xs font-medium">DAY</span>
                    <span className="text-2xl font-bold">{day.day}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-800">{day.title}</h4>
                      <span className="text-sm text-slate-400">{day.date}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{day.highlight}</p>
                  </div>
                  <img
                    src={day.image}
                    alt={day.title}
                    className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </button>

                {/* Day Content */}
                {isExpanded && (
                  <div className="px-8 pb-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                      {/* Activities */}
                      <div className="lg:col-span-2 space-y-3">
                        {day.activities.map((activity, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="w-16 text-sm font-medium text-slate-500 flex-shrink-0 pt-1">
                              {activity.time}
                            </div>
                            <div className="flex-1 flex items-start gap-3">
                              <div className="w-8 h-8 bg-white rounded-full border border-slate-200 flex items-center justify-center text-amber-500 flex-shrink-0">
                                {getActivityIcon(activity.icon)}
                              </div>
                              <p className="text-slate-700 pt-1">{activity.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Meals & Hotel */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Utensils size={16} className="text-amber-500" />
                            <h5 className="font-medium text-slate-800">餐食安排</h5>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">早餐</span>
                              <span className="text-slate-700">{day.meals.breakfast}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">午餐</span>
                              <span className="text-slate-700">{day.meals.lunch}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">晚餐</span>
                              <span className="text-slate-700">{day.meals.dinner}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Hotel size={16} className="text-amber-500" />
                            <h5 className="font-medium text-slate-800">住宿</h5>
                          </div>
                          <p className="text-sm text-slate-600">{day.hotel}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
