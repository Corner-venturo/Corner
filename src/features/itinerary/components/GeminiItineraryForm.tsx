'use client'

import React, { useEffect, useState } from 'react'
import { InputIME } from '@/components/ui/input-ime'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Sparkles, Loader2, ImageIcon } from 'lucide-react'
import { useRegionsStore } from '@/stores'
import { alert } from '@/lib/ui/alert-dialog'

// 型別定義
interface DailyScheduleItem {
  day: string
  route: string
  meals: { breakfast: string; lunch: string; dinner: string }
  accommodation: string
}

interface FlightOption {
  airline: string
  outbound: { code: string; from: string; fromCode: string; time: string; to: string; toCode: string; arrivalTime: string }
  return: { code: string; from: string; fromCode: string; time: string; to: string; toCode: string; arrivalTime: string }
}

interface HighlightSpot {
  name: string
  nameEn: string
  tags: string[]
  description: string
  imageUrl?: string
}

interface SightDetail {
  name: string
  nameEn: string
  description: string
  note?: string
  imageUrl?: string
}

export interface GeminiItineraryData {
  coverImage: string
  tagline: string
  taglineEn: string
  title: string
  subtitle: string
  price: string
  priceNote: string
  country: string
  city: string
  dailySchedule: DailyScheduleItem[]
  flightOptions: FlightOption[]
  highlightImages: string[]
  highlightSpots: HighlightSpot[]
  sights: SightDetail[]
}

interface GeminiItineraryFormProps {
  data: GeminiItineraryData
  onChange: (data: GeminiItineraryData) => void
}

export function GeminiItineraryForm({ data, onChange }: GeminiItineraryFormProps) {
  const { countries, cities, fetchCountries, fetchCitiesByCountry } = useRegionsStore()
  const [generatingDescription, setGeneratingDescription] = useState<number | null>(null)
  const [generatingSightDesc, setGeneratingSightDesc] = useState<number | null>(null)
  const [generatingImage, setGeneratingImage] = useState<string | null>(null)

  // 載入國家資料（只執行一次）
  useEffect(() => {
    if (countries.length === 0) {
      fetchCountries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 當國家改變時載入城市
  useEffect(() => {
    if (data.country && countries.length > 0) {
      const country = countries.find(c => c.name === data.country)
      if (country) {
        fetchCitiesByCountry(country.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.country])

  const updateField = <K extends keyof GeminiItineraryData>(field: K, value: GeminiItineraryData[K]) => {
    onChange({ ...data, [field]: value })
  }

  // 當選擇城市時（不自動設定封面圖，由 AI 生成）
  const handleCityChange = (cityName: string) => {
    updateField('city', cityName)
    // 不再自動抓資料庫封面，讓使用者用 AI 生成
  }

  // AI 生成景點描述（模擬，之後接 Gemini API）
  const handleGenerateSpotDescription = async (index: number) => {
    const spot = data.highlightSpots[index]
    if (!spot.name) return

    setGeneratingDescription(index)

    // TODO: 這裡之後會接 Gemini API
    // 目前先用模擬資料示範
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockDescriptions: Record<string, string> = {
      '清水寺': '清水寺是京都最具代表性的寺廟，建於 778 年，以懸空的木造舞台聞名。從這裡可以俯瞰京都市區的絕美景色，春天的櫻花和秋天的紅葉更是令人屏息。',
      '金閣寺': '金閣寺正式名稱為鹿苑寺，因其外牆貼滿金箔而得名。建築倒映在鏡湖池中的景象，是京都最經典的畫面之一。',
      '伏見稻荷大社': '以千本鳥居聞名於世，綿延數公里的橘紅色鳥居隧道，是攝影愛好者的朝聖地。這裡供奉著稻荷神，是日本全國稻荷神社的總本山。',
    }

    const description = mockDescriptions[spot.name] || `${spot.name}是${data.city}著名的觀光景點，融合了自然美景與文化特色，非常值得一遊。`

    const newSpots = [...data.highlightSpots]
    newSpots[index].description = description
    updateField('highlightSpots', newSpots)

    setGeneratingDescription(null)
  }

  // AI 生成景點介紹描述
  const handleGenerateSightDescription = async (index: number) => {
    const sight = data.sights[index]
    if (!sight.name) return

    setGeneratingSightDesc(index)

    // TODO: 這裡之後會接 Gemini API
    await new Promise(resolve => setTimeout(resolve, 1500))

    const description = `${sight.name}是${data.city}不可錯過的景點之一。這裡融合了傳統與現代的魅力，讓遊客能夠深入體驗當地的文化與風情。無論是建築特色、自然景觀，還是當地美食，都能讓人留下深刻的印象。建議預留充足的時間，細細品味這個地方的獨特之處。`

    const newSights = [...data.sights]
    newSights[index].description = description
    updateField('sights', newSights)

    setGeneratingSightDesc(null)
  }

  // AI 生成圖片 - 連接 Gemini API
  const handleGenerateImage = async (type: 'cover' | 'spot' | 'sight', index?: number) => {
    const key = type === 'cover' ? 'cover' : `${type}-${index}`
    setGeneratingImage(key)

    try {
      // 構建圖片生成的 prompt
      let prompt = ''
      let style = 'travel-cover'

      if (type === 'cover') {
        // 封面圖：城市全景風格
        prompt = `${data.country} ${data.city} cityscape, featuring famous landmarks and cultural elements, panoramic view, beautiful sky, travel destination photography`
        style = 'travel-cover'
      } else if (type === 'spot' && index !== undefined) {
        // 景點特色圖
        const spot = data.highlightSpots[index]
        prompt = `${spot.name} in ${data.city} ${data.country}, tourist attraction, beautiful scenery, travel photography`
        style = 'landmark'
      } else if (type === 'sight' && index !== undefined) {
        // 景點介紹圖
        const sight = data.sights[index]
        prompt = `${sight.name} in ${data.city} ${data.country}, detailed view, architectural details, cultural heritage, professional photography`
        style = 'landmark'
      }

      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio: type === 'cover' ? '16:9' : '4:3',
        }),
      })

      const result = await response.json()

      if (result.success && result.image) {
        if (type === 'cover') {
          updateField('coverImage', result.image)
        } else if (type === 'spot' && index !== undefined) {
          const newSpots = [...data.highlightSpots]
          newSpots[index].imageUrl = result.image
          updateField('highlightSpots', newSpots)
        } else if (type === 'sight' && index !== undefined) {
          const newSights = [...data.sights]
          newSights[index].imageUrl = result.image
          updateField('sights', newSights)
        }
      } else {
        console.error('Image generation failed:', result.error)
        void alert(`圖片生成失敗：${result.error || '未知錯誤'}`, 'error')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      void alert('圖片生成發生錯誤，請稍後再試', 'error')
    }

    setGeneratingImage(null)
  }

  return (
    <div className="space-y-6 p-6">
      {/* AI 功能提示 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
          <Sparkles size={18} />
          <span>Gemini AI 智慧助手</span>
        </div>
        <p className="text-sm text-blue-600">
          點擊 <Sparkles size={14} className="inline" /> 按鈕，AI 會自動幫你生成景點描述和插圖。
          目前為測試模式，之後會接上 Gemini Pro API。
        </p>
      </div>

      {/* 封面資訊 */}
      <section>
        <h3 className="text-base font-bold text-morandi-primary mb-3 pb-2 border-b border-morandi-container">
          封面資訊
        </h3>
        <div className="space-y-3">
          {/* 國家和城市選擇 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">國家</label>
              <select
                value={data.country}
                onChange={e => updateField('country', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md p-2 h-9 bg-white relative z-10"
              >
                <option value="">選擇國家</option>
                {countries
                  .filter(c => c.is_active)
                  .sort((a, b) => a.display_order - b.display_order)
                  .map(country => (
                    <option key={country.id} value={country.name}>
                      {country.emoji ? `${country.emoji} ` : ''}{country.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">城市</label>
              <select
                value={data.city}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md p-2 h-9 bg-white relative z-10"
                disabled={!data.country}
              >
                <option value="">選擇城市</option>
                {cities
                  .filter(c => {
                    const country = countries.find(co => co.name === data.country)
                    return country && c.country_id === country.id && c.is_active
                  })
                  .sort((a, b) => a.display_order - b.display_order)
                  .map(city => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 封面圖片 with AI 生成 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">封面圖片</label>
            <div className="flex gap-2">
              <InputIME
                value={data.coverImage}
                onChange={value => updateField('coverImage', value)}
                placeholder="圖片網址或點擊 AI 生成"
                className="flex-1 text-sm"
              />
              <Button
                onClick={() => handleGenerateImage('cover')}
                disabled={generatingImage === 'cover' || !data.city}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {generatingImage === 'cover' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ImageIcon size={14} />
                )}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">標題</label>
            <InputIME
              value={data.title}
              onChange={value => updateField('title', value)}
              placeholder="例如：越南峴港經典五日"
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">副標題 (詩意文案，用換行分隔)</label>
            <textarea
              value={data.subtitle}
              onChange={e => updateField('subtitle', e.target.value)}
              placeholder="第一行文案&#10;第二行文案"
              className="w-full text-sm border border-gray-300 rounded-md p-2 min-h-[60px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">價格 (不含NT$和起)</label>
              <InputIME
                value={data.price}
                onChange={value => updateField('price', value)}
                placeholder="35,500"
                className="w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">價格備註</label>
              <InputIME
                value={data.priceNote}
                onChange={value => updateField('priceNote', value)}
                placeholder="8人包團"
                className="w-full text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 每日行程 */}
      <section>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-morandi-container">
          <h3 className="text-base font-bold text-morandi-primary">每日行程</h3>
          <Button
            onClick={() => {
              updateField('dailySchedule', [
                ...data.dailySchedule,
                {
                  day: `D${data.dailySchedule.length + 1}`,
                  route: '',
                  meals: { breakfast: '', lunch: '', dinner: '' },
                  accommodation: '',
                },
              ])
            }}
            size="sm"
            className="h-7 text-xs bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            <Plus size={14} className="mr-1" />
            新增天數
          </Button>
        </div>
        <div className="space-y-3">
          {data.dailySchedule.map((day, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#F89520]">{day.day}</span>
                <Button
                  onClick={() => {
                    updateField(
                      'dailySchedule',
                      data.dailySchedule.filter((_, i) => i !== idx)
                    )
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
              <div className="space-y-2">
                <InputIME
                  value={day.route}
                  onChange={value => {
                    const newSchedule = [...data.dailySchedule]
                    newSchedule[idx].route = value
                    updateField('dailySchedule', newSchedule)
                  }}
                  placeholder="路線 (用 > 分隔景點)"
                  className="w-full text-xs"
                />
                <div className="grid grid-cols-3 gap-1">
                  <InputIME
                    value={day.meals.breakfast}
                    onChange={value => {
                      const newSchedule = [...data.dailySchedule]
                      newSchedule[idx].meals.breakfast = value
                      updateField('dailySchedule', newSchedule)
                    }}
                    placeholder="早餐"
                    className="text-xs h-8"
                  />
                  <InputIME
                    value={day.meals.lunch}
                    onChange={value => {
                      const newSchedule = [...data.dailySchedule]
                      newSchedule[idx].meals.lunch = value
                      updateField('dailySchedule', newSchedule)
                    }}
                    placeholder="午餐"
                    className="text-xs h-8"
                  />
                  <InputIME
                    value={day.meals.dinner}
                    onChange={value => {
                      const newSchedule = [...data.dailySchedule]
                      newSchedule[idx].meals.dinner = value
                      updateField('dailySchedule', newSchedule)
                    }}
                    placeholder="晚餐"
                    className="text-xs h-8"
                  />
                </div>
                <InputIME
                  value={day.accommodation}
                  onChange={value => {
                    const newSchedule = [...data.dailySchedule]
                    newSchedule[idx].accommodation = value
                    updateField('dailySchedule', newSchedule)
                  }}
                  placeholder="住宿飯店"
                  className="w-full text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 航班資訊 */}
      <section>
        <h3 className="text-base font-bold text-morandi-primary mb-3 pb-2 border-b border-morandi-container">
          參考航班
        </h3>
        <div className="space-y-4 text-xs">
          {data.flightOptions.map((option, idx) => (
            <div key={idx} className="bg-orange-50 p-3 rounded border border-orange-200">
              <div className="font-semibold text-gray-700 mb-2">{option.airline}</div>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <InputIME
                    value={option.outbound.code}
                    onChange={value => {
                      const newOptions = [...data.flightOptions]
                      newOptions[idx].outbound.code = value
                      updateField('flightOptions', newOptions)
                    }}
                    placeholder="航班號"
                    className="text-xs h-7"
                  />
                  <InputIME
                    value={option.outbound.time}
                    onChange={value => {
                      const newOptions = [...data.flightOptions]
                      newOptions[idx].outbound.time = value
                      updateField('flightOptions', newOptions)
                    }}
                    placeholder="出發"
                    className="text-xs h-7"
                  />
                  <InputIME
                    value={option.outbound.arrivalTime}
                    onChange={value => {
                      const newOptions = [...data.flightOptions]
                      newOptions[idx].outbound.arrivalTime = value
                      updateField('flightOptions', newOptions)
                    }}
                    placeholder="抵達"
                    className="text-xs h-7"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <InputIME
                    value={option.return.code}
                    onChange={value => {
                      const newOptions = [...data.flightOptions]
                      newOptions[idx].return.code = value
                      updateField('flightOptions', newOptions)
                    }}
                    placeholder="航班號"
                    className="text-xs h-7"
                  />
                  <InputIME
                    value={option.return.time}
                    onChange={value => {
                      const newOptions = [...data.flightOptions]
                      newOptions[idx].return.time = value
                      updateField('flightOptions', newOptions)
                    }}
                    placeholder="出發"
                    className="text-xs h-7"
                  />
                  <InputIME
                    value={option.return.arrivalTime}
                    onChange={value => {
                      const newOptions = [...data.flightOptions]
                      newOptions[idx].return.arrivalTime = value
                      updateField('flightOptions', newOptions)
                    }}
                    placeholder="抵達"
                    className="text-xs h-7"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 行程特色 with AI */}
      <section>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-morandi-container">
          <h3 className="text-base font-bold text-morandi-primary">行程特色</h3>
          <Button
            onClick={() => {
              updateField('highlightSpots', [
                ...data.highlightSpots,
                { name: '', nameEn: '', tags: ['特色景點'], description: '', imageUrl: '' },
              ])
            }}
            size="sm"
            className="h-7 text-xs bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            <Plus size={14} className="mr-1" />
            新增
          </Button>
        </div>
        <div className="space-y-3">
          {data.highlightSpots.map((spot, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <InputIME
                  value={spot.name}
                  onChange={value => {
                    const newSpots = [...data.highlightSpots]
                    newSpots[idx].name = value
                    updateField('highlightSpots', newSpots)
                  }}
                  placeholder="景點名稱"
                  className="flex-1 text-xs h-7 font-semibold"
                />
                <div className="flex gap-1 ml-2">
                  <Button
                    onClick={() => handleGenerateSpotDescription(idx)}
                    disabled={generatingDescription === idx || !spot.name}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="AI 生成描述"
                  >
                    {generatingDescription === idx ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleGenerateImage('spot', idx)}
                    disabled={generatingImage === `spot-${idx}` || !spot.name}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    title="AI 生成圖片"
                  >
                    {generatingImage === `spot-${idx}` ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ImageIcon size={12} />
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      updateField(
                        'highlightSpots',
                        data.highlightSpots.filter((_, i) => i !== idx)
                      )
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-red-600"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
              <InputIME
                value={spot.nameEn}
                onChange={value => {
                  const newSpots = [...data.highlightSpots]
                  newSpots[idx].nameEn = value
                  updateField('highlightSpots', newSpots)
                }}
                placeholder="英文名稱"
                className="w-full text-xs h-7 mb-2"
              />
              {spot.imageUrl && (
                <div className="mb-2">
                  <img src={spot.imageUrl} alt={spot.name} className="w-full h-24 object-cover rounded" />
                </div>
              )}
              <textarea
                value={spot.description}
                onChange={e => {
                  const newSpots = [...data.highlightSpots]
                  newSpots[idx].description = e.target.value
                  updateField('highlightSpots', newSpots)
                }}
                placeholder="景點描述（可點擊 AI 按鈕自動生成）"
                className="w-full text-xs border border-gray-300 rounded-md p-2 min-h-[50px]"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 景點介紹 with AI */}
      <section>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-morandi-container">
          <h3 className="text-base font-bold text-morandi-primary">景點介紹</h3>
          <Button
            onClick={() => {
              updateField('sights', [
                ...data.sights,
                { name: '', nameEn: '', description: '', imageUrl: '' },
              ])
            }}
            size="sm"
            className="h-7 text-xs bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            <Plus size={14} className="mr-1" />
            新增
          </Button>
        </div>
        <div className="space-y-3">
          {data.sights.map((sight, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <InputIME
                  value={sight.name}
                  onChange={value => {
                    const newSights = [...data.sights]
                    newSights[idx].name = value
                    updateField('sights', newSights)
                  }}
                  placeholder="景點名稱"
                  className="flex-1 text-xs h-7 font-semibold"
                />
                <div className="flex gap-1 ml-2">
                  <Button
                    onClick={() => handleGenerateSightDescription(idx)}
                    disabled={generatingSightDesc === idx || !sight.name}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="AI 生成描述"
                  >
                    {generatingSightDesc === idx ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleGenerateImage('sight', idx)}
                    disabled={generatingImage === `sight-${idx}` || !sight.name}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    title="AI 生成圖片"
                  >
                    {generatingImage === `sight-${idx}` ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ImageIcon size={12} />
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      updateField(
                        'sights',
                        data.sights.filter((_, i) => i !== idx)
                      )
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-red-600"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
              <InputIME
                value={sight.nameEn}
                onChange={value => {
                  const newSights = [...data.sights]
                  newSights[idx].nameEn = value
                  updateField('sights', newSights)
                }}
                placeholder="英文名稱"
                className="w-full text-xs h-7 mb-2"
              />
              {sight.imageUrl && (
                <div className="mb-2">
                  <img src={sight.imageUrl} alt={sight.name} className="w-full h-32 object-cover rounded" />
                </div>
              )}
              <textarea
                value={sight.description}
                onChange={e => {
                  const newSights = [...data.sights]
                  newSights[idx].description = e.target.value
                  updateField('sights', newSights)
                }}
                placeholder="詳細描述（可點擊 AI 按鈕自動生成）"
                className="w-full text-xs border border-gray-300 rounded-md p-2 min-h-[60px]"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
