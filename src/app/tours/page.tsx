'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { useTours } from '@/features/tours/hooks/useTours-advanced';
import { PageRequest } from '@/core/types/common';
import { Calendar, FileText, MapPin, Calculator, BarChart3, FileCheck, AlertCircle, Edit2, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTourStore, useOrderStore, useMemberStore, useEmployeeStore, useRegionStore } from '@/stores';
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { Tour } from '@/stores/types';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { useDialog } from '@/hooks/useDialog';
import { useTourPageState } from '@/features/tours/hooks/useTourPageState';
import { useTourOperations } from '@/features/tours/hooks/useTourOperations';
import { TourForm } from '@/features/tours/components/TourForm';
import { TourExpandedView } from '@/features/tours/components/TourExpandedView';
import { DeleteConfirmDialog } from '@/features/tours/components/DeleteConfirmDialog';

export default function ToursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderStore = useOrderStore();
  const { items: orders } = orderStore;
  const addOrder = orderStore.create;
  const { items: members } = useMemberStore();
  const employeeStore = useEmployeeStore();
  const { items: employees } = employeeStore;
  const regionStore = useRegionStore();
  const { items: regions } = regionStore;
  const { quotes, updateQuote } = useQuotes();
  const { dialog, openDialog, closeDialog } = useDialog();

  // Use custom hooks
  const state = useTourPageState();
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
  } = state;

  // Lazy load: only load regions and employees when opening create dialog
  const handleOpenCreateDialog = useCallback(async (tour: any = null, fromQuoteId?: string) => {
    if (regions.length === 0) {
      await regionStore.fetchAll();
    }
    if (employees.length === 0) {
      await employeeStore.fetchAll();
    }
    openDialog('create', tour, fromQuoteId);
  }, [regions.length, employees.length, regionStore, employeeStore, openDialog]);

  // Build PageRequest parameters
  const pageRequest: PageRequest = useMemo(() => ({
    page: currentPage,
    search: '',
    sortBy,
    sortOrder,
  }), [currentPage, sortBy, sortOrder]);

  // Use tours hook
  const { data: tours, loading, actions } = useTours(pageRequest);

  // Get active countries from regions
  const activeCountries = useMemo(() => {
    return regions
      .filter(r => r.type === 'country' && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  // Get cities by country code
  const getCitiesByCountryCode = useCallback((countryCode: string) => {
    return regions
      .filter(r => r.type === 'city' && r.country_code === countryCode && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  // Initialize default country and city
  useEffect(() => {
    if (activeCountries.length > 0 && !newTour.countryCode) {
      const defaultCountry = activeCountries[0];
      const defaultCities = getCitiesByCountryCode(defaultCountry.code);
      const defaultCity = defaultCities[0];

      setNewTour(prev => ({
        ...prev,
        countryCode: defaultCountry.code,
        cityCode: defaultCity?.code || '',
      }));
      setAvailableCities(defaultCities);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter tours by status and search query
  const filteredTours = (tours || []).filter(tour => {
    const statusMatch = activeStatusTab === 'all' || tour.status === activeStatusTab;
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = !searchQuery ||
      tour.name.toLowerCase().includes(searchLower) ||
      tour.code.toLowerCase().includes(searchLower) ||
      tour.location.toLowerCase().includes(searchLower) ||
      tour.status.toLowerCase().includes(searchLower) ||
      tour.description?.toLowerCase().includes(searchLower);

    return statusMatch && searchMatch;
  });

  // Handle edit mode: load tour data when dialog opens in edit mode
  useEffect(() => {
    if (dialog.type === 'edit' && dialog.data) {
      const tour = dialog.data as Tour;

      let countryCode = '';
      let cityCode = '';

      // Try to find matching city from destinations
      for (const country of activeCountries) {
        const cities = getCitiesByCountryCode(country.code);
        const matchedCity = cities.find(city => city.name === tour.location);
        if (matchedCity) {
          countryCode = country.code;
          cityCode = matchedCity.code;
          setAvailableCities(cities);
          break;
        }
      }

      // If not found, set as custom
      if (!countryCode) {
        countryCode = '__custom__';
        cityCode = '__custom__';
      }

      setNewTour({
        name: tour.name,
        countryCode,
        cityCode,
        customLocation: countryCode === '__custom__' ? tour.location : undefined,
        departure_date: tour.departure_date,
        return_date: tour.return_date,
        price: tour.price,
        status: tour.status,
        isSpecial: tour.status === 'special',
        max_participants: tour.max_participants || 20,
        description: tour.description || '',
      });
    }
  }, [dialog.type, dialog.data, activeCountries, getCitiesByCountryCode, setNewTour, setAvailableCities]);

  // Handle navigation from quote
  useEffect(() => {
    const fromQuoteId = searchParams.get('fromQuote');
    const highlightId = searchParams.get('highlight');
    const departure_date = searchParams.get('departure_date');
    const shouldOpenDialog = searchParams.get('openDialog');

    if (fromQuoteId) {
      const sourceQuote = quotes.find(quote => quote.id === fromQuoteId);
      if (sourceQuote) {
        setNewTour(prev => ({
          ...prev,
          name: sourceQuote.name,
          price: Math.round(sourceQuote.total_cost / sourceQuote.group_size),
        }));
        handleOpenCreateDialog(null, fromQuoteId);
      }
    }

    if (departure_date && shouldOpenDialog === 'true') {
      setNewTour(prev => ({
        ...prev,
        departure_date: departure_date
      }));
      handleOpenCreateDialog();
    }

    if (highlightId) {
      toggleRowExpand(highlightId);
      setActiveTab(highlightId, 'tasks');
    }
  }, [searchParams, quotes, handleOpenCreateDialog, setNewTour, toggleRowExpand, setActiveTab]);

  const resetForm = useCallback(() => {
    const defaultCountry = activeCountries[0];
    const defaultCities = defaultCountry ? getCitiesByCountryCode(defaultCountry.code) : [];
    const defaultCity = defaultCities[0];

    setNewTour({
      name: '',
      countryCode: defaultCountry?.code || '',
      cityCode: defaultCity?.code || '',
      departure_date: '',
      return_date: '',
      price: 0,
      status: 'draft',
      isSpecial: false,
      max_participants: 20,
      description: '',
    });
    setAvailableCities(defaultCities);
    setNewOrder({
      contact_person: '',
      sales_person: '',
      assistant: '',
      member_count: 1,
      total_amount: 0,
    });
    setFormError(null);
  }, [activeCountries, getCitiesByCountryCode, setNewTour, setAvailableCities, setNewOrder, setFormError]);

  // Use tour operations hook
  const operations = useTourOperations({
    actions,
    addOrder,
    updateQuote,
    availableCities,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
    dialogType: dialog.type,
    dialogData: dialog.data,
  });

  const handleAddTour = useCallback(() => {
    const fromQuoteId = searchParams.get('fromQuote');
    operations.handleAddTour(newTour, newOrder, fromQuoteId || undefined);
  }, [operations, newTour, newOrder, searchParams]);

  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  }, [setSortBy, setSortOrder, setCurrentPage]);

  const handleRowClick = useCallback((tour: Tour) => {
    setSelectedTour(tour);
    router.push(`/tours/${tour.id}`);
  }, [router, setSelectedTour]);

  const handleDeleteTour = useCallback(async () => {
    await operations.handleDeleteTour(deleteConfirm.tour);
    setDeleteConfirm({ isOpen: false, tour: null });
  }, [operations, deleteConfirm.tour, setDeleteConfirm]);

  // Define table columns
  const columns: TableColumn[] = useMemo(() => [
    {
      key: 'code',
      label: '團號',
      sortable: true,
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'name',
      label: '旅遊團名稱',
      sortable: true,
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'departure_date',
      label: '出發日期',
      sortable: true,
      render: (value, tour) => {
        if (!tour.departure_date) return <span className="text-sm text-morandi-red">未設定</span>;
        const date = new Date(tour.departure_date);
        return <span className="text-sm text-morandi-primary">{isNaN(date.getTime()) ? '無效日期' : date.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'return_date',
      label: '回程日期',
      sortable: true,
      render: (value, tour) => {
        if (!tour.return_date) return <span className="text-sm text-morandi-secondary">-</span>;
        const date = new Date(tour.return_date);
        return <span className="text-sm text-morandi-primary">{isNaN(date.getTime()) ? '無效日期' : date.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'participants',
      label: '人數',
      render: (value, tour) => {
        const tourOrders = orders.filter((order) => order.tour_id === tour.id);
        const actualMembers = members.filter((member) =>
          tourOrders.some((order) => order.id === member.order_id)
        ).length;
        return <span className="text-sm text-morandi-primary">{actualMembers}</span>;
      },
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value, tour) => (
        <span className={cn(
          'text-sm font-medium',
          getStatusColor(tour.status)
        )}>
          {tour.status}
        </span>
      ),
    },
  ], [orders, members, getStatusColor]);

  const renderActions = useCallback((tour: Tour) => {
    const tourQuote = quotes.find(q => q.tour_id === tour.id);
    const hasQuote = !!tourQuote;

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDialog('edit', tour);
          }}
          className="p-1 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
          title="編輯"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTour(tour);
            if (hasQuote) {
              router.push(`/quotes/${tourQuote.id}`);
            } else {
              router.push(`/quotes?tour_id=${tour.id}`);
            }
          }}
          className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
          title={hasQuote ? '查看報價單' : '新增報價單'}
        >
          <Calculator size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/itinerary/${tour.id}`);
          }}
          className="p-1 text-morandi-primary hover:bg-morandi-primary/10 rounded transition-colors"
          title="編輯行程表"
        >
          <FileText size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            operations.handleArchiveTour(tour);
          }}
          className={cn(
            "p-1 rounded transition-colors",
            tour.archived
              ? "text-morandi-gold/60 hover:text-morandi-gold hover:bg-morandi-gold/10"
              : "text-morandi-secondary/60 hover:text-morandi-secondary hover:bg-morandi-container"
          )}
          title={tour.archived ? "解除封存" : "封存"}
        >
          {tour.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirm({ isOpen: true, tour });
          }}
          className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
          title="刪除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }, [quotes, openDialog, router, operations, setSelectedTour, setDeleteConfirm]);

  const renderExpanded = useCallback((tour: Tour) => (
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
      triggerRefundAdd={triggerRefundAdd}
      setTriggerRefundAdd={setTriggerRefundAdd}
      triggerPaymentAdd={triggerPaymentAdd}
      setTriggerPaymentAdd={setTriggerPaymentAdd}
      triggerCostAdd={triggerCostAdd}
      setTriggerCostAdd={setTriggerCostAdd}
    />
  ), [
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
    setTriggerCostAdd
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        {...{
          title: "旅遊團管理",
          icon: MapPin,
          breadcrumb: [
            { label: '首頁', href: '/' },
            { label: '旅遊團管理', href: '/tours' }
          ],
          showSearch: true,
          searchTerm: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "搜尋旅遊團...",
          onAdd: handleOpenCreateDialog,
          addLabel: "新增旅遊團",
          tabs: [
            { value: 'all', label: '全部', icon: BarChart3 },
            { value: '提案', label: '提案', icon: FileText },
            { value: '進行中', label: '進行中', icon: Calendar },
            { value: '待結案', label: '待結案', icon: AlertCircle },
            { value: '結案', label: '結案', icon: FileCheck },
          ],
          activeTab: activeStatusTab,
          onTabChange: (tab: string) => {
            setActiveStatusTab(tab);
            setCurrentPage(1);
          }
        } as any}
      />

      {/* Tour list */}
      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
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

      {/* Tour form dialog */}
      <TourForm
        isOpen={dialog.isOpen}
        onClose={() => {
          resetForm();
          closeDialog();
        }}
        mode={dialog.type === 'edit' ? 'edit' : 'create'}
        newTour={newTour}
        setNewTour={setNewTour}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        activeCountries={activeCountries}
        availableCities={availableCities}
        setAvailableCities={setAvailableCities}
        getCitiesByCountryCode={getCitiesByCountryCode}
        submitting={submitting}
        formError={formError}
        onSubmit={handleAddTour}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        tour={deleteConfirm.tour}
        onClose={() => setDeleteConfirm({ isOpen: false, tour: null })}
        onConfirm={handleDeleteTour}
      />
    </div>
  );
}
