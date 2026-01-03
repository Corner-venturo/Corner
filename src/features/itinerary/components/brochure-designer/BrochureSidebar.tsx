'use client'

import React, { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Building2, Calendar, MapPin, Plane, Users, BadgeCheck, Image } from 'lucide-react'
import { AirportImageLibrary } from '@/components/editor/tour-form/sections/cover/AirportImageLibrary'
import { useRegionData } from '@/components/editor/tour-form/hooks/useRegionData'
import { useRegionsStore } from '@/stores'
import type { BrochureCoverData } from './types'
import type { Itinerary } from '@/stores/types'

// 常用機場/城市選項
const AIRPORT_OPTIONS: ComboboxOption[] = [
  { value: 'TPE', label: 'TPE 桃園國際機場' },
  { value: 'TSA', label: 'TSA 台北松山機場' },
  { value: 'KHH', label: 'KHH 高雄國際機場' },
  { value: 'RMQ', label: 'RMQ 台中清泉崗機場' },
  // 日本
  { value: 'NRT', label: 'NRT 東京成田機場' },
  { value: 'HND', label: 'HND 東京羽田機場' },
  { value: 'KIX', label: 'KIX 大阪關西機場' },
  { value: 'ITM', label: 'ITM 大阪伊丹機場' },
  { value: 'FUK', label: 'FUK 福岡機場' },
  { value: 'CTS', label: 'CTS 札幌新千歲機場' },
  { value: 'NGO', label: 'NGO 名古屋中部機場' },
  { value: 'OKA', label: 'OKA 沖繩那霸機場' },
  // 泰國
  { value: 'BKK', label: 'BKK 曼谷蘇凡納布機場' },
  { value: 'DMK', label: 'DMK 曼谷廊曼機場' },
  { value: 'CNX', label: 'CNX 清邁國際機場' },
  { value: 'HKT', label: 'HKT 普吉島機場' },
  // 韓國
  { value: 'ICN', label: 'ICN 首爾仁川機場' },
  { value: 'GMP', label: 'GMP 首爾金浦機場' },
  { value: 'PUS', label: 'PUS 釜山金海機場' },
  // 其他亞洲
  { value: 'HKG', label: 'HKG 香港國際機場' },
  { value: 'SIN', label: 'SIN 新加坡樟宜機場' },
  { value: 'KUL', label: 'KUL 吉隆坡國際機場' },
  { value: 'MNL', label: 'MNL 馬尼拉機場' },
  { value: 'SGN', label: 'SGN 胡志明市機場' },
  { value: 'HAN', label: 'HAN 河內機場' },
  { value: 'REP', label: 'REP 暹粒吳哥機場' },
  { value: 'DPS', label: 'DPS 峇里島機場' },
]


interface BrochureSidebarProps {
  data: BrochureCoverData
  onChange: (data: Partial<BrochureCoverData>) => void
  currentPageType?: string
  itinerary?: Itinerary | null
  onItineraryChange?: (data: Partial<Itinerary>) => void
}

// 封面編輯面板
function CoverEditor({ data, onChange }: { data: BrochureCoverData; onChange: (data: Partial<BrochureCoverData>) => void }) {
  // 使用 useRegionData 載入國家和城市資料
  const {
    selectedCountry,
    setSelectedCountry,
    setSelectedCountryCode,
    allDestinations,
    availableCities,
    countryNameToCode,
  } = useRegionData({ country: data.country })

  // 使用次數追蹤
  const { incrementCountryUsage, incrementCityUsage } = useRegionsStore()

  // 從城市取得機場代碼
  const airportCode = useMemo(() => {
    if (!data.city) return data.airportCode || ''
    const city = availableCities.find(c => c.name === data.city)
    return city?.code || data.airportCode || ''
  }, [data.city, data.airportCode, availableCities])

  // 處理國家變更
  const handleCountryChange = (newCountry: string) => {
    setSelectedCountry(newCountry)
    const code = countryNameToCode[newCountry]
    setSelectedCountryCode(code || '')
    onChange({
      country: newCountry,
      city: '', // 清空城市
      airportCode: '', // 清空機場代碼
    })
    // 更新國家使用次數（讓常用的排在前面）
    if (newCountry) {
      incrementCountryUsage(newCountry)
    }
  }

  // 處理城市變更
  const handleCityChange = (cityName: string) => {
    const city = availableCities.find(c => c.name === cityName)
    onChange({
      city: cityName,
      airportCode: city?.code || '',
    })
    // 更新城市使用次數（讓常用的排在前面）
    if (cityName) {
      incrementCityUsage(cityName)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 表單欄位 */}
      <div className="flex flex-col gap-4">
        {/* 客戶名稱 */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary flex items-center gap-1.5">
            <Building2 size={14} className="text-morandi-gold" />
            客戶名稱 / 團體名稱
          </Label>
          <Input
            value={data.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="如：Acme Corp 年度旅遊"
            className="h-10"
          />
        </div>

        {/* 國家 + 城市 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-morandi-primary">國家</Label>
            <Combobox
              value={selectedCountry}
              onChange={handleCountryChange}
              options={allDestinations.map(dest => ({ value: dest.name, label: dest.name }))}
              placeholder="搜尋或選擇國家..."
              showSearchIcon
              showClearButton
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-morandi-primary">城市</Label>
            <Combobox
              value={data.city || ''}
              onChange={handleCityChange}
              options={availableCities.map(city => ({ value: city.name, label: city.name }))}
              placeholder="搜尋或選擇城市..."
              showSearchIcon
              showClearButton
              disabled={!selectedCountry}
            />
          </div>
        </div>

        {/* 機場代碼（自動帶入，僅顯示） */}
        {airportCode && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-morandi-primary flex items-center gap-1.5">
              <MapPin size={14} className="text-morandi-gold" />
              目的地機場代碼
            </Label>
            <div className="h-10 px-3 flex items-center bg-slate-50 rounded-md border border-border text-sm text-morandi-primary">
              {airportCode}
            </div>
            <p className="text-xs text-morandi-secondary">
              選擇城市後自動帶入機場代碼，用於載入封面圖片庫
            </p>
          </div>
        )}

        {/* 旅遊日期 */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary flex items-center gap-1.5">
            <Calendar size={14} className="text-morandi-gold" />
            旅遊日期
          </Label>
          <Input
            value={data.travelDates}
            onChange={(e) => onChange({ travelDates: e.target.value })}
            placeholder="如：2024.10.15 - 2024.10.22"
            className="h-10"
          />
        </div>
      </div>

      {/* 分隔線 */}
      <div className="h-px bg-border" />

      {/* 封面圖片選擇 */}
      <div>
        <h4 className="text-sm font-semibold text-morandi-primary mb-3">封面圖片</h4>
        <AirportImageLibrary
          airportCode={airportCode}
          selectedImage={data.coverImage}
          onImageSelect={(url) => onChange({ coverImage: url })}
          onImageUpload={(url) => onChange({ coverImage: url })}
          position={data.coverImagePosition}
          onPositionChange={(pos) => onChange({ coverImagePosition: pos })}
        />
      </div>

      {/* 分隔線 */}
      <div className="h-px bg-border" />

      {/* 公司資訊 */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-semibold text-morandi-primary">公司資訊</h4>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary">緊急聯絡電話</Label>
          <Input
            value={data.emergencyContact}
            onChange={(e) => onChange({ emergencyContact: e.target.value })}
            placeholder="+886 2-2345-6789"
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary">緊急聯絡 Email</Label>
          <Input
            value={data.emergencyEmail}
            onChange={(e) => onChange({ emergencyEmail: e.target.value })}
            placeholder="service@corner.travel"
            className="h-10"
          />
        </div>
      </div>
    </div>
  )
}

// 總攬左頁編輯面板
function OverviewLeftEditor({
  data,
  onChange,
  itinerary,
  onItineraryChange,
}: {
  data: BrochureCoverData
  onChange: (data: Partial<BrochureCoverData>) => void
  itinerary?: Itinerary | null
  onItineraryChange?: (data: Partial<Itinerary>) => void
}) {
  // 使用 Partial 類型處理可能為空的資料
  const outboundFlight = itinerary?.outbound_flight || ({} as Record<string, string>)
  const returnFlight = itinerary?.return_flight || ({} as Record<string, string>)
  const meetingInfo = itinerary?.meeting_info || ({} as Record<string, string>)
  const leader = itinerary?.leader || ({} as Record<string, string>)

  const updateOutboundFlight = (field: string, value: string) => {
    onItineraryChange?.({
      outbound_flight: { ...(itinerary?.outbound_flight || {}), [field]: value },
    } as Partial<Itinerary>)
  }

  const updateReturnFlight = (field: string, value: string) => {
    onItineraryChange?.({
      return_flight: { ...(itinerary?.return_flight || {}), [field]: value },
    } as Partial<Itinerary>)
  }

  const updateMeetingInfo = (field: string, value: string) => {
    onItineraryChange?.({
      meeting_info: { ...(itinerary?.meeting_info || {}), [field]: value },
    } as Partial<Itinerary>)
  }

  const updateLeader = (field: string, value: string) => {
    onItineraryChange?.({
      leader: { ...(itinerary?.leader || {}), [field]: value },
    } as Partial<Itinerary>)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 總攬頁圖片 */}
      <div>
        <h4 className="text-sm font-semibold text-morandi-primary mb-3 flex items-center gap-1.5">
          <Image size={14} className="text-morandi-gold" />
          總攬頁圖片
        </h4>
        <AirportImageLibrary
          airportCode={data.airportCode}
          selectedImage={data.overviewImage || ''}
          onImageSelect={(url) => onChange({ overviewImage: url })}
          onImageUpload={(url) => onChange({ overviewImage: url })}
        />
      </div>

      {/* 分隔線 */}
      <div className="h-px bg-border" />

      {/* 航班資訊 */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-semibold text-morandi-primary flex items-center gap-1.5">
          <Plane size={14} className="text-morandi-gold" />
          航班資訊
        </h4>

        {/* 去程 */}
        <div className="bg-orange-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-orange-600">去程</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">航空公司</Label>
              <Input
                value={outboundFlight.airline || ''}
                onChange={(e) => updateOutboundFlight('airline', e.target.value)}
                placeholder="中華航空"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">航班號</Label>
              <Input
                value={outboundFlight.flightNumber || ''}
                onChange={(e) => updateOutboundFlight('flightNumber', e.target.value)}
                placeholder="CI116"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">出發時間</Label>
              <Input
                value={outboundFlight.departureTime || ''}
                onChange={(e) => updateOutboundFlight('departureTime', e.target.value)}
                placeholder="16:25"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">抵達時間</Label>
              <Input
                value={outboundFlight.arrivalTime || ''}
                onChange={(e) => updateOutboundFlight('arrivalTime', e.target.value)}
                placeholder="20:10"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">出發機場</Label>
              <Combobox
                value={outboundFlight.departureAirport || ''}
                onChange={(value) => updateOutboundFlight('departureAirport', value)}
                options={AIRPORT_OPTIONS}
                placeholder="選擇機場"
                showSearchIcon={false}
                showClearButton={false}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">抵達機場</Label>
              <Combobox
                value={outboundFlight.arrivalAirport || ''}
                onChange={(value) => updateOutboundFlight('arrivalAirport', value)}
                options={AIRPORT_OPTIONS}
                placeholder="選擇機場"
                showSearchIcon={false}
                showClearButton={false}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* 回程 */}
        <div className="bg-teal-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-teal-600">回程</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">航空公司</Label>
              <Input
                value={returnFlight.airline || ''}
                onChange={(e) => updateReturnFlight('airline', e.target.value)}
                placeholder="中華航空"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">航班號</Label>
              <Input
                value={returnFlight.flightNumber || ''}
                onChange={(e) => updateReturnFlight('flightNumber', e.target.value)}
                placeholder="CI117"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">出發時間</Label>
              <Input
                value={returnFlight.departureTime || ''}
                onChange={(e) => updateReturnFlight('departureTime', e.target.value)}
                placeholder="20:35"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">抵達時間</Label>
              <Input
                value={returnFlight.arrivalTime || ''}
                onChange={(e) => updateReturnFlight('arrivalTime', e.target.value)}
                placeholder="22:30"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">出發機場</Label>
              <Combobox
                value={returnFlight.departureAirport || ''}
                onChange={(value) => updateReturnFlight('departureAirport', value)}
                options={AIRPORT_OPTIONS}
                placeholder="選擇機場"
                showSearchIcon={false}
                showClearButton={false}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-morandi-secondary">抵達機場</Label>
              <Combobox
                value={returnFlight.arrivalAirport || ''}
                onChange={(value) => updateReturnFlight('arrivalAirport', value)}
                options={AIRPORT_OPTIONS}
                placeholder="選擇機場"
                showSearchIcon={false}
                showClearButton={false}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 分隔線 */}
      <div className="h-px bg-border" />

      {/* 集合資訊 */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-semibold text-morandi-primary flex items-center gap-1.5">
          <Users size={14} className="text-morandi-gold" />
          集合資訊
        </h4>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary">集合時間</Label>
          <Input
            value={meetingInfo.time || ''}
            onChange={(e) => updateMeetingInfo('time', e.target.value)}
            placeholder="2026/01/08 13:30"
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary">集合地點</Label>
          <Textarea
            value={meetingInfo.location || ''}
            onChange={(e) => updateMeetingInfo('location', e.target.value)}
            placeholder="桃園機場第二航廈"
            className="min-h-[60px]"
          />
        </div>
      </div>

      {/* 分隔線 */}
      <div className="h-px bg-border" />

      {/* 領隊資訊 */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-semibold text-morandi-primary flex items-center gap-1.5">
          <BadgeCheck size={14} className="text-morandi-gold" />
          領隊資訊
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-morandi-primary">領隊姓名</Label>
            <Input
              value={leader.name || ''}
              onChange={(e) => updateLeader('name', e.target.value)}
              placeholder="領隊"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-morandi-primary">聯絡電話</Label>
            <Input
              value={leader.domesticPhone || ''}
              onChange={(e) => updateLeader('domesticPhone', e.target.value)}
              placeholder="0955568111"
              className="h-10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 空白頁提示
function BlankPageEditor() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-morandi-secondary">
      <p className="text-sm">空白頁（封面背面）</p>
      <p className="text-xs mt-1">此頁無需編輯</p>
    </div>
  )
}

// 目錄頁提示
function ContentsEditor() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-morandi-secondary">
      <p className="text-sm">目錄頁</p>
      <p className="text-xs mt-1">目錄會根據行程自動生成</p>
    </div>
  )
}

// 預設編輯面板
function DefaultEditor({ pageLabel }: { pageLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-morandi-secondary">
      <p className="text-sm">{pageLabel}</p>
      <p className="text-xs mt-1">此頁內容從行程表自動帶入</p>
    </div>
  )
}

// 每日行程左頁編輯面板（含封面圖上傳）
function DayLeftEditor({
  dayIndex,
  data,
  itinerary,
  onItineraryChange,
}: {
  dayIndex: number
  data: BrochureCoverData
  itinerary?: Itinerary | null
  onItineraryChange?: (data: Partial<Itinerary>) => void
}) {
  const dailyItinerary = itinerary?.daily_itinerary || []
  const day = dailyItinerary[dayIndex]
  const dayNumber = dayIndex + 1

  // 取得當天封面圖（使用 images 陣列的第一張）
  const currentImage = day?.images?.[0]
    ? (typeof day.images[0] === 'string' ? day.images[0] : day.images[0].url)
    : ''

  // 更新當天封面圖
  const handleImageChange = (url: string) => {
    if (!onItineraryChange || !dailyItinerary.length) return

    // 複製 daily_itinerary 並更新指定天的 images
    const updatedDaily = dailyItinerary.map((d, idx) => {
      if (idx === dayIndex) {
        return {
          ...d,
          images: url ? [url] : [],
        }
      }
      return d
    })

    onItineraryChange({
      daily_itinerary: updatedDaily,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 標題 */}
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {String(dayNumber).padStart(2, '0')}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary">Day {dayNumber} 封面設定</h4>
          <p className="text-xs text-morandi-secondary">{day?.title || `第 ${dayNumber} 天`}</p>
        </div>
      </div>

      {/* 封面圖片選擇 */}
      <div>
        <h4 className="text-sm font-semibold text-morandi-primary mb-3 flex items-center gap-1.5">
          <Image size={14} className="text-morandi-gold" />
          當日封面圖片
        </h4>
        <p className="text-xs text-morandi-secondary mb-3">
          上傳或選擇圖片作為此天的封面（當行程少於 2 項時會顯示）
        </p>
        <AirportImageLibrary
          airportCode={data.airportCode}
          selectedImage={currentImage}
          onImageSelect={handleImageChange}
          onImageUpload={handleImageChange}
        />
      </div>

      {/* 提示 */}
      <div className="bg-slate-50 rounded-lg p-3">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          💡 提示：當天行程活動少於 2 項時，會自動切換為封面圖模式，顯示此處設定的圖片。
        </p>
      </div>
    </div>
  )
}

export function BrochureSidebar({ data, onChange, currentPageType, itinerary, onItineraryChange }: BrochureSidebarProps) {
  const renderEditor = () => {
    switch (currentPageType) {
      case 'cover':
        return <CoverEditor data={data} onChange={onChange} />
      case 'blank':
        return <BlankPageEditor />
      case 'contents':
        return <ContentsEditor />
      case 'overview-left':
        return (
          <OverviewLeftEditor
            data={data}
            onChange={onChange}
            itinerary={itinerary}
            onItineraryChange={onItineraryChange}
          />
        )
      case 'overview-right':
        return <DefaultEditor pageLabel="行程總攬（右）" />
      case 'accommodation':
        return <DefaultEditor pageLabel="住宿資訊" />
      default:
        if (currentPageType?.startsWith('day-')) {
          const match = currentPageType.match(/day-(\d+)-(left|right)/)
          if (match) {
            const dayNum = parseInt(match[1], 10)
            const side = match[2]
            if (side === 'left') {
              return (
                <DayLeftEditor
                  dayIndex={dayNum - 1}
                  data={data}
                  itinerary={itinerary}
                  onItineraryChange={onItineraryChange}
                />
              )
            }
            return <DefaultEditor pageLabel={`Day ${dayNum}（右）- 每日餐食`} />
          }
        }
        return <CoverEditor data={data} onChange={onChange} />
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto h-full">
      {renderEditor()}
    </div>
  )
}
