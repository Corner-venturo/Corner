import React from 'react'
import { Loader2, Check, X } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { TOUR_CONFIRMATION_SHEET_PAGE_LABELS } from '../constants/labels'
import type { Tour } from '@/stores/types'
import type { ConfirmationItemCategory } from '@/types/tour-confirmation-sheet.types'

type TransportSubType = 'flight' | 'vehicle' | null

interface NewItemData {
  service_date: string
  service_date_end: string
  supplier_name: string
  title: string
  unit_price: string
  quantity: string
  expected_cost: string
  actual_cost: string
  notes: string
}

interface ManualFlightData {
  outbound: { airline: string; flightNumber: string; departureAirport: string; arrivalAirport: string }
  return: { airline: string; flightNumber: string; departureAirport: string; arrivalAirport: string }
}

interface InlineAddRowProps {
  category: ConfirmationItemCategory
  categoryLabel: string
  tour: Tour
  newItemData: NewItemData
  savingNew: boolean
  firstInputRef: React.RefObject<HTMLInputElement | null>
  // Transport-specific
  transportSubType: TransportSubType
  manualFlightMode: boolean
  manualFlight: ManualFlightData
  // Handlers
  onSelectTransportType: (type: TransportSubType) => void
  onNewItemChange: (field: keyof NewItemData, value: string) => void
  onSaveNewItem: () => void
  onCancelAdd: () => void
  onAddFlightItems: () => void
  onSaveManualFlight: () => void
  onSetManualFlightMode: (mode: boolean) => void
  onSetManualFlight: React.Dispatch<React.SetStateAction<ManualFlightData>>
}

/**
 * Transport 類別的 inline 新增行
 */
function TransportAddRow({
  tour,
  newItemData,
  savingNew,
  transportSubType,
  manualFlightMode,
  manualFlight,
  onSelectTransportType,
  onNewItemChange,
  onSaveNewItem,
  onCancelAdd,
  onAddFlightItems,
  onSaveManualFlight,
  onSetManualFlightMode,
  onSetManualFlight,
}: Omit<InlineAddRowProps, 'category' | 'categoryLabel' | 'firstInputRef'>) {
  return (
    <tr className="border-t border-border/50 bg-morandi-gold/10">
      <td className="px-3 py-2 border-r border-border/30">
        <select
          value={transportSubType || ''}
          onChange={(e) => onSelectTransportType(e.target.value as TransportSubType)}
          className="text-sm bg-transparent border-0 outline-none cursor-pointer -ml-1"
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            paddingRight: '16px',
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8680\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
          }}
        >
          <option value="">{TOUR_CONFIRMATION_SHEET_PAGE_LABELS.選擇}</option>
          <option value="flight">{TOUR_CONFIRMATION_SHEET_PAGE_LABELS.航班}</option>
          <option value="vehicle">{TOUR_CONFIRMATION_SHEET_PAGE_LABELS.車子}</option>
        </select>
      </td>

      {/* 未選擇子類型 */}
      {!transportSubType && (
        <>
          <td colSpan={8} className="px-3 py-2"></td>
          <td className="px-2 py-2 text-right">
            <button
              onClick={onCancelAdd}
              className="text-morandi-red hover:underline text-xs"
            >
              {TOUR_CONFIRMATION_SHEET_PAGE_LABELS.取消}
            </button>
          </td>
        </>
      )}

      {/* 航班 */}
      {transportSubType === 'flight' && (
        <>
          <td colSpan={8} className="px-4 py-2">
            <FlightAddContent
              tour={tour}
              savingNew={savingNew}
              manualFlightMode={manualFlightMode}
              manualFlight={manualFlight}
              onAddFlightItems={onAddFlightItems}
              onSaveManualFlight={onSaveManualFlight}
              onSetManualFlightMode={onSetManualFlightMode}
              onSetManualFlight={onSetManualFlight}
              onCancel={onCancelAdd}
            />
          </td>
        </>
      )}

      {/* 車輛 */}
      {transportSubType === 'vehicle' && (
        <VehicleAddCells
          newItemData={newItemData}
          savingNew={savingNew}
          onNewItemChange={onNewItemChange}
          onSaveNewItem={onSaveNewItem}
          onCancelAdd={onCancelAdd}
        />
      )}
    </tr>
  )
}

/**
 * 航班新增內容
 */
function FlightAddContent({
  tour,
  savingNew,
  manualFlightMode,
  manualFlight,
  onAddFlightItems,
  onSaveManualFlight,
  onSetManualFlightMode,
  onSetManualFlight,
  onCancel,
}: {
  tour: Tour
  savingNew: boolean
  manualFlightMode: boolean
  manualFlight: ManualFlightData
  onAddFlightItems: () => void
  onSaveManualFlight: () => void
  onSetManualFlightMode: (mode: boolean) => void
  onSetManualFlight: React.Dispatch<React.SetStateAction<ManualFlightData>>
  onCancel: () => void
}) {
  if (tour.outbound_flight || tour.return_flight) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm space-x-4">
          {tour.outbound_flight && (
            <span>
              <span className="text-morandi-green">
                {TOUR_CONFIRMATION_SHEET_PAGE_LABELS.去程}
              </span>{' '}
              {tour.outbound_flight.airline} {tour.outbound_flight.flightNumber}{' '}
              {tour.outbound_flight.departureAirport}→{tour.outbound_flight.arrivalAirport}
            </span>
          )}
          {tour.return_flight && (
            <span>
              <span className="text-morandi-gold">
                {TOUR_CONFIRMATION_SHEET_PAGE_LABELS.回程}
              </span>{' '}
              {tour.return_flight.airline} {tour.return_flight.flightNumber}{' '}
              {tour.return_flight.departureAirport}→{tour.return_flight.arrivalAirport}
            </span>
          )}
        </div>
        <button
          onClick={onAddFlightItems}
          disabled={savingNew}
          className="px-3 py-1 text-xs font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded disabled:opacity-50"
        >
          {savingNew ? '新增中...' : TOUR_CONFIRMATION_SHEET_PAGE_LABELS.確認帶入}
        </button>
        <button onClick={onCancel} className="text-morandi-red hover:underline text-xs">
          取消
        </button>
      </div>
    )
  }

  if (manualFlightMode) {
    return (
      <div className="space-y-2">
        {(['outbound', 'return'] as const).map((direction) => (
          <div key={direction} className="flex items-center gap-2 text-sm">
            <span
              className={`font-medium w-10 ${
                direction === 'outbound' ? 'text-morandi-green' : 'text-morandi-gold'
              }`}
            >
              {direction === 'outbound'
                ? TOUR_CONFIRMATION_SHEET_PAGE_LABELS.去程
                : TOUR_CONFIRMATION_SHEET_PAGE_LABELS.回程}
            </span>
            <input
              placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.航空}
              value={manualFlight[direction].airline}
              onChange={(e) =>
                onSetManualFlight((prev) => ({
                  ...prev,
                  [direction]: { ...prev[direction], airline: e.target.value },
                }))
              }
              className="w-20 px-2 py-1 border border-border rounded text-sm"
            />
            <input
              placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.航班}
              value={manualFlight[direction].flightNumber}
              onChange={(e) =>
                onSetManualFlight((prev) => ({
                  ...prev,
                  [direction]: { ...prev[direction], flightNumber: e.target.value },
                }))
              }
              className="w-20 px-2 py-1 border border-border rounded text-sm"
            />
            <input
              placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.起飛}
              value={manualFlight[direction].departureAirport}
              onChange={(e) =>
                onSetManualFlight((prev) => ({
                  ...prev,
                  [direction]: { ...prev[direction], departureAirport: e.target.value },
                }))
              }
              className="w-16 px-2 py-1 border border-border rounded text-sm"
            />
            <span>→</span>
            <input
              placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.抵達}
              value={manualFlight[direction].arrivalAirport}
              onChange={(e) =>
                onSetManualFlight((prev) => ({
                  ...prev,
                  [direction]: { ...prev[direction], arrivalAirport: e.target.value },
                }))
              }
              className="w-16 px-2 py-1 border border-border rounded text-sm"
            />
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onSaveManualFlight}
            disabled={savingNew || (!manualFlight.outbound.airline && !manualFlight.return.airline)}
            className="px-3 py-1 text-xs font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded disabled:opacity-50"
          >
            {savingNew ? '儲存中...' : TOUR_CONFIRMATION_SHEET_PAGE_LABELS.確認儲存}
          </button>
          <button
            onClick={() => {
              onSetManualFlightMode(false)
              onCancel()
            }}
            className="text-morandi-red hover:underline text-xs"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-morandi-secondary">
        {TOUR_CONFIRMATION_SHEET_PAGE_LABELS.尚無航班資訊}
      </span>
      <button
        onClick={() => onSetManualFlightMode(true)}
        className="px-3 py-1 text-xs font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded"
      >
        {TOUR_CONFIRMATION_SHEET_PAGE_LABELS.手動填寫}
      </button>
      <button onClick={onCancel} className="text-morandi-red hover:underline text-xs">
        {TOUR_CONFIRMATION_SHEET_PAGE_LABELS.取消}
      </button>
    </div>
  )
}

/**
 * 車輛新增的 td cells
 */
function VehicleAddCells({
  newItemData,
  savingNew,
  onNewItemChange,
  onSaveNewItem,
  onCancelAdd,
}: {
  newItemData: NewItemData
  savingNew: boolean
  onNewItemChange: (field: keyof NewItemData, value: string) => void
  onSaveNewItem: () => void
  onCancelAdd: () => void
}) {
  return (
    <>
      <td className="p-1 border-r border-border/30">
        <div className="flex items-center gap-1">
          <DatePicker
            value={newItemData.service_date}
            onChange={(date) => onNewItemChange('service_date', date)}
            placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.開始}
            buttonClassName="h-8 text-xs border-0 shadow-none"
          />
          <span className="text-morandi-secondary text-xs">~</span>
          <DatePicker
            value={newItemData.service_date_end}
            onChange={(date) => onNewItemChange('service_date_end', date)}
            placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.結束_選填}
            buttonClassName="h-8 text-xs border-0 shadow-none"
            clearable
          />
        </div>
      </td>
      <td className="p-0 border-r border-border/30" style={{ maxWidth: '100px' }}>
        <input
          value={newItemData.supplier_name}
          onChange={(e) => onNewItemChange('supplier_name', e.target.value)}
          placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.車行}
          className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
        />
      </td>
      <td className="p-0 border-r border-border/30">
        <input
          value={newItemData.title}
          onChange={(e) => onNewItemChange('title', e.target.value)}
          placeholder={
            newItemData.service_date_end
              ? TOUR_CONFIRMATION_SHEET_PAGE_LABELS.全程用車
              : TOUR_CONFIRMATION_SHEET_PAGE_LABELS.單日用車
          }
          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
        />
      </td>
      <InlineNumericCells
        newItemData={newItemData}
        savingNew={savingNew}
        onNewItemChange={onNewItemChange}
        onSaveNewItem={onSaveNewItem}
        onCancelAdd={onCancelAdd}
      />
    </>
  )
}

/**
 * 一般類別的 inline 新增行
 */
function GenericAddRow({
  categoryLabel,
  newItemData,
  savingNew,
  firstInputRef,
  onNewItemChange,
  onSaveNewItem,
  onCancelAdd,
}: {
  categoryLabel: string
  newItemData: NewItemData
  savingNew: boolean
  firstInputRef: React.RefObject<HTMLInputElement | null>
  onNewItemChange: (field: keyof NewItemData, value: string) => void
  onSaveNewItem: () => void
  onCancelAdd: () => void
}) {
  return (
    <tr className="border-t border-border/50 bg-morandi-gold/10">
      <td className="px-3 py-2 text-morandi-secondary text-xs border-r border-border/30">
        {categoryLabel}
      </td>
      <td className="p-0 border-r border-border/30">
        <input
          ref={firstInputRef}
          type="date"
          value={newItemData.service_date}
          onChange={(e) => onNewItemChange('service_date', e.target.value)}
          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50"
        />
      </td>
      <td className="p-0 border-r border-border/30">
        <input
          value={newItemData.supplier_name}
          onChange={(e) => onNewItemChange('supplier_name', e.target.value)}
          placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.輸入供應商}
          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
        />
      </td>
      <td className="p-0 border-r border-border/30">
        <input
          value={newItemData.title}
          onChange={(e) => onNewItemChange('title', e.target.value)}
          placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.輸入項目說明}
          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
        />
      </td>
      <InlineNumericCells
        newItemData={newItemData}
        savingNew={savingNew}
        onNewItemChange={onNewItemChange}
        onSaveNewItem={onSaveNewItem}
        onCancelAdd={onCancelAdd}
      />
    </tr>
  )
}

/**
 * 共用的數值欄位 + 儲存/取消按鈕
 */
function InlineNumericCells({
  newItemData,
  savingNew,
  onNewItemChange,
  onSaveNewItem,
  onCancelAdd,
}: {
  newItemData: NewItemData
  savingNew: boolean
  onNewItemChange: (field: keyof NewItemData, value: string) => void
  onSaveNewItem: () => void
  onCancelAdd: () => void
}) {
  const inputClass =
    'w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50'

  return (
    <>
      <td className="p-0 border-r border-border/30">
        <input
          type="number"
          value={newItemData.unit_price}
          onChange={(e) => onNewItemChange('unit_price', e.target.value)}
          placeholder="0"
          className={`${inputClass} text-right font-mono`}
        />
      </td>
      <td className="p-0 border-r border-border/30">
        <input
          type="number"
          value={newItemData.quantity}
          onChange={(e) => onNewItemChange('quantity', e.target.value)}
          placeholder="0"
          className={`${inputClass} text-center`}
        />
      </td>
      <td className="p-0 border-r border-border/30">
        <input
          type="number"
          value={newItemData.expected_cost}
          onChange={(e) => onNewItemChange('expected_cost', e.target.value)}
          placeholder="0"
          className={`${inputClass} text-right font-mono`}
        />
      </td>
      <td className="p-0 border-r border-border/30">
        <input
          type="number"
          value={newItemData.actual_cost}
          onChange={(e) => onNewItemChange('actual_cost', e.target.value)}
          placeholder="0"
          className={`${inputClass} text-right font-mono`}
        />
      </td>
      <td className="p-0 border-r border-border/30">
        <input
          value={newItemData.notes}
          onChange={(e) => onNewItemChange('notes', e.target.value)}
          placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.備註}
          className={inputClass}
        />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={onSaveNewItem}
            disabled={savingNew}
            className="p-1.5 text-white bg-morandi-green hover:bg-morandi-green/80 rounded disabled:opacity-50"
            title={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.儲存}
          >
            {savingNew ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button
            onClick={onCancelAdd}
            disabled={savingNew}
            className="p-1.5 text-white bg-morandi-red hover:bg-morandi-red/80 rounded disabled:opacity-50"
            title={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.取消}
          >
            <X size={14} />
          </button>
        </div>
      </td>
    </>
  )
}

export { TransportAddRow, GenericAddRow }
export type { NewItemData, ManualFlightData, TransportSubType }
