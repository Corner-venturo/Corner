/**
 * ToursPage - Main tours list page component
 */

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { useTours } from '../hooks/useTours-advanced'
import { PageRequest } from '@/core/types/common'
import {
  Calendar,
  FileText,
  MapPin,
  BarChart3,
  FileCheck,
  AlertCircle,
  Archive,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useQuotes } from '@/features/quotes/hooks/useQuotes'
import { useOrders, useEmployees, useMembers } from '@/hooks/cloud-hooks'
import { useRegionsStore, useItineraryStore } from '@/stores'
import { Tour } from '@/stores/types'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { useDialog } from '@/hooks/useDialog'
import { useTourPageState } from '../hooks/useTourPageState'
import { useTourOperations } from '../hooks/useTourOperations'
import { TourForm } from './TourForm'
import { TourExpandedView } from './TourExpandedView'
import { TourMobileCard } from './TourMobileCard'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { useTourTableColumns } from './TourTableColumns'
import { useTourChannelOperations, TourStoreActions } from './TourChannelOperations'
import { useTourActionButtons } from './TourActionButtons'
import { LinkDocumentsToTourDialog } from './LinkDocumentsToTourDialog'
import { ContractDialog } from '@/components/contracts/ContractDialog'

export const ToursPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  // 選擇的行程表和報價單 ID（在表單內選擇）
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)

  // 連結文件對話框狀態（合併行程表和報價單）
  const [documentsDialogTour, setDocumentsDialogTour] = useState<Tour | null>(null)

  // 合約對話框狀態
  const [contractDialogState, setContractDialogState] = useState<{
    isOpen: boolean
    tour: Tour | null
    mode: 'create' | 'edit'
  }>({ isOpen: false, tour: null, mode: 'edit' })

  const { items: orders, create: addOrder } = useOrders()
  const { items: members } = useMembers()
  const { items: employees, fetchAll: fetchEmployees } = useEmployees()
  const { countries, cities, fetchAll: fetchRegions, getCitiesByCountry } = useRegionsStore()
  const { quotes, updateQuote } = useQuotes()
  const { items: itineraries, update: updateItinerary } = useItineraryStore()
  const { dialog, openDialog, closeDialog } = useDialog()

  // Use custom hooks
  const state = useTourPageState()
  const {
    currentPage,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    expandedRows,
    activeStatusTab,
    setActiveStatusTab,
    searchQuery,
    setSearchQuery,
    deleteConfirm,
    setDeleteConfirm,
    pageSize,
    activeTabs,
    submitting,
    setSubmitting,
    formError,
    setFormError,
    triggerAddOnAdd,
    setTriggerAddOnAdd,
    triggerRefundAdd,
    setTriggerRefundAdd,
    triggerPaymentAdd,
    setTriggerPaymentAdd,
    triggerCostAdd,
    setTriggerCostAdd,
    tourExtraFields,
    setTourExtraFields,
    newTour,
    setNewTour,
    newOrder,
    setNewOrder,
    availableCities,
    setAvailableCities,
    toggleRowExpand,
    setActiveTab,
    getStatusColor,
    setSelectedTour,
  } = state

  // Lazy load: only load regions and employees when opening create dialog
  const handleOpenCreateDialog = useCallback(
    async (tour: Tour | null = null, fromQuoteId?: string) => {
      // 重置選擇的行程表和報價單
      setSelectedItineraryId(null)
      setSelectedQuoteId(null)

      if (countries.length === 0) {
        await fetchRegions()
      }
      if (employees.length === 0) {
        await fetchEmployees()
      }
      openDialog('create', tour, fromQuoteId)
    },
    [countries.length, employees.length, fetchRegions, fetchEmployees, openDialog]
  )

  // Build PageRequest parameters
  const pageRequest: PageRequest = useMemo(
    () => ({
      page: currentPage,
      pageSize: 20,
      search: '',
      sortBy,
      sortOrder,
    }),
    [currentPage, sortBy, sortOrder]
  )

  // Use tours hook
  const { data: tours, loading, actions } = useTours(pageRequest)

  // ✅ 移除自動載入 regions（改為在打開對話框時才載入）
  // 原因：大部分用戶只是瀏覽列表，不需要載入 187 筆 cities
  // React.useEffect(() => {
  //   if (countries.length === 0) {
  //     fetchRegions();
  //   }
  // }, [countries.length]);

  // Get active countries from new region store
  const activeCountries = useMemo(() => {
    return countries
      .filter(c => c.is_active)
      .map(c => ({ id: c.id, code: c.code || '', name: c.name }))
  }, [countries])

  // Get cities by country ID
  const getCitiesByCountryId = useCallback(
    (countryId: string) => {
      return getCitiesByCountry(countryId)
        .filter(c => c.is_active)
        .map(c => ({
          id: c.id,
          code: c.airport_code || '',
          name: c.name,
          country_id: c.country_id,
        }))
    },
    [getCitiesByCountry]
  )

  // Filter tours by status and search query
  const filteredTours = (tours || []).filter(tour => {
    // 封存分頁：只顯示已結團的
    if (activeStatusTab === 'archived') {
      const searchLower = searchQuery.toLowerCase()
      const searchMatch =
        !searchQuery ||
        tour.name.toLowerCase().includes(searchLower) ||
        tour.code.toLowerCase().includes(searchLower) ||
        (tour.location || '').toLowerCase().includes(searchLower) ||
        (tour.status || '').toLowerCase().includes(searchLower) ||
        tour.description?.toLowerCase().includes(searchLower)

      return tour.closing_status === 'closed' && searchMatch
    }

    // 其他分頁：排除已結團的
    const notClosed = tour.closing_status !== 'closed'
    const statusMatch = activeStatusTab === 'all' || tour.status === activeStatusTab
    const searchLower = searchQuery.toLowerCase()
    const searchMatch =
      !searchQuery ||
      tour.name.toLowerCase().includes(searchLower) ||
      tour.code.toLowerCase().includes(searchLower) ||
      (tour.location || '').toLowerCase().includes(searchLower) ||
      (tour.status || '').toLowerCase().includes(searchLower) ||
      tour.description?.toLowerCase().includes(searchLower)

    return notClosed && statusMatch && searchMatch
  })

  // Handle edit mode: load tour data when dialog opens in edit mode
  useEffect(() => {
    if (dialog.type === 'edit' && dialog.data) {
      const tour = dialog.data as Tour

      let countryCode = ''
      let cityCode = ''

      // 優先使用資料庫中的 country_id 和 main_city_id 來查找
      if (tour.country_id && tour.main_city_id) {
        // 根據 country_id 找到國家
        const matchedCountry = activeCountries.find(c => c.id === tour.country_id)
        if (matchedCountry) {
          countryCode = matchedCountry.code
          // 載入該國家的城市
          const citiesInCountry = getCitiesByCountry(matchedCountry.id)
            .filter(c => c.is_active)
            .map(c => ({
              id: c.id,
              code: c.airport_code || '',
              name: c.name,
              country_id: c.country_id,
            }))
          setAvailableCities(citiesInCountry)
          // 根據 main_city_id 找到城市
          const matchedCity = citiesInCountry.find(city => city.id === tour.main_city_id)
          if (matchedCity) {
            cityCode = matchedCity.code
          }
        }
      }

      // 如果用 ID 找不到，fallback 到用 location 文字匹配（舊資料相容）
      if (!countryCode && tour.location) {
        for (const country of activeCountries) {
          const citiesInCountry = getCitiesByCountry(country.id)
            .filter(c => c.is_active)
            .map(c => ({
              id: c.id,
              code: c.airport_code || '',
              name: c.name,
              country_id: c.country_id,
            }))
          const matchedCity = citiesInCountry.find(city => city.name === tour.location)
          if (matchedCity) {
            countryCode = country.code
            cityCode = matchedCity.code
            setAvailableCities(citiesInCountry)
            break
          }
        }
      }

      // If still not found, set as custom
      if (!countryCode) {
        countryCode = '__custom__'
        cityCode = '__custom__'
      }

      setNewTour({
        name: tour.name,
        countryCode,
        cityCode,
        customLocation: countryCode === '__custom__' ? (tour.location || undefined) : undefined,
        departure_date: tour.departure_date || '',
        return_date: tour.return_date || '',
        price: tour.price ?? 0,
        status: (tour.status || 'draft') as Tour['status'],
        isSpecial: tour.status === 'special',
        max_participants: tour.max_participants || 20,
        description: tour.description || '',
      })
    }
     
  }, [dialog.type, dialog.data, activeCountries])

  // Handle navigation from quote
  useEffect(() => {
    const fromQuoteId = searchParams.get('fromQuote')
    const highlightId = searchParams.get('highlight')
    const departure_date = searchParams.get('departure_date')
    const shouldOpenDialog = searchParams.get('openDialog')

    if (fromQuoteId) {
      const sourceQuote = quotes.find(quote => quote.id === fromQuoteId)
      if (sourceQuote) {
        setNewTour(prev => ({
          ...prev,
          name: sourceQuote.name || prev.name,
          price: Math.round((sourceQuote.total_cost ?? 0) / (sourceQuote.group_size ?? 1)),
        }))
        handleOpenCreateDialog(null, fromQuoteId)
      }
    }

    if (departure_date && shouldOpenDialog === 'true') {
      setNewTour(prev => ({
        ...prev,
        departure_date: departure_date,
      }))
      handleOpenCreateDialog()
    }

    if (highlightId) {
      toggleRowExpand(highlightId)
      setActiveTab(highlightId, 'tasks')
    }
  }, [searchParams, quotes, handleOpenCreateDialog, setNewTour, toggleRowExpand, setActiveTab])

  const resetForm = useCallback(() => {
    setNewTour({
      name: '',
      countryCode: '',
      cityCode: '',
      departure_date: '',
      return_date: '',
      price: 0,
      status: 'draft',
      isSpecial: false,
      max_participants: 20,
      description: '',
    })
    setAvailableCities([])
    setNewOrder({
      contact_person: '',
      sales_person: '',
      assistant: '',
      member_count: 1,
      total_amount: 0,
    })
    setFormError(null)
  }, [setNewTour, setAvailableCities, setNewOrder, setFormError])

  // Use tour operations hook
   
  const operations = useTourOperations({
    actions,
    addOrder: addOrder as any,
    updateQuote,
    updateItinerary,
    quotes,
    itineraries,
    availableCities,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
    dialogType: dialog.type || 'create',
    dialogData: (dialog.data as Tour) || null,
  })

  const handleAddTour = useCallback(() => {
    const fromQuoteId = searchParams.get('fromQuote')
    operations.handleAddTour(newTour, newOrder, fromQuoteId ?? undefined)
  }, [operations, newTour, newOrder, searchParams])

  const handleSortChange = useCallback(
    (field: string, order: 'asc' | 'desc') => {
      setSortBy(field)
      setSortOrder(order)
      setCurrentPage(1)
    },
    [setSortBy, setSortOrder, setCurrentPage]
  )

  const handleRowClick = useCallback(
    (row: unknown) => {
      const tour = row as Tour
      setSelectedTour(tour)
      router.push(`/tours/${tour.id}`)
    },
    [router, setSelectedTour]
  )

  const handleDeleteTour = useCallback(async () => {
    await operations.handleDeleteTour(deleteConfirm.tour)
    setDeleteConfirm({ isOpen: false, tour: null })
  }, [operations, deleteConfirm.tour, setDeleteConfirm])

  // Use extracted hooks for table columns, channel operations, and action buttons
  const columns = useTourTableColumns({ orders, getStatusColor })

  const { handleCreateChannel, handleUnlockTour } = useTourChannelOperations({ actions: actions as unknown as TourStoreActions })

  const { renderActions } = useTourActionButtons({
    quotes,
    activeStatusTab,
    user,
    operations,
    openDialog,
    setSelectedTour,
    setDeleteConfirm,
    handleCreateChannel,
    handleUnlockTour,
    onOpenQuoteDialog: (tour) => setDocumentsDialogTour(tour),
    onOpenItineraryDialog: (tour) => setDocumentsDialogTour(tour),
    onOpenContractDialog: (tour) => {
      const mode = tour.contract_template ? 'edit' : 'create'
      setContractDialogState({ isOpen: true, tour, mode })
    },
  })

  const renderExpanded = useCallback(
    (row: unknown) => {
      const tour = row as Tour
      return (
      <TourExpandedView
        tour={tour}
        orders={orders}
        activeTabs={activeTabs}
        setActiveTab={setActiveTab}
        openDialog={openDialog}
        tourExtraFields={tourExtraFields}
        setTourExtraFields={setTourExtraFields}
        triggerAddOnAdd={triggerAddOnAdd}
        setTriggerAddOnAdd={setTriggerAddOnAdd}
        triggerPaymentAdd={triggerPaymentAdd}
        setTriggerPaymentAdd={setTriggerPaymentAdd}
        triggerCostAdd={triggerCostAdd}
        setTriggerCostAdd={setTriggerCostAdd}
      />
      )
    },
    [
      orders,
      activeTabs,
      setActiveTab,
      openDialog,
      tourExtraFields,
      setTourExtraFields,
      triggerAddOnAdd,
      setTriggerAddOnAdd,
      triggerRefundAdd,
      setTriggerRefundAdd,
      triggerPaymentAdd,
      setTriggerPaymentAdd,
      triggerCostAdd,
      setTriggerCostAdd,
    ]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="旅遊團管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '旅遊團管理', href: '/tours' },
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋旅遊團..."
        onAdd={() => handleOpenCreateDialog()}
        addLabel="新增旅遊團"
        tabs={[
          { value: 'all', label: '全部', icon: BarChart3 },
          { value: '提案', label: '提案', icon: FileText },
          { value: '進行中', label: '進行中', icon: Calendar },
          { value: '待結案', label: '待結案', icon: AlertCircle },
          { value: '結案', label: '結案', icon: FileCheck },
          { value: 'archived', label: '封存', icon: Archive },
        ]}
        activeTab={activeStatusTab}
        onTabChange={(tab: string) => {
          setActiveStatusTab(tab)
          setCurrentPage(1)
        }}
      />

      {/* Tour list */}
      <div className="flex-1 overflow-hidden">
        {/* 桌面模式：表格 */}
        <div className="hidden md:block h-full">
          <EnhancedTable
            columns={columns}
            data={filteredTours}
            loading={loading}
            onSort={handleSortChange}
            expandable={{
              expanded: expandedRows,
              onExpand: toggleRowExpand,
              renderExpanded,
            }}
            actions={renderActions}
            onRowClick={handleRowClick}
            bordered={true}
          />
        </div>

        {/* 手機模式：卡片列表 */}
        <div className="md:hidden space-y-3 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold"></div>
            </div>
          ) : filteredTours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin size={48} className="text-morandi-secondary/30 mb-4" />
              <p className="text-morandi-secondary">沒有找到旅遊團</p>
              <p className="text-sm text-morandi-secondary/70 mt-1">請調整篩選條件或新增旅遊團</p>
            </div>
          ) : (
            filteredTours.map(tour => (
              <TourMobileCard
                key={tour.id}
                tour={tour}
                onClick={() => handleRowClick(tour)}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </div>
      </div>

      {/* Tour form dialog */}
      <TourForm
        isOpen={dialog.isOpen}
        onClose={() => {
          resetForm()
          setSelectedItineraryId(null)
          setSelectedQuoteId(null)
          closeDialog()
        }}
        mode={dialog.type === 'edit' ? 'edit' : 'create'}
        newTour={newTour}
        setNewTour={setNewTour}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        activeCountries={activeCountries}
        availableCities={availableCities}
        setAvailableCities={setAvailableCities}
        getCitiesByCountryId={getCitiesByCountryId}
        submitting={submitting}
        formError={formError}
        onSubmit={handleAddTour}
        selectedItineraryId={selectedItineraryId}
        setSelectedItineraryId={setSelectedItineraryId}
        selectedQuoteId={selectedQuoteId}
        setSelectedQuoteId={setSelectedQuoteId}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        tour={deleteConfirm.tour}
        onClose={() => setDeleteConfirm({ isOpen: false, tour: null })}
        onConfirm={handleDeleteTour}
      />

      {/* Link documents to tour dialog (combined) */}
      {documentsDialogTour && (
        <LinkDocumentsToTourDialog
          isOpen={!!documentsDialogTour}
          onClose={() => setDocumentsDialogTour(null)}
          tour={documentsDialogTour}
        />
      )}

      {/* Contract dialog */}
      {contractDialogState.tour && (
        <ContractDialog
          isOpen={contractDialogState.isOpen}
          onClose={() => setContractDialogState({ isOpen: false, tour: null, mode: 'edit' })}
          tour={contractDialogState.tour}
          mode={contractDialogState.mode}
        />
      )}
    </div>
  )
}
