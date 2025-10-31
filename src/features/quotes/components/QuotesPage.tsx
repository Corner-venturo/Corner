/**
 * QuotesPage - Main quotes list page component
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Calculator } from 'lucide-react';
import { QuotesList } from './QuotesList';
import { QuoteDialog } from './QuoteDialog';
import { useQuotesData } from '../hooks/useQuotesData';
import { useQuotesFilters } from '../hooks/useQuotesFilters';
import { useQuoteForm } from '../hooks/useQuoteForm';
import { useQuoteTourSync } from '../hooks/useQuoteTourSync';
import { STATUS_FILTERS } from '../constants';
import { useRealtimeForQuotes, useRealtimeForTours, useRealtimeForQuoteItems } from '@/hooks/use-realtime-hooks';
import { useRegionStoreNew } from '@/stores';

export const QuotesPage: React.FC = () => {
  // ✅ Realtime 訂閱
  useRealtimeForQuotes();
  useRealtimeForTours();
  useRealtimeForQuoteItems();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Data and actions
  const {
    quotes,
    tours,
    countries,
    cities,
    getCitiesByCountry,
    addQuote,
    handleDuplicateQuote,
    handleTogglePin,
    handleDeleteQuote,
    handleQuoteClick,
  } = useQuotesData();

  // ✅ 延遲載入 regions（只在打開對話框時載入）
  const { fetchAll: fetchRegions } = useRegionStoreNew();
  const handleOpenDialog = React.useCallback(async () => {
    setIsAddDialogOpen(true);
    // 只在需要時載入 regions
    if (countries.length === 0) {
      await fetchRegions();
    }
  }, [countries.length, fetchRegions]);

  // Form management
  const {
    formData,
    setFormField,
    citySearchTerm,
    setCitySearchTerm,
    availableCities,
    resetForm,
    initFormWithTour,
    handleSubmit,
  } = useQuoteForm({ addQuote, getCitiesByCountry });

  // Filtering
  const { filteredQuotes } = useQuotesFilters({ quotes, statusFilter, searchTerm });

  // Tour sync - auto-open dialog when coming from tours page
  const { clearTourParam } = useQuoteTourSync({
    quotes,
    tours,
    isAddDialogOpen,
    onOpenDialog: (tourId: string) => {
      const tour = tours.find(t => t.id === tourId);
      if (tour) {
        initFormWithTour(tour);
        setIsAddDialogOpen(true);
      }
    },
    onNavigateToQuote: (quoteId: string) => {
      router.replace(`/quotes/${quoteId}`);
    },
  });

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    resetForm();
    clearTourParam();
  };

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="報價單管理"
        icon={Calculator}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '報價單管理', href: '/quotes' }
        ]}
        tabs={STATUS_FILTERS.map(f => ({
          value: f.value,
          label: f.label,
          icon: f.icon,
        }))}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋報價單名稱..."
        onAdd={handleOpenDialog}
        addLabel="新增報價單"
      />

      <div className="flex-1 overflow-auto">
        <QuotesList
          quotes={filteredQuotes}
          tours={tours}
          searchTerm={searchTerm}
          onQuoteClick={handleQuoteClick}
          onDuplicate={handleDuplicateQuote}
          onTogglePin={handleTogglePin}
          onDelete={handleDeleteQuote}
        />
      </div>

      <QuoteDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          setIsAddDialogOpen(open);
        }}
        formData={formData}
        setFormField={setFormField}
        citySearchTerm={citySearchTerm}
        setCitySearchTerm={setCitySearchTerm}
        availableCities={availableCities}
        tours={tours}
        countries={countries}
        onSubmit={handleSubmit}
        onClose={handleDialogClose}
      />
    </div>
  );
};
