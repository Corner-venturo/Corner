'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Building2, Plane, Search, CalendarDays, Loader2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useItineraries, useEmployees, useQuotes, useTours } from '@/hooks/cloud-hooks'
// 🔧 優化：移除 useCountries/useCities，Itinerary 已有 denormalized 欄位
import { useCountries } from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStore } from '@/stores'
import type { Itinerary } from '@/stores/types'
import type { Quote } from '@/types/quote.types'
import { useItineraryPageState } from './hooks/useItineraryPageState'
import { useItineraryForm } from './hooks/useItineraryForm'
import { useFlightSearch } from './hooks/useFlightSearch'
import { useItineraryActions } from './hooks/useItineraryActions'
import { useItineraryTableColumns } from './hooks/useItineraryTableColumns'
import { useItineraryFilters } from './hooks/useItineraryFilters'
import { stripHtml } from '@/lib/utils/string-utils'

const statusFilters = ['全部', '提案', '進行中', '公司範例', '結案']

export default function ItineraryPage() {
  const router = useRouter()
  const { items: itineraries, delete: deleteItinerary, update: updateItinerary, create: createItinerary } = useItineraries()
  const { items: quotes, create: createQuote, update: updateQuote } = useQuotes()
  const { items: employees } = useEmployees()
  const { items: tours } = useTours()
  const { user } = useAuthStore()
  const { workspaces, loadWorkspaces } = useWorkspaceStore()
  // 🔧 優化：countries 只用於新增對話框，cities 已不需要（Itinerary 有 denormalized 欄位）
  const { items: countries } = useCountries()

  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.permissions?.includes('super_admin')

  useEffect(() => {
    if (isSuperAdmin && workspaces.length === 0) {
      loadWorkspaces()
    }
  }, [isSuperAdmin])

  // 🔧 優化：移除無條件 fetchAll，改為 Dialog 開啟時才載入
  // regionsStore.fetchAll() 移到 CreateItineraryDialog 內

  // Custom hooks
  const pageState = useItineraryPageState()
  const formState = useItineraryForm({ createItinerary, userId: user?.id })
  const flightSearch = useFlightSearch({
    outboundFlight: formState.newItineraryOutboundFlight,
    setOutboundFlight: formState.setNewItineraryOutboundFlight,
    returnFlight: formState.newItineraryReturnFlight,
    setReturnFlight: formState.setNewItineraryReturnFlight,
    departureDate: formState.newItineraryDepartureDate,
    days: formState.newItineraryDays,
  })

  const actions = useItineraryActions({
    updateItinerary: updateItinerary as (id: string, data: Partial<Itinerary>) => Promise<Itinerary | void>,
    deleteItinerary,
    createItinerary: createItinerary as (data: Partial<Itinerary>) => Promise<Itinerary | null>,
    createQuote: createQuote as (data: Partial<Quote>) => Promise<Quote | null>,
    updateQuote: updateQuote as (id: string, data: Partial<Quote>) => Promise<Quote | void>,
    quotes: quotes as Quote[],
    userId: user?.id,
    userName: user?.name,
    pageState,
  })

  // 🔧 優化：移除 countries/cities 參數，Itinerary 已有 denormalized 欄位
  const { tableColumns } = useItineraryTableColumns({
    employees,
    tours,
    handleDelete: actions.handleDelete,
    handleOpenDuplicateDialog: actions.handleOpenDuplicateDialog,
    handleArchive: actions.handleArchive,
    handleUnarchive: actions.handleUnarchive,
    handleSetTemplate: actions.handleSetTemplate,
    handleClose: actions.handleClose,
    handleReopen: actions.handleReopen,
    isItineraryClosed: actions.isItineraryClosed,
  })

  const { filteredItineraries } = useItineraryFilters({
    itineraries,
    statusFilter: pageState.statusFilter,
    searchTerm: pageState.searchTerm,
    authorFilter: pageState.authorFilter,
    userId: user?.id,
    isSuperAdmin: !!isSuperAdmin,
    isItineraryClosed: actions.isItineraryClosed,
  })

  // 打開新增行程對話框
  const handleOpenTypeSelect = useCallback(() => {
    formState.resetForm()
    // 🔧 優化：SWR 自動載入 regions，不需要手動 fetchAll()
    pageState.setIsTypeSelectOpen(true)
  }, [formState, pageState])

  // 建立行程
  const handleCreateItinerary = useCallback(async () => {
    const success = await formState.handleCreateItinerary()
    if (success) {
      pageState.setIsTypeSelectOpen(false)
    }
  }, [formState, pageState])

  // Memoize filtered employees for author select to prevent infinite re-renders
  const filteredEmployeesForSelect = useMemo(() => {
    return employees.filter(emp =>
      emp.id !== user?.id &&
      itineraries.some(it => it.created_by === emp.id)
    )
  }, [employees, user?.id, itineraries])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="行程管理"
        showSearch={true}
        searchTerm={pageState.searchTerm}
        onSearchChange={pageState.setSearchTerm}
        searchPlaceholder="搜尋行程..."
      >
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {statusFilters.map(filter => (
              <button
                key={filter}
                onClick={() => pageState.setStatusFilter(filter)}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  pageState.statusFilter === filter
                    ? 'bg-morandi-gold text-white'
                    : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select value={pageState.authorFilter} onValueChange={pageState.setAuthorFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-sm">
                <SelectValue placeholder="我的行程" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__mine__">我的行程</SelectItem>
                <SelectItem value="all">全部作者</SelectItem>
                {filteredEmployeesForSelect.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.display_name || emp.chinese_name || emp.english_name || emp.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSuperAdmin && workspaces.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-morandi-blue" />
              <Select
                value={localStorage.getItem('itinerary_workspace_filter') || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    localStorage.removeItem('itinerary_workspace_filter')
                  } else {
                    localStorage.setItem('itinerary_workspace_filter', value)
                  }
                  window.location.reload()
                }}
              >
                <SelectTrigger className="w-auto min-w-[100px] h-8 text-sm border-morandi-blue/30">
                  <SelectValue placeholder="全部分公司" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分公司</SelectItem>
                  {workspaces.map((ws: { id: string; name: string }) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </ResponsiveHeader>

      {/* 新增行程對話框 */}
      <CreateItineraryDialog
        isOpen={pageState.isTypeSelectOpen}
        onOpenChange={pageState.setIsTypeSelectOpen}
        formState={formState}
        flightSearch={flightSearch}
        countries={countries}
        onCreateItinerary={handleCreateItinerary}
      />

      {/* 密碼解鎖對話框 */}
      <PasswordDialog
        isOpen={pageState.isPasswordDialogOpen}
        onOpenChange={pageState.setIsPasswordDialogOpen}
        passwordInput={pageState.passwordInput}
        onPasswordChange={pageState.setPasswordInput}
        onSubmit={actions.handlePasswordSubmit}
      />

      {/* 複製行程對話框 */}
      <DuplicateDialog
        isOpen={pageState.isDuplicateDialogOpen}
        onOpenChange={pageState.setIsDuplicateDialogOpen}
        duplicateSource={pageState.duplicateSource}
        duplicateTourCode={pageState.duplicateTourCode}
        duplicateTitle={pageState.duplicateTitle}
        isDuplicating={pageState.isDuplicating}
        onTourCodeChange={pageState.setDuplicateTourCode}
        onTitleChange={pageState.setDuplicateTitle}
        onSubmit={actions.handleDuplicateSubmit}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns as TableColumn[]}
            data={filteredItineraries}
            onRowClick={(itinerary) => actions.handleRowClick(itinerary as Itinerary)}
            rowClassName={(row) => {
              const itinerary = row as Itinerary
              if (itinerary.tour_id) {
                return 'bg-morandi-blue/5 hover:bg-morandi-blue/10'
              }
              if (!itinerary.tour_id && !itinerary.is_template) {
                return 'bg-status-danger-bg hover:bg-status-danger-bg'
              }
              return ''
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ===== 子組件 =====

interface CreateItineraryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formState: ReturnType<typeof useItineraryForm>
  flightSearch: ReturnType<typeof useFlightSearch>
  countries: Array<{ id: string; name: string }>
  onCreateItinerary: () => Promise<void>
}

function CreateItineraryDialog({
  isOpen,
  onOpenChange,
  formState,
  flightSearch,
  countries,
  onCreateItinerary,
}: CreateItineraryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-5xl h-[90vh] overflow-hidden p-0">
        <div className="flex h-full">
          {/* 左側：基本資訊 */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-morandi-gold" />
                新增行程表
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newItineraryTitle">行程名稱 *</Label>
                <Input
                  id="newItineraryTitle"
                  placeholder="例：沖繩五日遊"
                  value={formState.newItineraryTitle}
                  onChange={e => formState.setNewItineraryTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newItineraryTourCode">行程編號（選填）</Label>
                <Input
                  id="newItineraryTourCode"
                  placeholder="例：25JOK21CIG"
                  value={formState.newItineraryTourCode}
                  onChange={e => formState.setNewItineraryTourCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>國家</Label>
                <Select
                  value={formState.newItineraryCountry}
                  onValueChange={formState.setNewItineraryCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇國家" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>出發日期 *</Label>
                  <DatePicker
                    value={formState.newItineraryDepartureDate}
                    onChange={date => formState.setNewItineraryDepartureDate(date)}
                    placeholder="選擇出發日期"
                  />
                </div>
                <div className="space-y-2">
                  <Label>行程天數 *</Label>
                  <Select
                    value={formState.newItineraryDays}
                    onValueChange={formState.setNewItineraryDays}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇天數" />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7, 8, 9, 10].map(day => (
                        <SelectItem key={day} value={String(day)}>
                          {day} 天
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 航班資訊 */}
              <FlightInputSection formState={formState} flightSearch={flightSearch} />

              {/* 按鈕 */}
              <div className="flex justify-end gap-2 pt-4 mt-2 relative">
                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-morandi-muted/40 to-transparent" />
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={formState.isCreatingItinerary}
                  className="gap-2"
                >
                  <X size={16} />
                  取消
                </Button>
                <Button
                  onClick={onCreateItinerary}
                  disabled={formState.isCreatingItinerary || !formState.newItineraryTitle.trim() || !formState.newItineraryDepartureDate || !formState.newItineraryDays}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
                >
                  {formState.isCreatingItinerary ? (
                    <>建立中...</>
                  ) : (
                    <>
                      <Plane size={14} />
                      建立行程
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 中間分隔線 */}
          <div className="flex items-center py-8">
            <div className="w-px h-full bg-gradient-to-b from-transparent via-morandi-muted/40 to-transparent" />
          </div>

          {/* 右側：每日行程預覽 */}
          <DailyItineraryPreview formState={formState} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface FlightInputSectionProps {
  formState: ReturnType<typeof useItineraryForm>
  flightSearch: ReturnType<typeof useFlightSearch>
}

function FlightInputSection({ formState, flightSearch }: FlightInputSectionProps) {
  return (
    <div className="pt-4 mt-4 relative">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-morandi-muted/40 to-transparent" />
      <Label className="text-morandi-primary mb-3 block">航班資訊（選填）</Label>
      <div className="space-y-3">
        {/* 去程航班 */}
        <div className="p-2 rounded-lg border border-morandi-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-morandi-primary">去程</span>
              {formState.newItineraryOutboundFlight?.departureDate && (
                <span className="text-xs text-morandi-gold font-medium">({formState.newItineraryOutboundFlight.departureDate})</span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={flightSearch.handleSearchOutboundFlight}
              disabled={flightSearch.loadingOutboundFlight || !formState.newItineraryOutboundFlight?.flightNumber}
              className="h-5 text-[10px] gap-1 px-2"
            >
              {flightSearch.loadingOutboundFlight ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
              查詢
            </Button>
          </div>
          {/* 多航段選擇器 */}
          {flightSearch.outboundSegments.length > 0 && (
            <div className="bg-card p-2 rounded border border-morandi-gold/30 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-morandi-secondary">此航班有多個航段，請選擇：</p>
                <button
                  type="button"
                  onClick={flightSearch.clearOutboundSegments}
                  className="text-[10px] text-morandi-secondary hover:text-morandi-primary"
                >
                  取消
                </button>
              </div>
              {flightSearch.outboundSegments.map((seg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => flightSearch.handleSelectOutboundSegment(seg)}
                  className="w-full text-left p-1.5 rounded border border-border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-morandi-primary">
                      {seg.departureAirport} → {seg.arrivalAirport}
                    </span>
                    <span className="text-[10px] text-morandi-secondary">
                      {seg.departureTime} - {seg.arrivalTime}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-6 gap-1">
            <Input placeholder="航班" value={formState.newItineraryOutboundFlight?.flightNumber || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, flightNumber: e.target.value, airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="航空" value={formState.newItineraryOutboundFlight?.airline || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, airline: e.target.value, flightNumber: prev?.flightNumber || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="出發" value={formState.newItineraryOutboundFlight?.departureAirport || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, departureAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="抵達" value={formState.newItineraryOutboundFlight?.arrivalAirport || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, arrivalAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="起飛" value={formState.newItineraryOutboundFlight?.departureTime || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, departureTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="降落" value={formState.newItineraryOutboundFlight?.arrivalTime || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, arrivalTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
          </div>
        </div>

        {/* 回程航班 */}
        <div className="p-2 rounded-lg border border-morandi-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-morandi-primary">回程</span>
              {formState.newItineraryReturnFlight?.departureDate && (
                <span className="text-xs text-morandi-gold font-medium">({formState.newItineraryReturnFlight.departureDate})</span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={flightSearch.handleSearchReturnFlight}
              disabled={flightSearch.loadingReturnFlight || !formState.newItineraryReturnFlight?.flightNumber}
              className="h-5 text-[10px] gap-1 px-2"
            >
              {flightSearch.loadingReturnFlight ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
              查詢
            </Button>
          </div>
          {/* 多航段選擇器 */}
          {flightSearch.returnSegments.length > 0 && (
            <div className="bg-card p-2 rounded border border-morandi-gold/30 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-morandi-secondary">此航班有多個航段，請選擇：</p>
                <button
                  type="button"
                  onClick={flightSearch.clearReturnSegments}
                  className="text-[10px] text-morandi-secondary hover:text-morandi-primary"
                >
                  取消
                </button>
              </div>
              {flightSearch.returnSegments.map((seg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => flightSearch.handleSelectReturnSegment(seg)}
                  className="w-full text-left p-1.5 rounded border border-border hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-morandi-primary">
                      {seg.departureAirport} → {seg.arrivalAirport}
                    </span>
                    <span className="text-[10px] text-morandi-secondary">
                      {seg.departureTime} - {seg.arrivalTime}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-6 gap-1">
            <Input placeholder="航班" value={formState.newItineraryReturnFlight?.flightNumber || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, flightNumber: e.target.value, airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="航空" value={formState.newItineraryReturnFlight?.airline || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, airline: e.target.value, flightNumber: prev?.flightNumber || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="出發" value={formState.newItineraryReturnFlight?.departureAirport || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, departureAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="抵達" value={formState.newItineraryReturnFlight?.arrivalAirport || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, arrivalAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="起飛" value={formState.newItineraryReturnFlight?.departureTime || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, departureTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
            <Input placeholder="降落" value={formState.newItineraryReturnFlight?.arrivalTime || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, arrivalTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface DailyItineraryPreviewProps {
  formState: ReturnType<typeof useItineraryForm>
}

function DailyItineraryPreview({ formState }: DailyItineraryPreviewProps) {
  // 取得實際住宿（處理續住邏輯）
  const getEffectiveAccommodation = (dayIndex: number): string => {
    const dayData = formState.newItineraryDailyData[dayIndex]
    if (!dayData) return ''

    // 如果不是續住，直接返回當天住宿
    if (!dayData.isSameAccommodation) {
      return dayData.accommodation || ''
    }

    // 續住：往前找到最近的非續住住宿
    for (let i = dayIndex - 1; i >= 0; i--) {
      const prevDay = formState.newItineraryDailyData[i]
      if (!prevDay?.isSameAccommodation) {
        return prevDay?.accommodation || ''
      }
    }
    return ''
  }

  // 處理續住勾選
  const handleSameAccommodationChange = (dayIndex: number, checked: boolean) => {
    formState.setNewItineraryDailyData(prev => {
      const updated = [...prev]
      if (checked) {
        // 勾選續住：複製前一天的住宿
        const prevAccommodation = getEffectiveAccommodation(dayIndex - 1)
        updated[dayIndex] = {
          ...updated[dayIndex],
          isSameAccommodation: true,
          accommodation: prevAccommodation,
        }
      } else {
        // 取消續住：清空住宿讓用戶重新填寫
        updated[dayIndex] = {
          ...updated[dayIndex],
          isSameAccommodation: false,
          accommodation: '',
        }
      }
      return updated
    })
  }

  // 當住宿變更時，更新所有續住的後續天數
  const updateDayData = (dayIndex: number, field: string, value: string) => {
    formState.setNewItineraryDailyData(prev => {
      const updated = [...prev]
      updated[dayIndex] = { ...updated[dayIndex], [field]: value }

      // 如果修改的是住宿，更新後續所有續住的天數
      if (field === 'accommodation') {
        for (let i = dayIndex + 1; i < updated.length; i++) {
          if (updated[i]?.isSameAccommodation) {
            updated[i] = { ...updated[i], accommodation: value }
          } else {
            break // 遇到非續住的就停止
          }
        }
      }

      return updated
    })
  }

  return (
    <div className="w-1/2 p-6 overflow-y-auto">
      <h3 className="text-sm font-bold text-morandi-primary mb-4">每日行程</h3>
      {formState.newItineraryDays ? (
        <div className="space-y-3">
          {Array.from({ length: parseInt(formState.newItineraryDays) }, (_, i) => {
            const dayNum = i + 1
            const isFirst = dayNum === 1
            const isLast = dayNum === parseInt(formState.newItineraryDays)
            let dateLabel = ''
            if (formState.newItineraryDepartureDate) {
              const date = new Date(formState.newItineraryDepartureDate)
              date.setDate(date.getDate() + i)
              dateLabel = `${date.getMonth() + 1}/${date.getDate()}`
            }
            const dayData = formState.newItineraryDailyData[i] || { title: '', breakfast: '', lunch: '', dinner: '', accommodation: '', isSameAccommodation: false }
            const effectiveAccommodation = getEffectiveAccommodation(i)

            return (
              <div key={dayNum} className="p-3 rounded-lg border border-morandi-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-morandi-gold text-white text-xs font-bold px-2 py-0.5 rounded">
                    Day {dayNum}
                  </span>
                  {dateLabel && <span className="text-xs text-morandi-secondary">({dateLabel})</span>}
                </div>
                <Input
                  placeholder={isFirst ? '抵達目的地' : isLast ? '返回台灣' : '每日標題'}
                  className="h-8 text-sm mb-2"
                  value={dayData.title}
                  onChange={e => updateDayData(i, 'title', e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder={isFirst ? '溫暖的家' : '早餐'}
                    className="h-8 text-xs"
                    value={dayData.breakfast}
                    onChange={e => updateDayData(i, 'breakfast', e.target.value)}
                  />
                  <Input
                    placeholder="午餐"
                    className="h-8 text-xs"
                    value={dayData.lunch}
                    onChange={e => updateDayData(i, 'lunch', e.target.value)}
                  />
                  <Input
                    placeholder="晚餐"
                    className="h-8 text-xs"
                    value={dayData.dinner}
                    onChange={e => updateDayData(i, 'dinner', e.target.value)}
                  />
                </div>
                {!isLast && (
                  <div className="mt-2 space-y-1">
                    {/* 續住勾選（第二天以後才顯示） */}
                    {!isFirst && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dayData.isSameAccommodation || false}
                          onChange={e => handleSameAccommodationChange(i, e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-morandi-muted text-morandi-gold focus:ring-morandi-gold"
                        />
                        <span className="text-xs text-morandi-secondary">
                          續住
                          {dayData.isSameAccommodation && effectiveAccommodation && (
                            <span className="text-morandi-gold ml-1">（{effectiveAccommodation}）</span>
                          )}
                        </span>
                      </label>
                    )}
                    {/* 住宿輸入欄位 */}
                    {!dayData.isSameAccommodation && (
                      <Input
                        placeholder="住宿飯店"
                        className="h-8 text-xs"
                        value={dayData.accommodation}
                        onChange={e => updateDayData(i, 'accommodation', e.target.value)}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-morandi-secondary text-sm">
          請先選擇行程天數
        </div>
      )}
    </div>
  )
}

interface PasswordDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  passwordInput: string
  onPasswordChange: (value: string) => void
  onSubmit: () => void
}

function PasswordDialog({ isOpen, onOpenChange, passwordInput, onPasswordChange, onSubmit }: PasswordDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>編輯進行中行程</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-morandi-secondary mb-4">
            此行程已綁定旅遊團，為避免誤觸修改，請輸入公司密碼以解鎖編輯。
          </p>
          <Input
            type="password"
            placeholder="請輸入公司密碼"
            value={passwordInput}
            onChange={e => onPasswordChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                onSubmit()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button onClick={onSubmit} className="gap-2">
            <Check size={16} />
            套用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DuplicateDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  duplicateSource: Itinerary | null
  duplicateTourCode: string
  duplicateTitle: string
  isDuplicating: boolean
  onTourCodeChange: (value: string) => void
  onTitleChange: (value: string) => void
  onSubmit: () => Promise<void>
}

function DuplicateDialog({
  isOpen,
  onOpenChange,
  duplicateSource,
  duplicateTourCode,
  duplicateTitle,
  isDuplicating,
  onTourCodeChange,
  onTitleChange,
  onSubmit,
}: DuplicateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-md">
        <DialogHeader>
          <DialogTitle>複製行程</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-morandi-secondary">
            正在複製：<span className="font-medium text-morandi-primary">{stripHtml(duplicateSource?.title)}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="duplicateTourCode">行程編號 *</Label>
            <Input
              id="duplicateTourCode"
              placeholder="請輸入新的行程編號"
              value={duplicateTourCode}
              onChange={e => onTourCodeChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duplicateTitle">行程名稱 *</Label>
            <Input
              id="duplicateTitle"
              placeholder="請輸入新的行程名稱"
              value={duplicateTitle}
              onChange={e => onTitleChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && duplicateTourCode.trim() && duplicateTitle.trim()) {
                  onSubmit()
                }
              }}
            />
          </div>
          <p className="text-xs text-morandi-muted">
            封面、行程內容、圖片等將會完整複製。<br />
            關聯的報價單也會一併複製（客戶資料會清空，價格保留）。
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDuplicating}
            className="gap-2"
          >
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isDuplicating || !duplicateTourCode.trim() || !duplicateTitle.trim()}
            className="gap-2"
          >
            <Check size={16} />
            {isDuplicating ? '複製中...' : '確認複製'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
