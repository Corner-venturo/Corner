import React from 'react'
import { TourFormData, HotelInfo } from '../types'
import { Plus, X } from 'lucide-react'

interface HotelSectionProps {
  data: TourFormData
  updateField: (field: string, value: unknown) => void
}

export function HotelSection({ data, updateField }: HotelSectionProps) {
  const hotels = data.hotels || []

  const addHotel = () => {
    updateField('hotels', [
      ...hotels,
      {
        name: '',
        description: '',
        image: '',
      },
    ])
  }

  const updateHotel = (index: number, field: keyof HotelInfo, value: string) => {
    const updated = [...hotels]
    updated[index] = { ...updated[index], [field]: value }
    updateField('hotels', updated)
  }

  const removeHotel = (index: number) => {
    updateField(
      'hotels',
      hotels.filter((_, i) => i !== index)
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-2 flex-1">
          🏨 飯店資訊
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.showHotels !== false}
            onChange={e => updateField('showHotels', e.target.checked)}
            className="w-4 h-4 text-morandi-gold rounded focus:ring-morandi-gold/50"
          />
          <span className="text-morandi-primary">顯示此區塊</span>
        </label>
      </div>

      <div className="bg-morandi-container/20 p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-morandi-secondary">新增入住的飯店資訊，可以加入多間飯店</p>
          <button
            type="button"
            onClick={addHotel}
            className="flex items-center gap-1 px-3 py-1.5 bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold/90 transition-colors text-sm"
          >
            <Plus size={16} />
            新增飯店
          </button>
        </div>

        {hotels.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-morandi-container">
            <p className="text-sm text-morandi-secondary mb-2">尚未新增飯店資訊</p>
            <p className="text-xs text-gray-400">點擊「新增飯店」按鈕開始</p>
          </div>
        )}

        {hotels.map((hotel, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg border border-morandi-container space-y-3 relative"
          >
            <button
              type="button"
              onClick={() => removeHotel(index)}
              className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="移除此飯店"
            >
              <X size={16} />
            </button>

            <div className="pr-8">
              <h4 className="font-bold text-morandi-secondary mb-3">飯店 {index + 1}</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    飯店名稱 *
                  </label>
                  <input
                    type="text"
                    value={hotel.name}
                    onChange={e => updateHotel(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
                    placeholder="例如: 福岡海鷹希爾頓酒店"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    飯店簡介
                  </label>
                  <textarea
                    value={hotel.description}
                    onChange={e => updateHotel(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold min-h-[80px]"
                    placeholder="介紹飯店特色、位置、設施等..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    飯店圖片網址
                  </label>
                  <input
                    type="url"
                    value={hotel.image || ''}
                    onChange={e => updateHotel(index, 'image', e.target.value)}
                    className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
                    placeholder="https://example.com/hotel.jpg"
                  />
                  {hotel.image && (
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                      onError={e => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
