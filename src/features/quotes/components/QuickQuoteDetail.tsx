'use client'
/**
 * QuickQuoteDetail - 快速報價單詳細頁面
 */


import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Save, Printer, Edit2, X } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Quote } from '@/stores/types'
import type { Quote as PrintableQuote } from '@/types/quote.types'
import { PrintableQuickQuote } from './PrintableQuickQuote'
import { useQuickQuoteDetail } from '../hooks/useQuickQuoteDetail'
import {
  QuickQuoteHeader,
  QuickQuoteItemsTable,
  QuickQuoteSummary,
} from './quick-quote'
import { QUICK_QUOTE_DETAIL_LABELS } from '../constants/labels';

interface QuickQuoteDetailProps {
  quote: Quote
  onUpdate: (data: Partial<Quote>) => Promise<void> | Promise<Quote>
  viewModeToggle?: React.ReactNode
}

export const QuickQuoteDetail: React.FC<QuickQuoteDetailProps> = ({ quote, onUpdate, viewModeToggle }) => {
  const router = useRouter()

  // 使用自定義 hook 管理所有狀態和邏輯
  const {
    isEditing,
    setIsEditing,
    isSaving,
    showPrintPreview,
    setShowPrintPreview,
    formData,
    setFormField,
    items,
    totalAmount,
    totalCost,
    totalProfit,
    balanceAmount,
    addItem,
    removeItem,
    updateItem,
    reorderItems,
    handleSave,
  } = useQuickQuoteDetail({ quote, onUpdate })

  // 列印
  const handlePrint = async () => {
    window.print()
    setShowPrintPreview(false)
  }

  return (
    <>
      <ResponsiveHeader
        title={`快速報價單 ${quote.code || ''}`}
        showBackButton={true}
        onBack={() => {
          if (quote.tour_id) {
            router.push(`/tours?highlight=${quote.tour_id}`)
          } else {
            router.push('/quotes')
          }
        }}
        actions={
          <div className="flex items-center gap-2">
            {viewModeToggle}

            {/* 非編輯模式 */}
            {!isEditing && (
              <>
                <Button onClick={() => setShowPrintPreview(true)} variant="outline" className="gap-2">
                  <Printer className="h-4 w-4" />
                  {QUICK_QUOTE_DETAIL_LABELS.PRINT}
                </Button>
                <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                  <Edit2 size={16} />
                  {QUICK_QUOTE_DETAIL_LABELS.EDIT}
                </Button>
              </>
            )}

            {/* 編輯模式 */}
            {isEditing && (
              <>
                <Button onClick={() => setIsEditing(false)} variant="outline" className="gap-2">
                  <X size={16} />
                  {QUICK_QUOTE_DETAIL_LABELS.CANCEL}
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? QUICK_QUOTE_DETAIL_LABELS.儲存中 : QUICK_QUOTE_DETAIL_LABELS.儲存}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
        {/* 客戶資訊 */}
        <QuickQuoteHeader
          formData={formData}
          isEditing={isEditing}
          onFieldChange={setFormField}
        />

        {/* 收費明細表 */}
        <QuickQuoteItemsTable
          items={items}
          isEditing={isEditing}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
          onReorderItems={reorderItems}
        />

        {/* 費用說明 & 金額統計 */}
        <QuickQuoteSummary
          totalCost={totalCost}
          totalAmount={totalAmount}
          totalProfit={totalProfit}
          receivedAmount={formData.received_amount}
          balanceAmount={balanceAmount}
          isEditing={isEditing}
          expenseDescription={formData.expense_description}
          onReceivedAmountChange={(value) => setFormField('received_amount', value)}
          onExpenseDescriptionChange={(value) => setFormField('expense_description', value)}
        />

        {/* 列印預覽對話框 */}
        <PrintableQuickQuote
          quote={{
            ...quote,
            ...formData,
          } as unknown as PrintableQuote}
          items={items}
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          onPrint={handlePrint}
        />
      </div>
    </>
  )
}
