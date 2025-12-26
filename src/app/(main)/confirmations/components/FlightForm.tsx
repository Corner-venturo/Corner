import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
        { nameEn: '', nameZh: '', cabin: '經濟艙', ticketNumber: '', bookingCode: '' },
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
        <Label htmlFor="booking_number">訂單編號 *</Label>
        <Input
          id="booking_number"
          value={formData.booking_number}
          onChange={e => onChange({ ...formData, booking_number: e.target.value })}
          placeholder="1658108098074416"
        />
      </div>

      {/* 旅客資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">旅客資訊</h3>
        {(data.passengers || []).map((passenger, index) => (
          <div key={index} className="space-y-2 p-3 bg-white rounded border">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>英文姓名</Label>
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
                <Label>中文姓名</Label>
                <Input
                  value={passenger.nameZh || ''}
                  onChange={e => {
                    const passengers = [...(data.passengers || [])]
                    passengers[index] = { ...passengers[index], nameZh: e.target.value }
                    updateData({ passengers })
                  }}
                  placeholder="宋紹慶"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>艙等</Label>
                <Input
                  value={passenger.cabin}
                  onChange={e => {
                    const passengers = [...(data.passengers || [])]
                    passengers[index] = { ...passengers[index], cabin: e.target.value }
                    updateData({ passengers })
                  }}
                  placeholder="經濟艙"
                />
              </div>
              <div>
                <Label>票號</Label>
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
                <Label>訂位代號</Label>
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
          + 新增旅客
        </Button>
      </div>

      {/* 航班資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">航班資訊</h3>
        {(data.segments || []).map((segment, index) => (
          <div key={index} className="space-y-2 p-3 bg-white rounded border">
            <div>
              <Label>航段</Label>
              <Input
                value={segment.route}
                onChange={e => {
                  const segments = [...(data.segments || [])]
                  segments[index] = { ...segments[index], route: e.target.value }
                  updateData({ segments })
                }}
                placeholder="台北 - 上海"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>出發日期</Label>
                <DatePicker
                  value={segment.departureDate}
                  onChange={date => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], departureDate: date }
                    updateData({ segments })
                  }}
                  placeholder="選擇日期"
                />
              </div>
              <div>
                <Label>出發時間</Label>
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
                <Label>出發機場</Label>
                <Input
                  value={segment.departureAirport}
                  onChange={e => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], departureAirport: e.target.value }
                    updateData({ segments })
                  }}
                  placeholder="台灣桃園國際機場 T2"
                />
              </div>
              <div>
                <Label>抵達機場</Label>
                <Input
                  value={segment.arrivalAirport}
                  onChange={e => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], arrivalAirport: e.target.value }
                    updateData({ segments })
                  }}
                  placeholder="浦東國際機場 T2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>航空公司</Label>
                <Input
                  value={segment.airline}
                  onChange={e => {
                    const segments = [...(data.segments || [])]
                    segments[index] = { ...segments[index], airline: e.target.value }
                    updateData({ segments })
                  }}
                  placeholder="中國南方航空股份有限公司"
                />
              </div>
              <div>
                <Label>航班號</Label>
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
          + 新增航班
        </Button>
      </div>

      {/* 行李額度 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">行李額度</h3>
        {(data.baggage || []).map((bag, index) => (
          <div key={index} className="space-y-2 p-3 bg-white rounded border">
            <div>
              <Label>旅客姓名</Label>
              <Input
                value={bag.passengerName}
                onChange={e => {
                  const baggage = [...(data.baggage || [])]
                  baggage[index] = { ...baggage[index], passengerName: e.target.value }
                  updateData({ baggage })
                }}
                placeholder="SUNG SHAOCHING (成人)"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>個人物品</Label>
                <Input
                  value={bag.personalItem}
                  onChange={e => {
                    const baggage = [...(data.baggage || [])]
                    baggage[index] = { ...baggage[index], personalItem: e.target.value }
                    updateData({ baggage })
                  }}
                  placeholder="每人 1 件"
                />
              </div>
              <div>
                <Label>手提行李</Label>
                <Input
                  value={bag.carryOn}
                  onChange={e => {
                    const baggage = [...(data.baggage || [])]
                    baggage[index] = { ...baggage[index], carryOn: e.target.value }
                    updateData({ baggage })
                  }}
                  placeholder="每人 1 件，每件 8 公斤"
                />
              </div>
              <div>
                <Label>託運行李</Label>
                <Input
                  value={bag.checked}
                  onChange={e => {
                    const baggage = [...(data.baggage || [])]
                    baggage[index] = { ...baggage[index], checked: e.target.value }
                    updateData({ baggage })
                  }}
                  placeholder="每人 1 件，每件 23 公斤"
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addBaggage}>
          + 新增行李額度
        </Button>
      </div>

      {/* 重要資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">重要資訊</h3>
        {(data.importantNotes || []).map((note, index) => (
          <div key={index} className="space-y-2">
            <Label>注意事項 #{index + 1}</Label>
            <Input
              value={note}
              onChange={e => {
                const importantNotes = [...(data.importantNotes || [])]
                importantNotes[index] = e.target.value
                updateData({ importantNotes })
              }}
              placeholder="在機場的各項登機手續中，乘客須出示購買機票時使用的個人身分證明文件..."
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addImportantNote}>
          + 新增注意事項
        </Button>
      </div>

      {/* 行李詳細資訊 */}
      <div className="space-y-4 p-4 bg-muted rounded-md">
        <h3 className="font-semibold text-morandi-primary">行李詳細資訊</h3>
        {(data.baggageDetails || []).map((detail, index) => (
          <div key={index} className="space-y-2 p-3 bg-white rounded border">
            <div>
              <Label>航段</Label>
              <Input
                value={detail.route}
                onChange={e => {
                  const baggageDetails = [...(data.baggageDetails || [])]
                  baggageDetails[index] = { ...baggageDetails[index], route: e.target.value }
                  updateData({ baggageDetails })
                }}
                placeholder="台北 - 上海"
              />
            </div>
            <div className="space-y-2">
              <div>
                <Label>手提行李詳情</Label>
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
                  placeholder="每人 1 件，每件 8 公斤 每件尺寸上限 55x40x20 公分"
                />
              </div>
              <div>
                <Label>託運行李詳情</Label>
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
                  placeholder="每人 1 件，每件 23 公斤 每件尺寸 (長+寬+高) 上限 158 公分"
                />
              </div>
              <div>
                <Label>個人物品詳情</Label>
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
                  placeholder="每人 1 件 請聯繫航空公司以進一步了解行李政策 必須置於您前面座位的下方。"
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addBaggageDetail}>
          + 新增行李詳細資訊
        </Button>
      </div>
    </div>
  )
}
