'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SimpleDateInput } from '@/components/ui/simple-date-input'
import { Combobox } from '@/components/ui/combobox'
import { AddOrderForm, type OrderFormData } from '@/components/orders/add-order-form'
import { AlertCircle, Search, Loader2 } from 'lucide-react'
import { NewTourData } from '../types'
import { useItineraryStore, useQuoteStore } from '@/stores'
import { useTourDestinations } from '../hooks/useTourDestinations'
import type { Itinerary, Quote } from '@/stores/types'
import { searchFlightAction } from '@/features/dashboard/actions/flight-actions'
import { toast } from 'sonner'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

interface TourFormProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  newTour: NewTourData
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>
  newOrder: Partial<OrderFormData>
  setNewOrder: React.Dispatch<React.SetStateAction<Partial<OrderFormData>>>
  submitting: boolean
  formError: string | null
  onSubmit: () => void
  // 新增：選擇的來源
  selectedItineraryId?: string | null
  setSelectedItineraryId?: (id: string | null) => void
  selectedQuoteId?: string | null
  setSelectedQuoteId?: (id: string | null) => void
}

export function TourForm({
  isOpen,
  onClose,
  mode,
  newTour,
  setNewTour,
  newOrder,
  setNewOrder,
  submitting,
  formError,
  onSubmit,
  selectedItineraryId,
  setSelectedItineraryId,
  selectedQuoteId,
  setSelectedQuoteId,
}: TourFormProps) {
  // 載入行程表和報價單資料
  const { items: itineraries, fetchAll: fetchItineraries } = useItineraryStore()
  const { items: quotes, fetchAll: fetchQuotes } = useQuoteStore()

  // 使用新的目的地系統
  const {
    destinations,
    countries,
    loading: destinationsLoading,
    getCitiesByCountry,
    getAirportCode,
    addDestination,
  } = useTourDestinations()

  // 航班查詢狀態
  const [loadingOutbound, setLoadingOutbound] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)

  // 目的地輸入狀態
  const [cityInput, setCityInput] = useState('')
  const [showAirportCodeDialog, setShowAirportCodeDialog] = useState(false)
  const [newAirportCode, setNewAirportCode] = useState('')
  const [pendingCity, setPendingCity] = useState('')
  const [pendingCountry, setPendingCountry] = useState('')
  const [savingDestination, setSavingDestination] = useState(false)

  // 查詢去程航班
  const handleSearchOutbound = useCallback(async () => {
    const flightNumber = newTour.outbound_flight_number
    if (!flightNumber) {
      toast.warning('請先輸入航班號碼')
      return
    }

    // 使用出發日期或今天
    const flightDate = newTour.departure_date || new Date().toISOString().split('T')[0]

    setLoadingOutbound(true)
    try {
      const result = await searchFlightAction(flightNumber, flightDate)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.data) {
        // 組合航班資訊文字
        const flightText = `${result.data.airline} ${result.data.flightNumber} ${result.data.departure.time}-${result.data.arrival.time}`
        setNewTour(prev => ({
          ...prev,
          outbound_flight_text: flightText,
          outbound_flight_number: result.data!.flightNumber,
        }))
        toast.success(`已查詢到航班: ${result.data.airline} ${result.data.flightNumber}`)
      }
    } catch {
      toast.error('查詢航班時發生錯誤')
    } finally {
      setLoadingOutbound(false)
    }
  }, [newTour.outbound_flight_number, newTour.departure_date, setNewTour])

  // 查詢回程航班
  const handleSearchReturn = useCallback(async () => {
    const flightNumber = newTour.return_flight_number
    if (!flightNumber) {
      toast.warning('請先輸入航班號碼')
      return
    }

    // 使用回程日期或今天
    const flightDate = newTour.return_date || new Date().toISOString().split('T')[0]

    setLoadingReturn(true)
    try {
      const result = await searchFlightAction(flightNumber, flightDate)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.data) {
        // 組合航班資訊文字
        const flightText = `${result.data.airline} ${result.data.flightNumber} ${result.data.departure.time}-${result.data.arrival.time}`
        setNewTour(prev => ({
          ...prev,
          return_flight_text: flightText,
          return_flight_number: result.data!.flightNumber,
        }))
        toast.success(`已查詢到航班: ${result.data.airline} ${result.data.flightNumber}`)
      }
    } catch {
      toast.error('查詢航班時發生錯誤')
    } finally {
      setLoadingReturn(false)
    }
  }, [newTour.return_flight_number, newTour.return_date, setNewTour])

  // 打開對話框時載入資料
  useEffect(() => {
    if (isOpen && mode === 'create') {
      fetchItineraries()
      fetchQuotes()
    }
  }, [isOpen, mode, fetchItineraries, fetchQuotes])

  // 過濾可用的行程表（未關聯旅遊團的）
  const availableItineraries = useMemo(() => {
    return itineraries
      .filter(i => !i.tour_id && !(i as { _deleted?: boolean })._deleted)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [itineraries])

  // 過濾可用的報價單（未關聯旅遊團的）
  const availableQuotes = useMemo(() => {
    return quotes
      .filter(q => !q.tour_id && !(q as { _deleted?: boolean })._deleted)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [quotes])

  // 處理選擇行程表
  const handleItinerarySelect = (itineraryId: string) => {
    if (!itineraryId) {
      setSelectedItineraryId?.(null)
      return
    }

    const itinerary = itineraries.find(i => i.id === itineraryId)
    if (itinerary) {
      setSelectedItineraryId?.(itineraryId)
      // 清除報價單選擇
      setSelectedQuoteId?.(null)
      // 自動帶入資料
      setNewTour(prev => ({
        ...prev,
        name: itinerary.title || prev.name,
        departure_date: itinerary.departure_date
          ? itinerary.departure_date.replace(/\//g, '-')
          : prev.departure_date,
      }))
    }
  }

  // 處理選擇報價單
  const handleQuoteSelect = (quoteId: string) => {
    if (!quoteId) {
      setSelectedQuoteId?.(null)
      return
    }

    const quote = quotes.find(q => q.id === quoteId)
    if (quote) {
      setSelectedQuoteId?.(quoteId)
      // 清除行程表選擇
      setSelectedItineraryId?.(null)
      // 自動帶入資料（Quote 沒有 start_date 欄位，只帶入名稱、價格、人數）
      setNewTour(prev => ({
        ...prev,
        name: quote.name || prev.name,
        price: Math.round((quote.total_cost ?? 0) / (quote.group_size ?? 1)),
        max_participants: quote.group_size || prev.max_participants,
      }))
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent
        className="max-w-6xl w-[90vw] h-[80vh] overflow-hidden"
        aria-describedby={undefined}
        onInteractOutside={e => {
          // 防止點擊 Select 下拉選單時關閉 Dialog
          const target = e.target as HTMLElement
          if (target.closest('[role="listbox"]') || target.closest('select')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? '編輯旅遊團' : '新增旅遊團 & 訂單'}</DialogTitle>
        </DialogHeader>

        {/* Error message */}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="text-sm">{formError}</div>
            </div>
          </div>
        )}

        <div className="flex h-full overflow-hidden">
          {/* Left side - Tour info */}
          <div className="flex-1 pr-6 border-r border-border">
            <div className="h-full overflow-y-auto">
              <h3 className="text-lg font-medium text-morandi-primary mb-4">旅遊團資訊</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">旅遊團名稱</label>
                  <Input
                    value={newTour.name}
                    onChange={e => setNewTour(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                {/* Destination selection - 簡化版 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-morandi-primary">國家</label>
                    <Combobox
                      value={newTour.countryCode}
                      onChange={country => {
                        setNewTour(prev => ({
                          ...prev,
                          countryCode: country,
                          cityCode: '', // 清空城市選擇
                        }))
                      }}
                      options={countries.map(country => ({
                        value: country,
                        label: country,
                      }))}
                      placeholder={destinationsLoading ? '載入中...' : '選擇國家...'}
                      emptyMessage="找不到國家"
                      showSearchIcon={true}
                      showClearButton={true}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-morandi-primary">城市 (機場代碼)</label>
                    <div className="flex gap-2 mt-1">
                      {(() => {
                        const citiesForCountry = newTour.countryCode ? getCitiesByCountry(newTour.countryCode) : []
                        return (
                          <Combobox
                            value={newTour.cityCode}
                            onChange={cityCode => {
                              const selectedCity = citiesForCountry.find(c => c.airport_code === cityCode)
                              setNewTour(prev => ({
                                ...prev,
                                cityCode,
                                cityName: selectedCity?.city || cityCode
                              }))
                            }}
                            options={citiesForCountry.map(c => ({
                              value: c.airport_code,
                              label: `${c.city} (${c.airport_code})`,
                            }))}
                            placeholder={!newTour.countryCode ? '請先選擇國家' : '選擇城市...'}
                            emptyMessage="找不到城市"
                            showSearchIcon={true}
                            showClearButton={true}
                            disabled={!newTour.countryCode}
                            className="flex-1"
                          />
                        )
                      })()}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!newTour.countryCode) {
                            toast.warning('請先選擇國家')
                            return
                          }
                          setPendingCity('')
                          setPendingCountry(newTour.countryCode)
                          setNewAirportCode('')
                          setShowAirportCodeDialog(true)
                        }}
                        disabled={!newTour.countryCode}
                        className="h-9 px-2 shrink-0"
                        title="新增城市"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 顯示當前選擇的城市代碼 */}
                {newTour.cityCode && (
                  <p className="text-xs text-morandi-secondary">
                    團號城市代碼：<span className="font-mono font-semibold">{newTour.cityCode}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-morandi-primary">出發日期</label>
                    <SimpleDateInput
                      value={newTour.departure_date}
                      onChange={departure_date => {
                        setNewTour(prev => {
                          const newReturnDate =
                            prev.return_date && prev.return_date < departure_date
                              ? departure_date
                              : prev.return_date

                          return {
                            ...prev,
                            departure_date,
                            return_date: newReturnDate,
                          }
                        })
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-morandi-primary">返回日期</label>
                    <SimpleDateInput
                      value={newTour.return_date}
                      onChange={return_date => {
                        setNewTour(prev => ({ ...prev, return_date }))
                      }}
                      min={newTour.departure_date || new Date().toISOString().split('T')[0]}
                      defaultMonth={newTour.departure_date}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">描述</label>
                  <Input
                    value={newTour.description || ''}
                    onChange={e => setNewTour(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                {/* 航班資訊（選填） */}
                <div className="border-t pt-4 mt-4">
                  <label className="text-sm font-medium text-morandi-primary mb-3 block">航班資訊（選填）</label>
                  <div className="space-y-3">
                    {/* 去程航班 */}
                    <div className="bg-morandi-container/20 p-3 rounded-lg">
                      <label className="text-xs font-medium text-morandi-secondary mb-2 block">去程航班</label>
                      <div className="flex gap-2">
                        <div className="w-28">
                          <Input
                            value={newTour.outbound_flight_number || ''}
                            onChange={e => setNewTour(prev => ({ ...prev, outbound_flight_number: e.target.value.toUpperCase() }))}
                            placeholder="航班號碼"
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleSearchOutbound}
                          disabled={loadingOutbound || !newTour.outbound_flight_number}
                          className="h-9 gap-1"
                        >
                          {loadingOutbound ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Search size={14} />
                          )}
                          查詢
                        </Button>
                        <div className="flex-1">
                          <Input
                            value={newTour.outbound_flight_text || ''}
                            onChange={e => setNewTour(prev => ({ ...prev, outbound_flight_text: e.target.value }))}
                            placeholder="查詢後自動帶入，或手動輸入"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 回程航班 */}
                    <div className="bg-morandi-container/20 p-3 rounded-lg">
                      <label className="text-xs font-medium text-morandi-secondary mb-2 block">回程航班</label>
                      <div className="flex gap-2">
                        <div className="w-28">
                          <Input
                            value={newTour.return_flight_number || ''}
                            onChange={e => setNewTour(prev => ({ ...prev, return_flight_number: e.target.value.toUpperCase() }))}
                            placeholder="航班號碼"
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleSearchReturn}
                          disabled={loadingReturn || !newTour.return_flight_number}
                          className="h-9 gap-1"
                        >
                          {loadingReturn ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Search size={14} />
                          )}
                          查詢
                        </Button>
                        <div className="flex-1">
                          <Input
                            value={newTour.return_flight_text || ''}
                            onChange={e => setNewTour(prev => ({ ...prev, return_flight_text: e.target.value }))}
                            placeholder="查詢後自動帶入，或手動輸入"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isSpecial"
                      checked={newTour.isSpecial}
                      onChange={e => setNewTour(prev => ({ ...prev, isSpecial: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="isSpecial" className="text-sm text-morandi-primary">
                      特殊團
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableCheckin"
                      checked={newTour.enable_checkin || false}
                      onChange={e => setNewTour(prev => ({ ...prev, enable_checkin: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="enableCheckin" className="text-sm text-morandi-primary">
                      開啟報到功能
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Order info */}
          <div className="flex-1 pl-6">
            <div className="h-full overflow-y-auto">
              {/* 關聯行程表或報價單（僅在新增模式顯示） */}
              {mode === 'create' && (
                <div className="mb-6 pb-4 border-b border-border">
                  <h3 className="text-lg font-medium text-morandi-primary mb-4">關聯文件（選填）</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-morandi-primary">關聯行程表</label>
                      <Combobox
                        options={[
                          { value: '', label: '獨立旅遊團（無行程表）' },
                          ...availableItineraries.map(itinerary => ({
                            value: itinerary.id,
                            label: `${itinerary.tour_code || '無編號'} - ${stripHtml(itinerary.title) || '未命名'}`,
                          })),
                        ]}
                        value={selectedItineraryId || ''}
                        onChange={handleItinerarySelect}
                        placeholder="搜尋或選擇行程表..."
                        emptyMessage="找不到行程表"
                        className="mt-1"
                        disabled={!!selectedQuoteId}
                      />
                      <p className="text-xs text-morandi-secondary mt-1">
                        選擇後自動帶入行程資料
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-morandi-primary">關聯報價單</label>
                      <Combobox
                        options={[
                          { value: '', label: '獨立旅遊團（無報價單）' },
                          ...availableQuotes.map(quote => ({
                            value: quote.id,
                            label: `${quote.code || '無編號'} - ${stripHtml(quote.name) || stripHtml(quote.destination) || '未命名'}`,
                          })),
                        ]}
                        value={selectedQuoteId || ''}
                        onChange={handleQuoteSelect}
                        placeholder="搜尋或選擇報價單..."
                        emptyMessage="找不到報價單"
                        className="mt-1"
                        disabled={!!selectedItineraryId}
                      />
                      <p className="text-xs text-morandi-secondary mt-1">
                        選擇後自動帶入報價資料
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-medium text-morandi-primary mb-4">
                同時新增訂單（選填）
              </h3>

              <AddOrderForm tourId="embedded" value={newOrder} onChange={setNewOrder} />

              <div className="bg-morandi-container/20 p-3 rounded-lg mt-4">
                <p className="text-xs text-morandi-secondary">
                  提示：如果填寫了聯絡人，將會同時建立一筆訂單。如果留空，則只建立旅遊團。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="flex justify-end space-x-2 pt-6 border-t border-border mt-6">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              submitting || !newTour.name.trim() || !newTour.departure_date || !newTour.return_date
            }
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {submitting
              ? '建立中...'
              : newOrder.contact_person
                ? '新增旅遊團 & 訂單'
                : '新增旅遊團'}
          </Button>
        </div>

        {/* 新增城市機場代碼對話框 */}
        <Dialog open={showAirportCodeDialog} onOpenChange={setShowAirportCodeDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>新增目的地城市</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-morandi-secondary">
                為「<span className="font-medium text-morandi-primary">{pendingCountry}</span>」新增城市
              </p>
              <div>
                <label className="text-sm font-medium text-morandi-primary">城市名稱</label>
                <Input
                  value={pendingCity}
                  onChange={e => setPendingCity(e.target.value)}
                  placeholder="例如: 清邁、曼谷"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">機場代碼 (IATA)</label>
                <Input
                  value={newAirportCode}
                  onChange={e => setNewAirportCode(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="例如: CNX, BKK, NRT"
                  className="mt-1 font-mono uppercase"
                  maxLength={3}
                />
                <p className="text-xs text-morandi-secondary mt-1">
                  請輸入該城市主要機場的 3 位數 IATA 代碼
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAirportCodeDialog(false)
                  setPendingCity('')
                  setPendingCountry('')
                  setNewAirportCode('')
                }}
                disabled={savingDestination}
              >
                取消
              </Button>
              <Button
                onClick={async () => {
                  if (newAirportCode.length !== 3) {
                    toast.error('機場代碼必須是 3 個字母')
                    return
                  }
                  setSavingDestination(true)
                  try {
                    const result = await addDestination(pendingCountry, pendingCity, newAirportCode)
                    if (result.success) {
                      setNewTour(prev => ({ ...prev, cityCode: newAirportCode }))
                      toast.success(`已新增目的地: ${pendingCity} (${newAirportCode})`)
                      setShowAirportCodeDialog(false)
                      setPendingCity('')
                      setPendingCountry('')
                      setNewAirportCode('')
                    } else {
                      toast.error(result.error || '新增失敗')
                    }
                  } finally {
                    setSavingDestination(false)
                  }
                }}
                disabled={savingDestination || newAirportCode.length !== 3}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {savingDestination ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" />
                    儲存中...
                  </>
                ) : (
                  '確認新增'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
