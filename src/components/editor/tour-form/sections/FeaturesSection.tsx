import React from 'react'
import { TourFormData, Feature } from '../types'
import { iconOptions } from '../constants'

interface FeaturesSectionProps {
  data: TourFormData
  addFeature: () => void
  updateFeature: (index: number, field: string, value: string) => void
  removeFeature: (index: number) => void
}

export function FeaturesSection({
  data,
  addFeature,
  updateFeature,
  removeFeature,
}: FeaturesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b-2 border-morandi-gold pb-2">
        <h2 className="text-lg font-bold text-morandi-primary">行程特色</h2>
        <button
          onClick={addFeature}
          className="px-3 py-1 bg-morandi-gold text-white rounded-lg text-sm hover:bg-morandi-gold/90"
        >
          + 新增特色
        </button>
      </div>

      {data.features?.map((feature: Feature, index: number) => (
        <div
          key={index}
          className="p-4 border-2 border-morandi-container rounded-lg space-y-3 bg-morandi-container/20"
        >
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-morandi-secondary">特色 {index + 1}</span>
            <button
              onClick={() => removeFeature(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              刪除
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">圖標</label>
            <select
              value={feature.icon}
              onChange={e => updateFeature(index, 'icon', e.target.value)}
              className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
            >
              {iconOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">標題</label>
            <input
              type="text"
              value={feature.title}
              onChange={e => updateFeature(index, 'title', e.target.value)}
              className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
              placeholder="溫泉飯店體驗"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">描述</label>
            <input
              type="text"
              value={feature.description}
              onChange={e => updateFeature(index, 'description', e.target.value)}
              className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
              placeholder="保證入住阿蘇溫泉飯店，享受日式溫泉文化"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
