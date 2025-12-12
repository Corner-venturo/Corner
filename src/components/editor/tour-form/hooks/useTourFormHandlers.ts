import { TourFormData, Activity } from '../types'
import { cityImages, timezoneOffset } from '../constants'
import { calculateFlightDuration } from '../utils'
import { useRegionsStore } from '@/stores'

export function useTourFormHandlers(
  data: TourFormData,
  onChange: (data: TourFormData) => void,
  selectedCountry: string
) {
  const { cities } = useRegionsStore()

  const updateField = (field: string, value: unknown) => {
    onChange({ ...data, [field]: value })
  }

  // 更新城市時自動設定封面圖片（從 Supabase 取得）
  const updateCity = (city: string) => {
    // 從資料庫找城市資料
    const cityData = cities.find((c) => c.name === city)

    // 預設為空，讓系統從城市資料庫抓取
    let coverImage = ''

    if (cityData) {
      // 如果有主要圖片（primary_image = 1 用 background_image_url，= 2 用 background_image_url_2）
      if (cityData.primary_image === 2 && cityData.background_image_url_2) {
        coverImage = cityData.background_image_url_2
      } else if (cityData.background_image_url) {
        coverImage = cityData.background_image_url
      }
    }

    // 如果資料庫沒有圖片，退回到 cityImages 常數
    if (!coverImage && cityImages[city]) {
      coverImage = cityImages[city]
    }

    // 如果城市沒有圖片，保留現有圖片
    if (!coverImage) {
      coverImage = data.coverImage || ''
    }

    onChange({
      ...data,
      city,
      coverImage,
    })
  }

  const updateNestedField = (parent: string, field: string, value: unknown) => {
    const parentData = data[parent as keyof TourFormData]
    onChange({
      ...data,
      [parent]: { ...(typeof parentData === 'object' ? parentData : {}), [field]: value },
    })
  }

  // 航班資訊更新（自動計算飛行時間）
  const updateFlightField = (
    flightType: 'outboundFlight' | 'returnFlight',
    field: string,
    value: string
  ) => {
    const updatedFlight = { ...data[flightType], [field]: value }

    // 自動計算飛行時間
    const baseTimeDiff = timezoneOffset[selectedCountry] || 0
    // 回程時差方向相反（從目的地飛回台灣，要減去時差）
    const timeDiff = flightType === 'returnFlight' ? -baseTimeDiff : baseTimeDiff
    if (field === 'departureTime' || field === 'arrivalTime') {
      const depTime = field === 'departureTime' ? value : updatedFlight.departureTime
      const arrTime = field === 'arrivalTime' ? value : updatedFlight.arrivalTime
      updatedFlight.duration = calculateFlightDuration(depTime, arrTime, timeDiff)
    }

    onChange({
      ...data,
      [flightType]: updatedFlight,
    })
  }

  // 航班資訊批次更新（用於 API 查詢後一次更新多個欄位）
  const updateFlightFields = (
    flightType: 'outboundFlight' | 'returnFlight',
    fields: Record<string, string>
  ) => {
    const updatedFlight = { ...data[flightType], ...fields }

    onChange({
      ...data,
      [flightType]: updatedFlight,
    })
  }

  // 特色管理
  const addFeature = () => {
    onChange({
      ...data,
      features: [...(data.features || []), { icon: 'IconSparkles', title: '', description: '' }],
    })
  }

  const updateFeature = (index: number, field: string, value: string | string[]) => {
    const newFeatures = [...data.features]
    newFeatures[index] = { ...newFeatures[index], [field]: value }
    onChange({ ...data, features: newFeatures })
  }

  const removeFeature = (index: number) => {
    const newFeatures = data.features.filter((_: unknown, i: number) => i !== index)
    onChange({ ...data, features: newFeatures })
  }

  const reorderFeature = (fromIndex: number, toIndex: number) => {
    const newFeatures = [...data.features]
    const [movedFeature] = newFeatures.splice(fromIndex, 1)
    newFeatures.splice(toIndex, 0, movedFeature)
    onChange({ ...data, features: newFeatures })
  }

  // 景點管理
  const addFocusCard = () => {
    onChange({
      ...data,
      focusCards: [...(data.focusCards || []), { title: '', src: '' }],
    })
  }

  const updateFocusCard = (index: number, field: string, value: string) => {
    const newCards = [...data.focusCards]
    newCards[index] = { ...newCards[index], [field]: value }
    onChange({ ...data, focusCards: newCards })
  }

  const removeFocusCard = (index: number) => {
    const newCards = data.focusCards.filter((_: unknown, i: number) => i !== index)
    onChange({ ...data, focusCards: newCards })
  }

  // 逐日行程管理
  const addDailyItinerary = () => {
    onChange({
      ...data,
      dailyItinerary: [
        ...(data.dailyItinerary || []),
        {
          dayLabel: `Day ${(data.dailyItinerary?.length || 0) + 1}`,
          date: '',
          title: '',
          highlight: '',
          description: '',
          activities: [],
          recommendations: [],
          meals: { breakfast: '', lunch: '', dinner: '' },
          accommodation: '',
          images: [],
        },
      ],
    })
  }

  const updateDailyItinerary = (index: number, field: string, value: unknown) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[index] = { ...newItinerary[index], [field]: value }
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  const removeDailyItinerary = (index: number) => {
    // 輔助函數：計算日期（根據出發日期和天數）
    const calculateDate = (baseDate: string, dayOffset: number): string => {
      if (!baseDate) return ''
      try {
        // 解析出發日期（支援 YYYY/MM/DD 格式）
        const [year, month, day] = baseDate.split('/').map(Number)
        const date = new Date(year, month - 1, day)

        // 加上天數偏移
        date.setDate(date.getDate() + dayOffset)

        // 格式化為 YYYY/MM/DD
        const newYear = date.getFullYear()
        const newMonth = String(date.getMonth() + 1).padStart(2, '0')
        const newDay = String(date.getDate()).padStart(2, '0')

        return `${newYear}/${newMonth}/${newDay}`
      } catch {
        return ''
      }
    }

    const newItinerary = data.dailyItinerary
      .filter((_: unknown, i: number) => i !== index)
      .map((day, i: number) => ({
        ...day,
        dayLabel: `Day ${i + 1}`, // 自動更新 dayLabel
        date: calculateDate(data.departureDate, i), // 自動更新日期
      }))
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  // 交換每日行程順序
  const swapDailyItinerary = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= data.dailyItinerary.length) return

    const newItinerary = [...data.dailyItinerary]
    // 交換兩天的內容
    ;[newItinerary[fromIndex], newItinerary[toIndex]] = [newItinerary[toIndex], newItinerary[fromIndex]]
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  // 活動管理
  const addActivity = (dayIndex: number) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[dayIndex].activities = [
      ...(newItinerary[dayIndex].activities || []),
      { icon: '🌋', title: '', description: '', image: '' },
    ]
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  const updateActivity = (dayIndex: number, actIndex: number, field: string, value: string) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[dayIndex].activities[actIndex] = {
      ...newItinerary[dayIndex].activities[actIndex],
      [field]: value,
    }
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter(
      (_: Activity, i: number) => i !== actIndex
    )
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  // 推薦行程管理
  const addRecommendation = (dayIndex: number) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[dayIndex].recommendations = [...(newItinerary[dayIndex].recommendations || []), '']
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  const updateRecommendation = (dayIndex: number, recIndex: number, value: string) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[dayIndex].recommendations[recIndex] = value
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  const removeRecommendation = (dayIndex: number, recIndex: number) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[dayIndex].recommendations = newItinerary[dayIndex].recommendations.filter(
      (_: string, i: number) => i !== recIndex
    )
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  // 每日圖片管理
  const addDayImage = (dayIndex: number) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[dayIndex].images = [...(newItinerary[dayIndex].images || []), '']
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  const updateDayImage = (dayIndex: number, imageIndex: number, value: string) => {
    const newItinerary = [...data.dailyItinerary]
    if (!newItinerary[dayIndex].images) {
      newItinerary[dayIndex].images = []
    }
    newItinerary[dayIndex].images![imageIndex] = value
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  const removeDayImage = (dayIndex: number, imageIndex: number) => {
    const newItinerary = [...data.dailyItinerary]
    newItinerary[dayIndex].images = (newItinerary[dayIndex].images || []).filter(
      (_, i: number) => i !== imageIndex
    )
    onChange({ ...data, dailyItinerary: newItinerary })
  }

  return {
    updateField,
    updateCity,
    updateNestedField,
    updateFlightField,
    updateFlightFields,
    addFeature,
    updateFeature,
    removeFeature,
    reorderFeature,
    addFocusCard,
    updateFocusCard,
    removeFocusCard,
    addDailyItinerary,
    updateDailyItinerary,
    removeDailyItinerary,
    swapDailyItinerary,
    addActivity,
    updateActivity,
    removeActivity,
    addDayImage,
    updateDayImage,
    removeDayImage,
    addRecommendation,
    updateRecommendation,
    removeRecommendation,
  }
}
