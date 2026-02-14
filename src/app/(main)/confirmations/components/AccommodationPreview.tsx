import type { ConfirmationFormData, AccommodationData } from '@/types/confirmation.types'
import Image from 'next/image'
import { ACCOMMODATION_PREVIEW_LABELS } from '../constants/labels'

interface AccommodationPreviewProps {
  formData: ConfirmationFormData
}

export function AccommodationPreview({ formData }: AccommodationPreviewProps) {
  const data = formData.data as Partial<AccommodationData>

  // 計算日期顯示格式
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}${ACCOMMODATION_PREVIEW_LABELS.MONTH_SUFFIX}${date.getDate()}${ACCOMMODATION_PREVIEW_LABELS.DAY_SUFFIX}`
  }

  return (
    <div className="p-10">
      {/* 頁首 */}
      <div className="flex justify-between items-center pb-5 mb-7 border-b-2 border-morandi-gold">
        <div className="flex items-center gap-4">
          {/* LOGO */}
          <div className="w-12 h-12 bg-morandi-gold rounded-md flex items-center justify-center text-white text-2xl font-bold">
            V
          </div>
          <h1 className="text-3xl font-bold text-morandi-primary">{ACCOMMODATION_PREVIEW_LABELS.HOTEL_VOUCHER_TITLE}</h1>
        </div>
        <div className="text-right text-sm text-morandi-secondary">
          {formData.booking_number && (
            <div className="mb-1">
              <strong className="text-morandi-primary">{ACCOMMODATION_PREVIEW_LABELS.BOOKING_NUMBER}</strong>{' '}
              <span className="font-mono text-morandi-gold">{formData.booking_number}</span>
            </div>
          )}
          {formData.confirmation_number && (
            <div>
              <strong className="text-morandi-primary">{ACCOMMODATION_PREVIEW_LABELS.HOTEL_CONFIRMATION_NUMBER}</strong>{' '}
              <span className="font-mono text-morandi-gold">{formData.confirmation_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* 飯店資訊 */}
      {data.hotelName && (
        <div className="bg-gradient-to-br from-morandi-cream to-morandi-cream-light border border-morandi-cream-dark rounded-md p-6 mb-6">
          <div className="text-xl font-semibold text-morandi-primary mb-4">{data.hotelName}</div>
          {data.hotelAddress && (
            <div className="grid grid-cols-[80px_1fr] gap-2 mb-2 text-sm">
              <div className="font-semibold text-morandi-secondary">{ACCOMMODATION_PREVIEW_LABELS.ADDRESS}</div>
              <div className="text-morandi-primary">{data.hotelAddress}</div>
            </div>
          )}
          {data.hotelPhone && data.hotelPhone.length > 0 && (
            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
              <div className="font-semibold text-morandi-secondary">{ACCOMMODATION_PREVIEW_LABELS.PHONE}</div>
              <div className="text-morandi-gold">
                {data.hotelPhone.map((phone, i) => (
                  <div key={i}>☏ {phone}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 入住退房資訊 */}
      {(data.checkInDate || data.checkOutDate) && (
        <div className="grid grid-cols-4 gap-4 mb-6 bg-card border border-morandi-cream-dark rounded-md overflow-hidden">
          <div className="p-5 text-center border-r border-morandi-cream">
            <div className="text-xs text-morandi-secondary font-semibold mb-2">{ACCOMMODATION_PREVIEW_LABELS.CHECK_IN}</div>
            <div className="text-lg font-semibold text-morandi-primary mb-1">
              {formatDate(data.checkInDate || '')}
            </div>
            <div className="text-xs text-morandi-secondary">
              {data.checkInTime || ACCOMMODATION_PREVIEW_LABELS.DEFAULT_CHECK_IN_TIME}
              <br />
              {ACCOMMODATION_PREVIEW_LABELS.HOTEL_LOCAL_TIME}
            </div>
          </div>
          <div className="p-5 text-center border-r border-morandi-cream">
            <div className="text-xs text-morandi-secondary font-semibold mb-2">{ACCOMMODATION_PREVIEW_LABELS.CHECK_OUT}</div>
            <div className="text-lg font-semibold text-morandi-primary mb-1">
              {formatDate(data.checkOutDate || '')}
            </div>
            <div className="text-xs text-morandi-secondary">
              {data.checkOutTime || ACCOMMODATION_PREVIEW_LABELS.DEFAULT_CHECK_OUT_TIME}
              <br />
              {ACCOMMODATION_PREVIEW_LABELS.HOTEL_LOCAL_TIME}
            </div>
          </div>
          <div className="p-5 text-center border-r border-morandi-cream">
            <div className="text-xs text-morandi-secondary font-semibold mb-2">{ACCOMMODATION_PREVIEW_LABELS.ROOM}</div>
            <div className="text-lg font-semibold text-morandi-primary">{data.roomCount || 0}</div>
          </div>
          <div className="p-5 text-center">
            <div className="text-xs text-morandi-secondary font-semibold mb-2">{ACCOMMODATION_PREVIEW_LABELS.NIGHT}</div>
            <div className="text-lg font-semibold text-morandi-primary">{data.nightCount || 0}</div>
          </div>
        </div>
      )}

      {/* 房型資訊 */}
      {data.roomType && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-morandi-primary mb-4 p-3 bg-gradient-to-r from-morandi-cream to-card border-l-4 border-morandi-gold rounded">
            {ACCOMMODATION_PREVIEW_LABELS.ROOM_INFO}
          </h2>
          <div className="bg-morandi-cream-light border border-morandi-cream-dark rounded-md p-5">
            <div className="text-base font-semibold text-morandi-primary mb-4 pb-3 border-b border-morandi-cream-dark">
              {data.roomType}
            </div>
            {data.guestName && (
              <div className="grid grid-cols-[120px_1fr] gap-3 mb-3 text-sm">
                <div className="font-semibold text-morandi-secondary">{ACCOMMODATION_PREVIEW_LABELS.GUEST_NAME}</div>
                <div className="font-medium text-morandi-gold">{data.guestName}</div>
              </div>
            )}
            {data.roomCount && data.nightCount && (
              <div className="grid grid-cols-[120px_1fr] gap-3 mb-3 text-sm">
                <div className="font-semibold text-morandi-secondary">{ACCOMMODATION_PREVIEW_LABELS.YOUR_BOOKING}</div>
                <div className="text-morandi-primary">
                  {data.roomCount}{ACCOMMODATION_PREVIEW_LABELS.ROOMS_UNIT}{data.nightCount}{ACCOMMODATION_PREVIEW_LABELS.NIGHTS_UNIT}
                </div>
              </div>
            )}
            {data.guestCapacity && (
              <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
                <div className="font-semibold text-morandi-secondary">{ACCOMMODATION_PREVIEW_LABELS.GUEST_CAPACITY}</div>
                <div className="text-morandi-primary">{data.guestCapacity}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 餐點資訊 */}
      {data.meals && data.meals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-morandi-primary mb-4 p-3 bg-gradient-to-r from-morandi-cream to-card border-l-4 border-morandi-gold rounded">
            {ACCOMMODATION_PREVIEW_LABELS.MEAL_INFO}
          </h2>
          <ul className="space-y-2">
            {data.meals.map((meal, i) => (
              <li key={i} className="pl-5 text-sm text-morandi-secondary relative">
                <span className="absolute left-2 text-morandi-gold text-xs">●</span>
                <span className="font-semibold text-morandi-primary mr-2">
                  {formatDate(meal.date)}
                </span>
                {meal.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 重要資訊 */}
      {data.importantNotes && (
        <div className="bg-gradient-to-br from-status-warning-bg to-status-warning-bg border border-status-warning/30 border-l-4 rounded-md p-5">
          <div className="text-sm font-semibold text-status-warning mb-3 flex items-center gap-2">
            ⚠️ {ACCOMMODATION_PREVIEW_LABELS.IMPORTANT_CITY_INFO}
          </div>
          <div className="text-sm text-morandi-secondary leading-relaxed whitespace-pre-wrap">
            {data.importantNotes}
          </div>
        </div>
      )}

      {/* 頁尾 */}
      <div className="mt-8 pt-4 border-t border-morandi-cream-dark text-center text-xs text-morandi-secondary">
        {ACCOMMODATION_PREVIEW_LABELS.FOOTER}
      </div>
    </div>
  )
}
