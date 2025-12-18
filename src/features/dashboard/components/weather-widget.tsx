'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Cloud,
  Calendar,
  Thermometer,
  Droplets,
  Wind,
  Loader2,
  AlertCircle,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWeatherAction } from '../actions/weather-actions'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  date: string
}

interface City {
  name: string
  lat: number
  lon: number
}

const STORAGE_KEY = 'weather-widget-city'

// Global city coordinates
const CITIES: City[] = [
  // Taiwan
  { name: '台北', lat: 25.033, lon: 121.5654 },
  { name: '台中', lat: 24.1477, lon: 120.6736 },
  { name: '高雄', lat: 22.6273, lon: 120.3014 },
  // Japan
  { name: '東京', lat: 35.6762, lon: 139.6503 },
  { name: '大阪', lat: 34.6937, lon: 135.5023 },
  { name: '沖繩', lat: 26.2124, lon: 127.6809 },
  // ... more cities can be added
]

const WEATHER_DESCRIPTIONS: Record<number, { label: string; icon: string }> = {
  0: { label: '晴朗', icon: '☀️' },
  1: { label: '大致晴朗', icon: '🌤️' },
  2: { label: '部分多雲', icon: '⛅' },
  3: { label: '陰天', icon: '☁️' },
  45: { label: '霧', icon: '🌫️' },
  48: { label: '霧淞', icon: '🌫️' },
  51: { label: '小雨', icon: '🌦️' },
  53: { label: '中雨', icon: '🌧️' },
  55: { label: '大雨', icon: '🌧️' },
  61: { label: '小陣雨', icon: '🌦️' },
  63: { label: '中陣雨', icon: '🌧️' },
  65: { label: '大陣雨', icon: '⛈️' },
  71: { label: '小雪', icon: '🌨️' },
  73: { label: '中雪', icon: '❄️' },
  75: { label: '大雪', icon: '❄️' },
  80: { label: '陣雨', icon: '🌦️' },
  81: { label: '強陣雨', icon: '⛈️' },
  82: { label: '暴雨', icon: '⛈️' },
  95: { label: '雷雨', icon: '⛈️' },
  96: { label: '雷雨冰雹', icon: '⛈️' },
  99: { label: '強雷雨冰雹', icon: '⛈️' },
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0])
  const [isPending, startTransition] = useTransition()

  const handleFetchWeather = (date: string, city: City) => {
    const isPast = date < new Date().toISOString().split('T')[0]
    startTransition(async () => {
      setError(null)
      const result = await getWeatherAction(date, isPast, city)
      if (result.error) {
        setError(result.error)
        setWeather(null)
      } else {
        setWeather(result.data ?? null)
      }
    })
  }

  useEffect(() => {
    const savedCity = localStorage.getItem(STORAGE_KEY)
    const city = savedCity ? JSON.parse(savedCity) : CITIES[0]
    setSelectedCity(city)
    handleFetchWeather(selectedDate, city)
  }, [])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    handleFetchWeather(date, selectedCity)
  }

  const handleCityChange = (cityName: string) => {
    const city = CITIES.find(c => c.name === cityName)
    if (city) {
      setSelectedCity(city)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(city))
      handleFetchWeather(selectedDate, city)
    }
  }

  const weatherInfo = weather ? WEATHER_DESCRIPTIONS[weather.weatherCode] || WEATHER_DESCRIPTIONS[0] : null
  const today = new Date().toISOString().split('T')[0]
  const minDate = new Date()
  minDate.setFullYear(minDate.getFullYear() - 5)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 16)

  return (
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-white/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-white/80',
          'bg-gradient-to-br from-sky-50 via-white to-blue-50'
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          <div className="flex items-start gap-3">
            <div className={cn('rounded-full p-2.5 text-white shadow-lg shadow-black/10', 'bg-gradient-to-br from-sky-200/60 to-blue-100/60', 'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20')}>
              <Cloud className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">天氣查詢</p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">查詢歷史或預報天氣</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />選擇城市</label>
                <Select value={selectedCity.name} onValueChange={handleCityChange}>
                  <SelectTrigger className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm">
                    <SelectValue placeholder="選擇城市" />
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
                <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />選擇日期</label>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => handleDateChange(date)}
                  minDate={minDate.toISOString().split('T')[0]}
                  maxDate={maxDate.toISOString().split('T')[0]}
                  placeholder="選擇日期"
                  className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {isPending ? (
            <div className="flex-1 flex items-center justify-center rounded-xl bg-white/70 p-6 shadow-md border border-white/40">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto mb-2" />
                <p className="text-xs text-morandi-secondary">載入中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center rounded-xl bg-white/70 p-6 shadow-md border border-white/40">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-morandi-secondary">{error}</p>
              </div>
            </div>
          ) : weather && weatherInfo ? (
            <div className="flex-1 flex items-center justify-center rounded-xl bg-white/70 p-4 sm:p-5 shadow-md border border-white/40">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-5xl md:text-6xl flex-shrink-0">{weatherInfo.icon}</div>
                <div className="min-w-0">
                  <p className="text-lg md:text-xl font-bold text-morandi-primary truncate">{weatherInfo.label}</p>
                  <p className="text-3xl md:text-4xl font-bold text-morandi-primary mt-1">{weather.temperature}°C</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-morandi-secondary">
                    <span><Droplets className="inline w-3 h-3 mr-1" />{weather.humidity}%</span>
                    <span><Wind className="inline w-3 h-3 mr-1" />{weather.windSpeed} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
