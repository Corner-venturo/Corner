import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { ConfirmationFormData, AccommodationData } from '@/types/confirmation.types'

interface AccommodationFormProps {
  formData: ConfirmationFormData
  onChange: (data: ConfirmationFormData) => void
}

export function AccommodationForm({ formData, onChange }: AccommodationFormProps) {
  const data = (formData.data || {}) as Partial<AccommodationData>

  const updateField = <K extends keyof AccommodationData>(
    field: K,
    value: AccommodationData[K]
  ) => {
    onChange({
      ...formData,
      data: {
        ...data,
        [field]: value,
      },
    })
  }

  const addMeal = () => {
    const meals = data.meals || []
    updateField('meals', [...meals, { date: '', description: '' }])
  }

  const updateMeal = (index: number, field: 'date' | 'description', value: string) => {
    const meals = [...(data.meals || [])]
    meals[index] = { ...meals[index], [field]: value }
    updateField('meals', meals)
  }

  const removeMeal = (index: number) => {
    const meals = [...(data.meals || [])]
    meals.splice(index, 1)
    updateField('meals', meals)
  }

  const addPhone = () => {
    const phones = data.hotelPhone || []
    updateField('hotelPhone', [...phones, ''])
  }

  const updatePhone = (index: number, value: string) => {
    const phones = [...(data.hotelPhone || [])]
    phones[index] = value
    updateField('hotelPhone', phones)
  }

  const removePhone = (index: number) => {
    const phones = [...(data.hotelPhone || [])]
    phones.splice(index, 1)
    updateField('hotelPhone', phones)
  }

  return (
    <div className="space-y-6">
      {/* 訂單編號 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="booking_number">訂單編號 *</Label>
          <Input
            id="booking_number"
            value={formData.booking_number}
            onChange={(e) => onChange({ ...formData, booking_number: e.target.value })}
            placeholder="1658108098074416"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmation_number">飯店確認編號</Label>
          <Input
            id="confirmation_number"
            value={formData.confirmation_number || ''}
            onChange={(e) => onChange({ ...formData, confirmation_number: e.target.value })}
            placeholder="15382152"
          />
        </div>
      </div>

      {/* 飯店資訊 */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-morandi-primary">飯店資訊</h3>

        <div className="space-y-2">
          <Label htmlFor="hotelName">飯店名稱 *</Label>
          <Input
            id="hotelName"
            value={data.hotelName || ''}
            onChange={(e) => updateField('hotelName', e.target.value)}
            placeholder="凡裡FUN LIST飯店（上海顓橋萬達店）"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelAddress">地址 *</Label>
          <Input
            id="hotelAddress"
            value={data.hotelAddress || ''}
            onChange={(e) => updateField('hotelAddress', e.target.value)}
            placeholder="上海, 閔行區, 顓興東路1398號"
          />
        </div>

        <div className="space-y-2">
          <Label>電話</Label>
          {(data.hotelPhone || []).map((phone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => updatePhone(index, e.target.value)}
                placeholder="+86-21-62218638"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removePhone(index)}
              >
                刪除
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addPhone}>
            + 新增電話
          </Button>
        </div>
      </div>

      {/* 入住資訊 */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-morandi-primary">入住資訊</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="checkInDate">入住日期 *</Label>
            <Input
              id="checkInDate"
              type="date"
              value={data.checkInDate || ''}
              onChange={(e) => updateField('checkInDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkInTime">入住時間</Label>
            <Input
              id="checkInTime"
              value={data.checkInTime || ''}
              onChange={(e) => updateField('checkInTime', e.target.value)}
              placeholder="14:00後"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="checkOutDate">退房日期 *</Label>
            <Input
              id="checkOutDate"
              type="date"
              value={data.checkOutDate || ''}
              onChange={(e) => updateField('checkOutDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOutTime">退房時間</Label>
            <Input
              id="checkOutTime"
              value={data.checkOutTime || ''}
              onChange={(e) => updateField('checkOutTime', e.target.value)}
              placeholder="12:00前"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roomCount">房數 *</Label>
            <Input
              id="roomCount"
              type="number"
              value={data.roomCount || ''}
              onChange={(e) => updateField('roomCount', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nightCount">晚數 *</Label>
            <Input
              id="nightCount"
              type="number"
              value={data.nightCount || ''}
              onChange={(e) => updateField('nightCount', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* 房型資訊 */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-morandi-primary">房型資訊</h3>

        <div className="space-y-2">
          <Label htmlFor="roomType">房型 *</Label>
          <Input
            id="roomType"
            value={data.roomType || ''}
            onChange={(e) => updateField('roomType', e.target.value)}
            placeholder="凡趣大床房（全屋智能+手機投屏+零壓床品+65吋電視）"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guestName">旅客姓名 *</Label>
          <Input
            id="guestName"
            value={data.guestName || ''}
            onChange={(e) => updateField('guestName', e.target.value)}
            placeholder="SUNG SHAOCHING"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guestCapacity">入住人數</Label>
          <Input
            id="guestCapacity"
            value={data.guestCapacity || ''}
            onChange={(e) => updateField('guestCapacity', e.target.value)}
            placeholder="此房型可容納最多 2 位旅客，其中最多 2 位成人"
          />
        </div>
      </div>

      {/* 餐點資訊 */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-morandi-primary">餐點資訊</h3>

        {(data.meals || []).map((meal, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="date"
              value={meal.date}
              onChange={(e) => updateMeal(index, 'date', e.target.value)}
              className="w-40"
            />
            <Input
              value={meal.description}
              onChange={(e) => updateMeal(index, 'description', e.target.value)}
              placeholder="每房 1 客早餐"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeMeal(index)}
            >
              刪除
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addMeal}>
          + 新增餐點
        </Button>
      </div>

      {/* 重要資訊 */}
      <div className="space-y-2">
        <Label htmlFor="importantNotes">重要城市資訊 / 備註</Label>
        <Textarea
          id="importantNotes"
          value={data.importantNotes || ''}
          onChange={(e) => updateField('importantNotes', e.target.value)}
          placeholder="特殊規定、注意事項..."
          rows={4}
        />
      </div>
    </div>
  )
}
