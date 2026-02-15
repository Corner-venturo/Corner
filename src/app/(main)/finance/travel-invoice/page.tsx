'use client'

/**
 * 代轉發票管理頁面
 * 使用 ListPageLayout 統一佈局
 */

import { useEffect, useState, useMemo } from 'react'
import { FileText, Eye, ListChecks } from 'lucide-react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { TableColumn as Column } from '@/components/ui/enhanced-table'
import { ContentContainer } from '@/components/layout/content-container'
import { Button } from '@/components/ui/button'
import { useTravelInvoiceStore, TravelInvoice } from '@/stores/travel-invoice-store'
import { useToursListSlim } from '@/hooks/useListSlim'
import { StatusCell, DateCell, CurrencyCell, ActionCell } from '@/components/table-cells'
import { InvoiceDialog } from '@/features/finance/components/invoice-dialog'
import { TravelInvoiceDetailDialog } from './components/TravelInvoiceDetailDialog'
import { BatchInvoiceDialog } from '@/features/finance/travel-invoice/components/BatchInvoiceDialog'
import { TRAVEL_INVOICE_LABELS } from './constants/labels'
import { ContentPageLayout } from '@/components/layout/content-page-layout'

// 狀態標籤定義
const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待處理' },
  { value: 'scheduled', label: '預約中' },
  { value: 'issued', label: '已開立' },
  { value: 'voided', label: '已作廢' },
  { value: 'allowance', label: '已折讓' },
  { value: 'failed', label: '失敗' },
]

export default function TravelInvoicePage() {
  const { invoices, isLoading, error, fetchInvoices } = useTravelInvoiceStore()
  const { items: tours } = useToursListSlim()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<TravelInvoice | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // 轉換 tours 為 Combobox 選項格式
  const tourOptions = useMemo(() => {
    return tours.map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
    }))
  }, [tours])

  // 表格欄位定義
  const columns: Column<TravelInvoice>[] = [
    {
      key: 'transactionNo',
      label: '交易編號',
      width: '160px',
      render: (value: unknown, row: TravelInvoice) => (
        <div>
          <div className="font-medium text-morandi-primary">{String(value)}</div>
          <div className="text-xs text-morandi-secondary">
            {row.invoice_number || '尚未取得發票號碼'}
          </div>
        </div>
      ),
    },
    {
      key: 'invoice_date',
      label: '開立日期',
      width: '120px',
      render: (value: unknown) => <DateCell date={value as string} />,
    },
    {
      key: 'buyerInfo',
      label: '買受人',
      width: '150px',
      render: (value: unknown) => (
        <span className="text-morandi-primary">{(value as { buyerName?: string })?.buyerName || '-'}</span>
      ),
    },
    {
      key: 'total_amount',
      label: '金額',
      width: '120px',
      align: 'right',
      render: (value: unknown) => <CurrencyCell amount={value as number} />,
    },
    {
      key: 'status',
      label: '狀態',
      width: '100px',
      render: (value: unknown) => (
        <StatusCell
          type="invoice"
          status={String(value)}
        />
      ),
    },
  ]

  // 開啟詳情 Dialog
  const handleViewDetail = (invoice: TravelInvoice) => {
    setSelectedInvoice(invoice)
    setIsDetailOpen(true)
  }

  // 操作按鈕
  const renderActions = (row: TravelInvoice) => (
    <ActionCell
      actions={[
        {
          icon: Eye,
          label: '查看',
          onClick: () => handleViewDetail(row),
        },
      ]}
    />
  )

  // 點擊行開啟詳情
  const handleRowClick = (row: TravelInvoice) => {
    handleViewDetail(row)
  }

  // 新增發票 - 改用懸浮視窗
  const handleAdd = () => {
    setIsDialogOpen(true)
  }

  if (error) {
    return (
      <ContentPageLayout
        title={TRAVEL_INVOICE_LABELS.MANAGE_1246}
        icon={FileText}
      >
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-status-danger">{error}</p>
          </div>
        </ContentContainer>
      </ContentPageLayout>
    )
  }

  return (
    <>
      <ListPageLayout<TravelInvoice>
        title={TRAVEL_INVOICE_LABELS.MANAGE_1246}
        icon={FileText}
        data={invoices || []}
        loading={isLoading}
        columns={columns}
        searchFields={['transactionNo', 'invoice_number']}
        searchPlaceholder="搜尋交易編號、發票號碼、買受人..."
        statusTabs={statusTabs}
        statusField="status"
        onAdd={handleAdd}
        addLabel="開立新發票"
        onRowClick={handleRowClick}
        renderActions={renderActions}
        headerActions={
          <Button
            variant="outline"
            onClick={() => setIsBatchDialogOpen(true)}
            className="gap-2"
          >
            <ListChecks size={16} />
            {TRAVEL_INVOICE_LABELS.LABEL_1677}
          </Button>
        }
      />

      {/* 開立發票懸浮視窗 */}
      <InvoiceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      {/* 發票詳情 Dialog */}
      <TravelInvoiceDetailDialog
        invoice={selectedInvoice}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* 批次開立 Dialog */}
      <BatchInvoiceDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        tours={tourOptions}
        onSuccess={() => {
          fetchInvoices()
        }}
      />
    </>
  )
}
