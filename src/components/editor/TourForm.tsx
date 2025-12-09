'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { TourFormData } from './tour-form/types'
import { useRegionData } from './tour-form/hooks/useRegionData'
import { useTourFormHandlers } from './tour-form/hooks/useTourFormHandlers'
import { CoverInfoSection } from './tour-form/sections/CoverInfoSection'
// CountriesSection 已移除 - 景點選擇器現在可以直接選所有國家
import { FlightInfoSection } from './tour-form/sections/FlightInfoSection'
import { FeaturesSection } from './tour-form/sections/FeaturesSection'
import { LeaderMeetingSection } from './tour-form/sections/LeaderMeetingSection'
import { HotelSection } from './tour-form/sections/HotelSection'
import { DailyItinerarySection } from './tour-form/sections/DailyItinerarySection'
import { PricingDetailsSection } from './tour-form/sections/PricingDetailsSection'
import { PriceTiersSection } from './tour-form/sections/PriceTiersSection'
import { FAQSection } from './tour-form/sections/FAQSection'
import { NoticesPolicySection } from './tour-form/sections/NoticesPolicySection'
import { Image, Plane, Star, MapPin, Users, Building2, DollarSign, HelpCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourFormProps {
  data: TourFormData
  onChange: (data: TourFormData) => void
}

// 導覽項目配置
const navItems = [
  { id: 'section-cover', label: '封面', icon: Image },
  { id: 'section-flight', label: '航班', icon: Plane },
  { id: 'section-features', label: '特色', icon: Star },
  { id: 'section-itinerary', label: '行程', icon: MapPin },
  { id: 'section-leader', label: '領隊', icon: Users },
  { id: 'section-hotel', label: '飯店', icon: Building2 },
  { id: 'section-pricing', label: '團費', icon: DollarSign },
  { id: 'section-faq', label: '問答', icon: HelpCircle },
  { id: 'section-notices', label: '須知', icon: AlertCircle },
]

export function TourForm({ data, onChange }: TourFormProps) {
  const { user } = useAuthStore()
  const [activeSection, setActiveSection] = useState('section-cover')
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    selectedCountry,
    setSelectedCountry,
    setSelectedCountryCode,
    allDestinations,
    availableCities,
    countryNameToCode,
  } = useRegionData(data)

  const handlers = useTourFormHandlers(data, onChange, selectedCountry)

  // 監聽滾動來更新當前區塊
  useEffect(() => {
    // 找到實際的滾動容器（父元素）
    const scrollContainer = containerRef.current?.parentElement
    if (!scrollContainer) return

    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.id))
      const containerRect = scrollContainer.getBoundingClientRect()

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section) {
          const rect = section.getBoundingClientRect()
          // 判斷 section 是否在可視範圍內（相對於 container 頂部 100px 內）
          if (rect.top <= containerRect.top + 100) {
            setActiveSection(navItems[i].id)
            break
          }
        }
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  // 跳轉到指定區塊
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    const scrollContainer = containerRef.current?.parentElement
    if (section && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect()
      const sectionRect = section.getBoundingClientRect()
      const offset = sectionRect.top - containerRect.top + scrollContainer.scrollTop - 60

      scrollContainer.scrollTo({
        top: offset,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div ref={containerRef}>
      {/* 快速導覽列 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-morandi-container/30 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-morandi-gold text-white'
                    : 'bg-morandi-container/20 text-morandi-secondary hover:bg-morandi-container/40'
                )}
              >
                <Icon size={12} />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* 封面設定 */}
        <div id="section-cover">
          <CoverInfoSection
            data={data}
            user={user}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            setSelectedCountryCode={setSelectedCountryCode}
            allDestinations={allDestinations}
            availableCities={availableCities}
            countryNameToCode={countryNameToCode}
            updateField={handlers.updateField}
            updateCity={handlers.updateCity}
            onChange={onChange}
          />
        </div>

        {/* 航班資訊 */}
        <div id="section-flight">
          <FlightInfoSection
            data={data}
            updateFlightField={handlers.updateFlightField}
            updateFlightFields={handlers.updateFlightFields}
            onGenerateDailyItinerary={(days: number, departureDate: string) => {
              // 解析出發日期
              const parseDepartureDate = (dateStr: string): Date | null => {
                if (!dateStr) return null
                let parts: string[]
                if (dateStr.includes('/')) {
                  parts = dateStr.split('/')
                } else if (dateStr.includes('-')) {
                  parts = dateStr.split('-')
                } else {
                  return null
                }
                if (parts.length === 3) {
                  const [year, month, day] = parts.map(Number)
                  return new Date(year, month - 1, day)
                }
                return null
              }

              const baseDepartureDate = parseDepartureDate(departureDate)
              if (!baseDepartureDate) return

              // 計算每天的日期
              const formatDate = (date: Date): string => {
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                return `${year}/${month}/${day}`
              }

              // 生成空白的每日行程
              const newDailyItinerary = Array.from({ length: days }, (_, i) => {
                const dayDate = new Date(baseDepartureDate)
                dayDate.setDate(dayDate.getDate() + i)
                return {
                  dayLabel: `Day ${i + 1}`,
                  date: formatDate(dayDate),
                  title: '',
                  highlight: '',
                  description: '',
                  activities: [],
                  recommendations: [],
                  meals: { breakfast: '', lunch: '', dinner: '' },
                  accommodation: '',
                  images: [],
                }
              })

              onChange({ ...data, dailyItinerary: newDailyItinerary })
            }}
          />
        </div>

        {/* 行程特色 */}
        <div id="section-features" className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-morandi-container/10 rounded-lg border border-morandi-container/30">
            <input
              type="checkbox"
              id="showFeatures"
              checked={data.showFeatures !== false}
              onChange={e => onChange({ ...data, showFeatures: e.target.checked })}
              className="h-4 w-4 text-morandi-gold focus:ring-morandi-gold border-morandi-container rounded"
            />
            <label htmlFor="showFeatures" className="text-sm font-medium text-morandi-primary cursor-pointer">
              顯示行程特色區塊
            </label>
          </div>

          {data.showFeatures !== false && (
            <FeaturesSection
              data={data}
              addFeature={handlers.addFeature}
              updateFeature={handlers.updateFeature}
              removeFeature={handlers.removeFeature}
              reorderFeature={handlers.reorderFeature}
            />
          )}
        </div>

        {/* 每日行程 */}
        <div id="section-itinerary">
          <DailyItinerarySection
            data={data}
            updateField={handlers.updateField}
            addDailyItinerary={handlers.addDailyItinerary}
            updateDailyItinerary={handlers.updateDailyItinerary}
            removeDailyItinerary={handlers.removeDailyItinerary}
            swapDailyItinerary={handlers.swapDailyItinerary}
            addActivity={handlers.addActivity}
            updateActivity={handlers.updateActivity}
            removeActivity={handlers.removeActivity}
            addDayImage={handlers.addDayImage}
            updateDayImage={handlers.updateDayImage}
            removeDayImage={handlers.removeDayImage}
            addRecommendation={handlers.addRecommendation}
            updateRecommendation={handlers.updateRecommendation}
            removeRecommendation={handlers.removeRecommendation}
          />
        </div>

        {/* 領隊與集合資訊 */}
        <div id="section-leader">
          <LeaderMeetingSection
            data={data}
            updateNestedField={handlers.updateNestedField}
            updateField={handlers.updateField}
          />
        </div>

        {/* 飯店資訊 */}
        <div id="section-hotel">
          <HotelSection data={data} updateField={handlers.updateField} />
        </div>

        {/* 團費說明 */}
        <div id="section-pricing" className="space-y-8">
          {/* 價格方案（4人、6人、8人包團） */}
          <PriceTiersSection data={data} onChange={onChange} />

          {/* 詳細團費（費用包含/不含） */}
          <PricingDetailsSection
            data={data}
            updateField={handlers.updateField}
            onChange={onChange}
          />
        </div>

        {/* 常見問題 */}
        <div id="section-faq">
          <FAQSection data={data} onChange={onChange} />
        </div>

        {/* 提醒事項與取消政策 */}
        <div id="section-notices">
          <NoticesPolicySection data={data} onChange={onChange} />
        </div>
      </div>
    </div>
  )
}
