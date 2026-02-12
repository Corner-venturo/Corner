/**
 * 飯店區塊編輯器
 */

'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Building } from 'lucide-react'
import type { HotelsBlockData } from '../types'
import type { HotelInfo } from '@/components/editor/tour-form/types'
import { COMP_EDITOR_LABELS } from '../../constants/labels'

interface HotelsBlockEditorProps {
  data: HotelsBlockData
  onChange: (data: Partial<HotelsBlockData>) => void
}

export function HotelsBlockEditor({ data, onChange }: HotelsBlockEditorProps) {
  const hotels = data.hotels || []

  const addHotel = useCallback(() => {
    onChange({
      hotels: [...hotels, { name: '', description: '' }],
    })
  }, [hotels, onChange])

  const updateHotel = useCallback((index: number, field: keyof HotelInfo, value: string | string[]) => {
    const newHotels = [...hotels]
    newHotels[index] = { ...newHotels[index], [field]: value }
    onChange({ hotels: newHotels })
  }, [hotels, onChange])

  const removeHotel = useCallback((index: number) => {
    onChange({ hotels: hotels.filter((_, i) => i !== index) })
  }, [hotels, onChange])

  return (
    <div className="space-y-2">
      {hotels.map((hotel, index) => (
        <div
          key={index}
          className="flex items-start gap-2 p-2 bg-morandi-container/30 rounded-lg"
        >
          <Building size={14} className="text-morandi-gold mt-2" />
          <div className="flex-1 space-y-1">
            <Input
              value={hotel.name || ''}
              onChange={e => updateHotel(index, 'name', e.target.value)}
              placeholder={COMP_EDITOR_LABELS.飯店名稱}
              className="h-8 text-sm"
            />
            <Input
              value={hotel.description || ''}
              onChange={e => updateHotel(index, 'description', e.target.value)}
              placeholder={COMP_EDITOR_LABELS.飯店描述}
              className="h-8 text-sm"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-status-danger hover:text-status-danger hover:bg-status-danger-bg"
            onClick={() => removeHotel(index)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={addHotel}
      >
        <Plus size={14} />
        新增飯店
      </Button>
    </div>
  )
}
