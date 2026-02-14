'use client'

import { getTodayString, formatDate } from '@/lib/utils/format-date'

import { useState, useEffect } from 'react'
import { Cloud, MapPin, Loader2, AlertCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DASHBOARD_LABELS } from './constants/labels'

interface DailyWeather {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
}

interface City {
  name: string
  lat: number
  lon: number
}

const STORAGE_KEY = 'weather-widget-weekly-city'
const STORAGE_DATE_KEY = 'weather-widget-weekly-date'

// 全球主要城市座標
const CITIES: City[] = [
  // 台灣
  { name: '台北', lat: 25.033, lon: 121.5654 },
  { name: '台中', lat: 24.1477, lon: 120.6736 },
  { name: '台南', lat: 22.9998, lon: 120.2269 },
  { name: '高雄', lat: 22.6273, lon: 120.3014 },

  // 泰國
  { name: '清邁', lat: 18.7883, lon: 98.9853 },
  { name: '曼谷', lat: 13.7563, lon: 100.5018 },
  { name: '普吉', lat: 7.8804, lon: 98.3923 },

  // 日本
  { name: '東京', lat: 35.6762, lon: 139.6503 },
  { name: '大阪', lat: 34.6937, lon: 135.5023 },
  { name: '京都', lat: 35.0116, lon: 135.7681 },
  { name: '福岡', lat: 33.5904, lon: 130.4017 },
  { name: '沖繩', lat: 26.2124, lon: 127.6809 },

  // 韓國
  { name: '首爾', lat: 37.5665, lon: 126.978 },
  { name: '釜山', lat: 35.1796, lon: 129.0756 },
  { name: '濟州', lat: 33.4996, lon: 126.5312 },

  // 中國
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '香港', lat: 22.3193, lon: 114.1694 },
  { name: '澳門', lat: 22.1987, lon: 113.5439 },

  // 東南亞
  { name: '新加坡', lat: 1.3521, lon: 103.8198 },
  { name: '吉隆坡', lat: 3.139, lon: 101.6869 },
  { name: '河內', lat: 21.0285, lon: 105.8542 },
  { name: '胡志明市', lat: 10.8231, lon: 106.6297 },
  { name: '雅加達', lat: -6.2088, lon: 106.8456 },
  { name: '馬尼拉', lat: 14.5995, lon: 120.9842 },

  // 其他亞洲
  { name: '峇里島', lat: -8.3405, lon: 115.092 },
  { name: '吳哥窟', lat: 13.4125, lon: 103.867 },

  // 歐美（常見旅遊地）
  { name: '倫敦', lat: 51.5074, lon: -0.1278 },
  { name: '巴黎', lat: 48.8566, lon: 2.3522 },
  { name: '紐約', lat: 40.7128, lon: -74.006 },
  { name: '洛杉磯', lat: 34.0522, lon: -118.2437 },
]

// Open-Meteo 天氣代碼對應
const WEATHER_DESCRIPTIONS: Record<number, { label: string; icon: string }> = {
  0: { label: '晴', icon: '☀️' },
  1: { label: '晴', icon: '🌤️' },
  2: { label: '雲', icon: '⛅' },
  3: { label: '陰', icon: '☁️' },
  45: { label: '霧', icon: '🌫️' },
  48: { label: '霧', icon: '🌫️' },
  51: { label: '雨', icon: '🌦️' },
  53: { label: '雨', icon: '🌧️' },
  55: { label: '雨', icon: '🌧️' },
  61: { label: '雨', icon: '🌦️' },
  63: { label: '雨', icon: '🌧️' },
  65: { label: '雨', icon: '⛈️' },
  71: { label: '雪', icon: '🌨️' },
  73: { label: '雪', icon: '❄️' },
  75: { label: '雪', icon: '❄️' },
  80: { label: '雨', icon: '🌦️' },
  81: { label: '雨', icon: '⛈️' },
  82: { label: '雨', icon: '⛈️' },
  95: { label: '雷', icon: '⛈️' },
  96: { label: '雷', icon: '⛈️' },
  99: { label: '雷', icon: '⛈️' },
}

export function WeatherWidgetWeekly() {
  const loadSavedCity = (): City => {
    if (typeof window === 'undefined') return CITIES[0]
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
    return CITIES[0]
  }

  const loadSavedDate = (): string => {
    if (typeof window === 'undefined') return getTodayString()
    const saved = localStorage.getItem(STORAGE_DATE_KEY)
    return saved || getTodayString()
  }

  const [weeklyWeather, setWeeklyWeather] = useState<DailyWeather[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<City>(loadSavedCity)
  const [startDate, setStartDate] = useState<string>(loadSavedDate)

  const saveCity = (city: City) => {
    setSelectedCity(city)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(city))
    }
  }

  const saveDate = (date: string) => {
    setStartDate(date)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_DATE_KEY, date)
    }
  }

  // 獲取7天天氣
  const fetchWeeklyWeather = async (city: City, startDate: string) => {
    setLoading(true)
    setError(null)

    try {
      const { lat, lon } = city

      // 計算結束日期（開始日期 + 6天）
      const start = new Date(startDate)
      const end = new Date(startDate)
      end.setDate(end.getDate() + 6)

      const endDate = formatDate(end)

      // 使用預報 API（支援未來16天）
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia/Taipei&forecast_days=16`

      const response = await fetch(url)
      const data = await response.json()

      if (!data.daily) {
        throw new Error('無法取得天氣資料')
      }

      // 找到開始日期的索引
      const startIndex = data.daily.time.findIndex((t: string) => t === startDate)
      if (startIndex === -1) {
        throw new Error('所選日期超出預報範圍')
      }

      // 提取7天的資料
      const weekData: DailyWeather[] = []
      for (let i = 0; i < 7; i++) {
        const index = startIndex + i
        if (index < data.daily.time.length) {
          weekData.push({
            date: data.daily.time[index],
            maxTemp: Math.round(data.daily.temperature_2m_max[index]),
            minTemp: Math.round(data.daily.temperature_2m_min[index]),
            weatherCode: data.daily.weathercode[index] || 0,
          })
        }
      }

      setWeeklyWeather(weekData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取天氣資料失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeeklyWeather(selectedCity, startDate)
  }, [])

  const handleCityChange = (cityName: string) => {
    const city = CITIES.find(c => c.name === cityName)
    if (city) {
      saveCity(city)
      fetchWeeklyWeather(city, startDate)
    }
  }

  const handleDateChange = (date: string) => {
    saveDate(date)
    fetchWeeklyWeather(selectedCity, date)
  }

  // 格式化日期顯示
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dateOnly = dateStr
    const todayStr = formatDate(today)
    const tomorrowStr = formatDate(tomorrow)

    if (dateOnly === todayStr) return '今天'
    if (dateOnly === tomorrowStr) return '明天'

    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]

    return `${month}/${day} (${weekday})`
  }

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 9) // 最多往後10天（因為要顯示7天）

  return (
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-border/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:border-border/80',
          'bg-gradient-to-br from-status-info-bg via-card to-morandi-gold/5'
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br from-morandi-gold/10 to-status-info-bg',
                'ring-2 ring-border/50 ring-offset-1 ring-offset-background/20'
              )}
            >
              <Cloud className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                {DASHBOARD_LABELS.LABEL_6674}
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                {DASHBOARD_LABELS.LABEL_9804}
              </p>
            </div>
          </div>

          {/* 城市和日期選擇 */}
          <div className="rounded-xl bg-card/70 p-3.5 shadow-md border border-border/40">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {DASHBOARD_LABELS.LABEL_5461}
                </label>
                <Select value={selectedCity.name} onValueChange={handleCityChange}>
                  <SelectTrigger className="w-full px-3 py-2.5 text-sm font-medium border border-border/60 rounded-xl bg-card/90 hover:bg-card focus:bg-card transition-all outline-none shadow-sm backdrop-blur-sm">
                    <SelectValue placeholder={DASHBOARD_LABELS.SELECT_240} />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(city => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {DASHBOARD_LABELS.LABEL_4743}
                </label>
                <DatePicker
                  value={startDate}
                  onChange={(date) => handleDateChange(date)}
                  minDate={new Date()}
                  maxDate={maxDate}
                  placeholder={DASHBOARD_LABELS.SELECT_5234}
                  className="w-full px-3 py-2.5 text-sm font-medium border border-border/60 rounded-xl bg-card/90 hover:bg-card focus:bg-card transition-all outline-none shadow-sm backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* 天氣顯示 */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center rounded-xl bg-card/70 p-6 shadow-md border border-border/40">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-status-info mx-auto mb-2" />
                <p className="text-xs text-morandi-secondary">{DASHBOARD_LABELS.LOADING_6912}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center rounded-xl bg-card/70 p-6 shadow-md border border-border/40">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-morandi-red mx-auto mb-2" />
                <p className="text-xs text-morandi-secondary">{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-7 gap-2 h-full">
                {weeklyWeather.map((day, index) => {
                  const weatherInfo =
                    WEATHER_DESCRIPTIONS[day.weatherCode] || WEATHER_DESCRIPTIONS[0]
                  const isToday = day.date === getTodayString()

                  return (
                    <div
                      key={day.date}
                      className={cn(
                        'rounded-xl p-3 shadow-md border transition-all',
                        isToday
                          ? 'bg-gradient-to-br from-status-info-bg to-morandi-gold/5 border-status-info/30'
                          : 'bg-card/70 border-border/40 hover:bg-card/90'
                      )}
                    >
                      <div className="flex flex-col items-center justify-between h-full space-y-2">
                        {/* 日期 */}
                        <div className="text-center">
                          <p
                            className={cn(
                              'text-xs font-semibold',
                              isToday ? 'text-status-info' : 'text-morandi-primary'
                            )}
                          >
                            {formatDateLabel(day.date)}
                          </p>
                        </div>

                        {/* 天氣圖標 */}
                        <div className="text-3xl">{weatherInfo.icon}</div>

                        {/* 天氣描述 */}
                        <div className="text-center">
                          <p className="text-xs text-morandi-secondary font-medium">
                            {weatherInfo.label}
                          </p>
                        </div>

                        {/* 溫度 */}
                        <div className="text-center">
                          <p className="text-lg font-bold text-morandi-primary">{day.maxTemp}°</p>
                          <p className="text-xs text-morandi-secondary">{day.minTemp}°</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
