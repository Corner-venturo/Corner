'use client';

import { useState, useEffect } from 'react';
import { Cloud, Calendar, Thermometer, Droplets, Wind, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  date: string;
}

interface City {
  name: string;
  lat: number;
  lon: number;
}

const STORAGE_KEY = 'weather-widget-city';

// 全球主要城市座標
const CITIES: City[] = [
  // 台灣
  { name: '台北', lat: 25.0330, lon: 121.5654 },
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
  { name: '首爾', lat: 37.5665, lon: 126.9780 },
  { name: '釜山', lat: 35.1796, lon: 129.0756 },
  { name: '濟州', lat: 33.4996, lon: 126.5312 },

  // 中國
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '香港', lat: 22.3193, lon: 114.1694 },
  { name: '澳門', lat: 22.1987, lon: 113.5439 },

  // 東南亞
  { name: '新加坡', lat: 1.3521, lon: 103.8198 },
  { name: '吉隆坡', lat: 3.1390, lon: 101.6869 },
  { name: '河內', lat: 21.0285, lon: 105.8542 },
  { name: '胡志明市', lat: 10.8231, lon: 106.6297 },
  { name: '雅加達', lat: -6.2088, lon: 106.8456 },
  { name: '馬尼拉', lat: 14.5995, lon: 120.9842 },

  // 其他亞洲
  { name: '峇里島', lat: -8.3405, lon: 115.0920 },
  { name: '吳哥窟', lat: 13.4125, lon: 103.8670 },

  // 歐美（常見旅遊地）
  { name: '倫敦', lat: 51.5074, lon: -0.1278 },
  { name: '巴黎', lat: 48.8566, lon: 2.3522 },
  { name: '紐約', lat: 40.7128, lon: -74.0060 },
  { name: '洛杉磯', lat: 34.0522, lon: -118.2437 },
];

// Open-Meteo 天氣代碼對應
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
};

export function WeatherWidget() {
  // 載入儲存的城市
  const loadSavedCity = (): City => {
    if (typeof window === 'undefined') return CITIES[0];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return CITIES[0]; // 預設台北
  };

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [mode, setMode] = useState<'future' | 'past'>('future');
  const [selectedCity, setSelectedCity] = useState<City>(loadSavedCity);

  // 儲存城市選擇到 localStorage
  const saveCity = (city: City) => {
    setSelectedCity(city);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
    }
  };

  // 獲取天氣資料
  const fetchWeather = async (date: string, isPast: boolean, city: City) => {
    setLoading(true);
    setError(null);

    try {
      const { lat, lon } = city;

      let url: string;
      if (isPast) {
        // 歷史天氣 API
        url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_max,windspeed_10m_max&timezone=Asia/Taipei`;
      } else {
        // 未來天氣預報 API
        url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_max,windspeed_10m_max&timezone=Asia/Taipei&forecast_days=16`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!data.daily) {
        throw new Error('無法取得天氣資料');
      }

      let index = 0;
      if (!isPast) {
        // 找到對應日期的索引
        index = data.daily.time.findIndex((t: string) => t === date);
        if (index === -1) {
          throw new Error('所選日期超出預報範圍');
        }
      }

      const maxTemp = data.daily.temperature_2m_max[index];
      const minTemp = data.daily.temperature_2m_min[index];
      const avgTemp = (maxTemp + minTemp) / 2;

      setWeather({
        temperature: Math.round(avgTemp * 10) / 10,
        humidity: data.daily.relative_humidity_2m_max[index] || 0,
        windSpeed: data.daily.windspeed_10m_max[index] || 0,
        weatherCode: data.daily.weathercode[index] || 0,
        date: data.daily.time[index],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取天氣資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入今天的天氣
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchWeather(today, false, selectedCity);
  }, []);

  // 當選擇日期時重新載入
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    const today = new Date().toISOString().split('T')[0];
    const isPast = date < today;
    setMode(isPast ? 'past' : 'future');
    fetchWeather(date, isPast, selectedCity);
  };

  // 當選擇城市時重新載入
  const handleCityChange = (cityName: string) => {
    const city = CITIES.find(c => c.name === cityName);
    if (city) {
      saveCity(city);
      if (selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        const isPast = selectedDate < today;
        fetchWeather(selectedDate, isPast, city);
      }
    }
  };

  const weatherInfo = weather ? WEATHER_DESCRIPTIONS[weather.weatherCode] || WEATHER_DESCRIPTIONS[0] : null;

  // 生成日期範圍（過去5年到未來16天）
  const getDateRange = () => {
    const dates = [];
    const today = new Date();

    // 過去5年（用於查詢歷史天氣）
    for (let i = 1825; i > 0; i--) { // 5年 * 365天
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // 今天和未來16天
    for (let i = 0; i <= 16; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 5); // 往前5年
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 16); // 往後16天

  return (
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-white/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-white/80',
          'bg-gradient-to-br from-sky-50 via-white to-blue-50'
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br from-sky-200/60 to-blue-100/60',
                'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
              )}
            >
              <Cloud className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">天氣查詢</p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                查看過去5年歷史天氣或未來16天預報
              </p>
            </div>
          </div>

          {/* City and Date Selection - 左右並排 */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40">
            <div className="grid grid-cols-2 gap-3">
              {/* City Selection */}
              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  選擇城市
                </label>
                <select
                  value={selectedCity.name}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20 transition-all outline-none shadow-sm backdrop-blur-sm"
                >
                  {CITIES.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  選擇日期
                  {selectedDate && (
                    <span className="text-morandi-secondary/70 font-normal text-[10px]">
                      ({selectedDate === today ? '今天' : selectedDate < today ? '過去' : '未來'})
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={minDate.toISOString().split('T')[0]}
                  max={maxDate.toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20 transition-all outline-none shadow-sm backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* Weather Display */}
          {loading ? (
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
            <div className="flex-1 space-y-3">
              {/* Weather Details - 響應式佈局 */}
              <div className="rounded-xl bg-white/70 p-4 sm:p-5 shadow-md border border-white/40">
                {/* 桌面版：橫排 */}
                <div className="hidden sm:flex items-center justify-around gap-2 md:gap-3">
                  {/* Weather Icon & Description */}
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="text-4xl md:text-5xl flex-shrink-0">{weatherInfo.icon}</div>
                    <div className="min-w-0">
                      <p className="text-base md:text-lg font-bold text-morandi-primary truncate">{weatherInfo.label}</p>
                      <p className="text-xs text-morandi-secondary">
                        {mode === 'past' ? '歷史' : '預報'}
                      </p>
                    </div>
                  </div>

                  <div className="w-px h-14 bg-morandi-gold/20 flex-shrink-0 hidden md:block"></div>

                  {/* Temperature */}
                  <div className="text-center flex-shrink-0 min-w-[60px] md:min-w-[70px]">
                    <Thermometer className="w-4 h-4 md:w-5 md:h-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-[10px] md:text-xs text-morandi-secondary mb-0.5">溫度</p>
                    <p className="text-base md:text-lg font-bold text-morandi-primary">{weather.temperature}°C</p>
                  </div>

                  <div className="w-px h-14 bg-morandi-gold/20 flex-shrink-0 hidden md:block"></div>

                  {/* Humidity */}
                  <div className="text-center flex-shrink-0 min-w-[60px] md:min-w-[70px]">
                    <Droplets className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-[10px] md:text-xs text-morandi-secondary mb-0.5">濕度</p>
                    <p className="text-base md:text-lg font-bold text-morandi-primary">{weather.humidity}%</p>
                  </div>

                  <div className="w-px h-14 bg-morandi-gold/20 flex-shrink-0 hidden md:block"></div>

                  {/* Wind Speed */}
                  <div className="text-center flex-shrink-0 min-w-[60px] md:min-w-[70px]">
                    <Wind className="w-4 h-4 md:w-5 md:h-5 text-teal-400 mx-auto mb-1" />
                    <p className="text-[10px] md:text-xs text-morandi-secondary mb-0.5">風速</p>
                    <p className="text-sm md:text-base font-bold text-morandi-primary">{weather.windSpeed}</p>
                    <p className="text-[9px] md:text-[10px] text-morandi-secondary/70">km/h</p>
                  </div>
                </div>

                {/* 手機版：直排 */}
                <div className="sm:hidden space-y-3">
                  {/* Weather Icon & Description */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-6xl">{weatherInfo.icon}</div>
                    <div>
                      <p className="text-xl font-bold text-morandi-primary">{weatherInfo.label}</p>
                      <p className="text-sm text-morandi-secondary">
                        {mode === 'past' ? '歷史紀錄' : '天氣預報'}
                      </p>
                    </div>
                  </div>

                  {/* Data Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-white/50">
                      <Thermometer className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                      <p className="text-xs text-morandi-secondary mb-1">溫度</p>
                      <p className="text-xl font-bold text-morandi-primary">{weather.temperature}°C</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/50">
                      <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-xs text-morandi-secondary mb-1">濕度</p>
                      <p className="text-xl font-bold text-morandi-primary">{weather.humidity}%</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/50">
                      <Wind className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                      <p className="text-xs text-morandi-secondary mb-1">風速</p>
                      <p className="text-lg font-bold text-morandi-primary">{weather.windSpeed}</p>
                      <p className="text-[10px] text-morandi-secondary/70">km/h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
