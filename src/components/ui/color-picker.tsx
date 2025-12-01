'use client'

// 莫蘭迪配色選項
const morandiColors = [
  { name: '柔霧粉', value: '#E2C4C4', hover: '#D9B3B3' },
  { name: '晨露綠', value: '#C4D6C4', hover: '#B3CAB3' },
  { name: '雲石灰', value: '#D4D4D4', hover: '#C4C4C4' },
  { name: '奶茶棕', value: '#D6C4B8', hover: '#CAB3A5' },
  { name: '薰衣草', value: '#D0C4D6', hover: '#C3B3CA' },
  { name: '杏仁黃', value: '#E0D6B8', hover: '#D6CAA5' },
  { name: '海霧藍', value: '#C4D0D6', hover: '#B3C3CA' },
  { name: '珊瑚橘', value: '#E0C8B8', hover: '#D6B9A5' },
  { name: '鼠尾草', value: '#B8C8B8', hover: '#A5B9A5' },
  { name: '暮色紫', value: '#C4B8D0', hover: '#B3A5C3' },
  { name: '燕麥米', value: '#D6D0C4', hover: '#CAC3B3' },
  { name: '石墨藍', value: '#B8C4D0', hover: '#A5B3C3' },
  { name: '楓葉紅', value: '#D0B8B8', hover: '#C3A5A5' },
  { name: '苔蘚綠', value: '#B8C4B8', hover: '#A5B3A5' },
  { name: '砂岩褐', value: '#C8B8B0', hover: '#B9A59C' },
  { name: '月光白', value: '#E8E8E8', hover: '#DEDEDE' },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export default function ColorPicker({ value, onChange, className = '' }: ColorPickerProps) {
  return (
    <div className={className}>
      {/* 顏色選擇面板 - 直接展開 */}
      <div className="grid grid-cols-4 gap-2">
        {morandiColors.map(color => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={`w-12 h-12 rounded-lg transition-transform hover:scale-105 ${
              color.value === value
                ? 'ring-2 ring-gray-600 ring-offset-2'
                : 'border border-gray-200'
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            <span className="sr-only">{color.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
