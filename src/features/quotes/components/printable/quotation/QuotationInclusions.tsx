'use client'
/**
 * QuotationInclusions - 費用包含/不包含說明
 */


import React from 'react'
import { MORANDI_COLORS } from '../shared/print-styles'
import { QUOTATION_INCLUSIONS_LABELS } from '@/constants/labels'
import { QUOTATION_LABELS } from './constants/labels'

export const QuotationInclusions: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <div>
        <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
          {QUOTATION_LABELS.LABEL_5450}
        </h4>
        <ul className="space-y-1 text-sm" style={{ color: MORANDI_COLORS.gray }}>
          <li>• {QUOTATION_LABELS.TRANSPORTATION_COST}</li>
          <li>• {QUOTATION_LABELS.ACCOMMODATION_COST}</li>
          <li>• {QUOTATION_LABELS.MEAL_COST}</li>
          <li>• {QUOTATION_LABELS.TICKET_COST}</li>
          <li>• {QUOTATION_LABELS.GUIDE_SERVICE}</li>
          <li>• {QUOTATION_INCLUSIONS_LABELS.旅遊責任險}</li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-2" style={{ color: MORANDI_COLORS.brown }}>
          {QUOTATION_LABELS.LABEL_4561}
        </h4>
        <ul className="space-y-1 text-sm" style={{ color: MORANDI_COLORS.gray }}>
          <li>• {QUOTATION_LABELS.PASSPORT_VISA_COST}</li>
          <li>• {QUOTATION_LABELS.OPTIONAL_TOUR}</li>
          <li>• {QUOTATION_LABELS.PERSONAL_EXPENSE}</li>
          <li>• {QUOTATION_LABELS.OVERWEIGHT_LUGGAGE}</li>
          <li>• {QUOTATION_LABELS.SINGLE_ROOM_SUPPLEMENT}</li>
        </ul>
      </div>
    </div>
  )
}
