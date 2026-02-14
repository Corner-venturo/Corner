import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { LABELS , FLIGHT_FORM_LABELS } from '../constants/labels'
import type { ConfirmationFormData, FlightData } from '@/types/confirmation.types'

interface FlightFormProps {
  formData: ConfirmationFormData
  onChange: (data: ConfirmationFormData) => void
}

export function FlightForm({ formData, onChange }: FlightFormProps) {
  const data = (formData.data || {
    passengers: [],
    segments: [],
    baggage: [],
    importantNotes: [],
  }) as Partial<FlightData>

  const updateData = (updates: Partial<FlightData>) => {
    onChange({
      ...formData,
      data: {
        ...data,
        ...updates,
      },
    })
  }

  // 旅客操作
  const addPassenger = () => {
    updateData({
      passengers: [
        ...(data.passengers || []),
        { nameEn: '', nameZh: '', cabin: FLIGHT_FORM_LABELS.DEFAULT_CABIN, ticketNumber: '', bookingCode: '' },
      ],
    })
  }

  // 航班操作
  const addSegment = () => {
    updateData({
      segments: [
        ...(data.segments || []),
        {
          route: '',
          departureDate: '',
          departureTime: '',
          departureAirport: '',
          arrivalDate: '',
          arrivalTime: '',
          arrivalAirport: '',
          airline: '',
          flightNumber: '',
        },
      ],
    })
  }

  // 行李操作
  const addBaggage = () => {
    updateData({
      baggage: [
        ...(data.baggage || []),
        { passengerName: '', personalItem: '', carryOn: '', checked: '' },
      ],
    })
  }

  // 重要資訊操作
  const addImportantNote = () => {
    updateData({
      importantNotes: [...(data.importantNotes || []), ''],
    })
  }

  // 行李詳細資訊操作
  const addBaggageDetail = () => {
    updateData({
      baggageDetails: [
        ...(data.baggageDetails || []),
        { route: '', carryOnDetail: '', checkedDetail: '', personalItemDetail: '' },
      ],
    })
  }

  return (
    <div className="space-y-6">
      {/* 訂單編號 */}
      <div className="space-y-2">
        <Label htmlFor="booking_number">{LABELS.BOOKING_NUMBER}</Label>
        <Input
          id="booking_number"
          value={formData.booking_number}
          onChange={e => onChange({ ...formData, booking_number: e.target.value })}
          placeholder="1658108098074416"
        />
      </div>

      {/* 旅客資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{LABELS.PASSENGER_INFO}</h3>
        {(data.passengers || []).map((passenger, index) => (
          <div key={index} className="space-y-2 p-3 bg-card rounded border">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{LABELS.EN_NAME}</Label>
                <Input
                  value={passenger.nameEn}
                  onChange={e => {
                    const passengers = [...(data.passengers || [])]
                    passengers[index] = { ...passengers[index], nameEn: e.target.value }
                    updateData({ passengers })
                  }}
                  placeholder="SUNG SHAOCHING"
                />
              </div>
              <div>
                <Label>{LABELS.ZH_NAME}</Label>
                <Input
                  value={passenger.nameZh || ''}
                  onChange={e => {
                    const passengers = [...(data.passengers || [])]
                    passengers[index] = { ...passengers[index], nameZh: e.target.value }
                    updateData({ passengers })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.ZH_NAME_PLACEHOLDER}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>{LABELS.CABIN_CLASS}</Label>
                <Input
                  value={passenger.cabin}
                  onChange={e => {
                    const passengers = [...(data.passengers || [])]
                    passengers[index] = { ...passengers[index], cabin: e.target.value }
                    updateData({ passengers })
                  }}
                  placeholder={LABELS.ECONOMY_CLASS}
                />
              </div>
              <div>
                <Label>{LABELS.TICKET_NO}</Label>
                <Input
                  value={passenger.ticketNumber}
                  onChange={e => {
                    const passengers = [...(data.passengers || [])]
                    passengers[index] = { ...passengers[index], ticketNumber: e.target.value }
                    updateData({ passengers })
                  }}
                  placeholder="784-6327347583"
                />
              </div>
              <div>
                <Label>{LABELS.BOOKING_CODE_LABEL}</Label>
                <Input
                  value={passenger.bookingCode}
                  onChange={e => {
                    const passengers = [...(data.passengers || [])]
                    passengers[index] = { ...passengers[index], bookingCode: e.target.value }
                    updateData({ passengers })
                  }}
                  placeholder="NBJSCK"
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPassenger}>
          {LABELS.ADD_PASSENGER}
        </Button>
      </div>

      {/* 航班資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{LABELS.FLIGHT_INFO}</h3>
        {(data.segments || []).map((segment, index) => (
          <div key={index} className="space-y-2 p-3 bg-card rounded border">
            <div>
              <Label>{LABELS.ROUTE}</Label>
              <Input
                value={segment.route}
                onChange={e => {
                  const segments = [...(data.segments || [])]
                  segments[index] = { ...segments[index], route: e.target.value }
                  updateData({ segments })
                }}
                placeholder={FLIGHT_FORM_LABELS.ROUTE_PLACEHOLDER}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{LABELS.DEPARTURE_DATE_LABEL}</Label>
                <DatePicker
                  value={segment.departureDate}
                  onChange={date => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], departureDate: date }
                    updateData({ segments })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.SELECT_DATE_PLACEHOLDER}
                />
              </div>
              <div>
                <Label>{FLIGHT_FORM_LABELS.DEPARTURE_TIME}</Label>
                <Input
                  type="time"
                  value={segment.departureTime}
                  onChange={e => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], departureTime: e.target.value }
                    updateData({ segments })
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{FLIGHT_FORM_LABELS.DEPARTURE_AIRPORT}</Label>
                <Input
                  value={segment.departureAirport}
                  onChange={e => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], departureAirport: e.target.value }
                    updateData({ segments })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.DEPARTURE_AIRPORT_PLACEHOLDER}
                />
              </div>
              <div>
                <Label>{FLIGHT_FORM_LABELS.ARRIVAL_AIRPORT}</Label>
                <Input
                  value={segment.arrivalAirport}
                  onChange={e => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], arrivalAirport: e.target.value }
                    updateData({ segments })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.ARRIVAL_AIRPORT_PLACEHOLDER}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{FLIGHT_FORM_LABELS.AIRLINE}</Label>
                <Input
                  value={segment.airline}
                  onChange={e => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], airline: e.target.value }
                    updateData({ segments })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.AIRLINE_PLACEHOLDER}
                />
              </div>
              <div>
                <Label>{FLIGHT_FORM_LABELS.FLIGHT_NUMBER}</Label>
                <Input
                  value={segment.flightNumber}
                  onChange={e => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], flightNumber: e.target.value }
                    updateData({ segments })
                  }}
                  placeholder="CZ3096"
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addSegment}>
          {FLIGHT_FORM_LABELS.ADD_FLIGHT}
        </Button>
      </div>

      {/* 行李額度 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{FLIGHT_FORM_LABELS.BAGGAGE_ALLOWANCE}</h3>
        {(data.baggage || []).map((bag, index) => (
          <div key={index} className="space-y-2 p-3 bg-card rounded border">
            <div>
              <Label>{FLIGHT_FORM_LABELS.PASSENGER_NAME}</Label>
              <Input
                value={bag.passengerName}
                onChange={e => {
                  const baggage = [...(data.baggage || [])]
                  baggage[index] = { ...baggage[index], passengerName: e.target.value }
                  updateData({ baggage })
                }}
                placeholder={FLIGHT_FORM_LABELS.PASSENGER_NAME_PLACEHOLDER}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>{FLIGHT_FORM_LABELS.PERSONAL_ITEM}</Label>
                <Input
                  value={bag.personalItem}
                  onChange={e => {
                    const baggage = [...(data.baggage || [])]
                    baggage[index] = { ...baggage[index], personalItem: e.target.value }
                    updateData({ baggage })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.PERSONAL_ITEM_PLACEHOLDER}
                />
              </div>
              <div>
                <Label>{FLIGHT_FORM_LABELS.CARRY_ON}</Label>
                <Input
                  value={bag.carryOn}
                  onChange={e => {
                    const baggage = [...(data.baggage || [])]
                    baggage[index] = { ...baggage[index], carryOn: e.target.value }
                    updateData({ baggage })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.CARRY_ON_PLACEHOLDER}
                />
              </div>
              <div>
                <Label>{FLIGHT_FORM_LABELS.CHECKED_BAGGAGE}</Label>
                <Input
                  value={bag.checked}
                  onChange={e => {
                    const baggage = [...(data.baggage || [])]
                    baggage[index] = { ...baggage[index], checked: e.target.value }
                    updateData({ baggage })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.CHECKED_BAGGAGE_PLACEHOLDER}
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addBaggage}>
          {FLIGHT_FORM_LABELS.ADD_BAGGAGE}
        </Button>
      </div>

      {/* 重要資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{FLIGHT_FORM_LABELS.IMPORTANT_INFO}</h3>
        {(data.importantNotes || []).map((note, index) => (
          <div key={index} className="space-y-2">
            <Label>{FLIGHT_FORM_LABELS.NOTE_LABEL} #{index + 1}</Label>
            <Input
              value={note}
              onChange={e => {
                const importantNotes = [...(data.importantNotes || [])]
                importantNotes[index] = e.target.value
                updateData({ importantNotes })
              }}
              placeholder={FLIGHT_FORM_LABELS.NOTE_PLACEHOLDER}
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addImportantNote}>
          {FLIGHT_FORM_LABELS.ADD_NOTE}
        </Button>
      </div>

      {/* 行李詳細資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">{FLIGHT_FORM_LABELS.BAGGAGE_DETAIL_TITLE}</h3>
        {(data.baggageDetails || []).map((detail, index) => (
          <div key={index} className="space-y-2 p-3 bg-card rounded border">
            <div>
              <Label>{FLIGHT_FORM_LABELS.SEGMENT_LABEL}</Label>
              <Input
                value={detail.route}
                onChange={e => {
                  const baggageDetails = [...(data.baggageDetails || [])]
                  baggageDetails[index] = { ...baggageDetails[index], route: e.target.value }
                  updateData({ baggageDetails })
                }}
                placeholder={FLIGHT_FORM_LABELS.SEGMENT_PLACEHOLDER}
              />
            </div>
            <div className="space-y-2">
              <div>
                <Label>{FLIGHT_FORM_LABELS.CARRY_ON_DETAIL}</Label>
                <Input
                  value={detail.carryOnDetail}
                  onChange={e => {
                    const baggageDetails = [...(data.baggageDetails || [])]
                    baggageDetails[index] = {
                      ...baggageDetails[index],
                      carryOnDetail: e.target.value,
                    }
                    updateData({ baggageDetails })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.CARRY_ON_DETAIL_PLACEHOLDER}
                />
              </div>
              <div>
                <Label>{FLIGHT_FORM_LABELS.CHECKED_DETAIL}</Label>
                <Input
                  value={detail.checkedDetail}
                  onChange={e => {
                    const baggageDetails = [...(data.baggageDetails || [])]
                    baggageDetails[index] = {
                      ...baggageDetails[index],
                      checkedDetail: e.target.value,
                    }
                    updateData({ baggageDetails })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.CHECKED_DETAIL_PLACEHOLDER}
                />
              </div>
              <div>
                <Label>{FLIGHT_FORM_LABELS.PERSONAL_ITEM_DETAIL}</Label>
                <Input
                  value={detail.personalItemDetail}
                  onChange={e => {
                    const baggageDetails = [...(data.baggageDetails || [])]
                    baggageDetails[index] = {
                      ...baggageDetails[index],
                      personalItemDetail: e.target.value,
                    }
                    updateData({ baggageDetails })
                  }}
                  placeholder={FLIGHT_FORM_LABELS.PERSONAL_ITEM_DETAIL_PLACEHOLDER}
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addBaggageDetail}>
          {FLIGHT_FORM_LABELS.ADD_BAGGAGE_DETAIL}
        </Button>
      </div>
    </div>
  )
}
