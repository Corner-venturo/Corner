import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import type { ConfirmationFormData, AccommodationData } from '@/types/confirmation.types'
import { LABELS } from '../constants/labels'

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
          <Label htmlFor="booking_number">{LABELS.BOOKING_NUMBER}</Label>
          <Input
            id="booking_number"
            value={formData.booking_number}
            onChange={e => onChange({ ...formData, booking_number: e.target.value })}
            placeholder="1658108098074416"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmation_number">{LABELS.CONFIRMATION_NUMBER}</Label>
          <Input
            id="confirmation_number"
            value={formData.confirmation_number || ''}
            onChange={e => onChange({ ...formData, confirmation_number: e.target.value })}
            placeholder="15382152"
          />
        </div>
      </div>

      {/* 飯店資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{LABELS.HOTEL_INFO}</h3>

        <div className="space-y-2">
          <Label htmlFor="hotelName">{LABELS.HOTEL_NAME}</Label>
          <Input
            id="hotelName"
            value={data.hotelName || ''}
            onChange={e => updateField('hotelName', e.target.value)}
            placeholder="凡裡FUN LIST飯店（上海顓橋萬達店）"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelAddress">{LABELS.HOTEL_ADDRESS}</Label>
          <Input
            id="hotelAddress"
            value={data.hotelAddress || ''}
            onChange={e => updateField('hotelAddress', e.target.value)}
            placeholder="上海, 閔行區, 顓興東路1398號"
          />
        </div>

        <div className="space-y-2">
          <Label>{LABELS.PHONE}</Label>
          {(data.hotelPhone || []).map((phone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={phone}
                onChange={e => updatePhone(index, e.target.value)}
                placeholder="+86-21-62218638"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => removePhone(index)}>
                {LABELS.DELETE}
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addPhone}>
            {LABELS.ADD_PHONE}
          </Button>
        </div>
      </div>

      {/* 入住資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{LABELS.CHECK_IN_INFO}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="checkInDate">{LABELS.CHECK_IN_DATE}</Label>
            <DatePicker
              value={data.checkInDate || ''}
              onChange={date => updateField('checkInDate', date)}
              placeholder={LABELS.SELECT_DATE_PLACEHOLDER}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkInTime">{LABELS.CHECK_IN_TIME}</Label>
            <Input
              id="checkInTime"
              value={data.checkInTime || ''}
              onChange={e => updateField('checkInTime', e.target.value)}
              placeholder="14:00後"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="checkOutDate">{LABELS.CHECK_OUT_DATE}</Label>
            <DatePicker
              value={data.checkOutDate || ''}
              onChange={date => updateField('checkOutDate', date)}
              placeholder={LABELS.SELECT_DATE_PLACEHOLDER}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOutTime">{LABELS.CHECK_OUT_TIME}</Label>
            <Input
              id="checkOutTime"
              value={data.checkOutTime || ''}
              onChange={e => updateField('checkOutTime', e.target.value)}
              placeholder="12:00前"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roomCount">{LABELS.ROOM_COUNT}</Label>
            <Input
              id="roomCount"
              type="number"
              value={data.roomCount || ''}
              onChange={e => updateField('roomCount', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nightCount">{LABELS.NIGHT_COUNT}</Label>
            <Input
              id="nightCount"
              type="number"
              value={data.nightCount || ''}
              onChange={e => updateField('nightCount', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* 房型資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{LABELS.ROOM_INFO}</h3>

        <div className="space-y-2">
          <Label htmlFor="roomType">{LABELS.ROOM_TYPE}</Label>
          <Input
            id="roomType"
            value={data.roomType || ''}
            onChange={e => updateField('roomType', e.target.value)}
            placeholder="凡趣大床房（全屋智能+手機投屏+零壓床品+65吋電視）"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guestName">{LABELS.GUEST_NAME}</Label>
          <Input
            id="guestName"
            value={data.guestName || ''}
            onChange={e => updateField('guestName', e.target.value)}
            placeholder="SUNG SHAOCHING"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guestCapacity">{LABELS.GUEST_CAPACITY}</Label>
          <Input
            id="guestCapacity"
            value={data.guestCapacity || ''}
            onChange={e => updateField('guestCapacity', e.target.value)}
            placeholder="此房型可容納最多 2 位旅客，其中最多 2 位成人"
          />
        </div>
      </div>

      {/* 餐點資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{LABELS.MEAL_INFO}</h3>

        {(data.meals || []).map((meal, index) => (
          <div key={index} className="flex gap-2">
            <DatePicker
              value={meal.date}
              onChange={date => updateMeal(index, 'date', date)}
              placeholder={LABELS.SELECT_DATE_PLACEHOLDER}
              className="w-40"
            />
            <Input
              value={meal.description}
              onChange={e => updateMeal(index, 'description', e.target.value)}
              placeholder="每房 1 客早餐"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => removeMeal(index)}>
              {LABELS.DELETE}
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addMeal}>
          {LABELS.ADD_MEAL}
        </Button>
      </div>

      {/* 重要資訊 */}
      <div className="space-y-2">
        <Label htmlFor="importantNotes">{LABELS.IMPORTANT_NOTES}</Label>
        <Textarea
          id="importantNotes"
          value={data.importantNotes || ''}
          onChange={e => updateField('importantNotes', e.target.value)}
          placeholder="特殊規定、注意事項..."
          rows={4}
        />
      </div>
    </div>
  )
}
