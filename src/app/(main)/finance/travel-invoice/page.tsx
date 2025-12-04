'use client'

/**
 * 代轉發票管理頁面
 * 改用統一的 ResponsiveHeader + EnhancedTable 佈局
 */

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Eye } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn as Column } from '@/components/ui/enhanced-table'
import { ContentContainer } from '@/components/layout/content-container'
import { useTravelInvoiceStore, TravelInvoice } from '@/stores/useTravelInvoiceStore'
import { StatusCell, DateCell, CurrencyCell, ActionCell } from '@/components/table-cells'
import { InvoiceDialog } from '@/components/finance/invoice-dialog'

// 狀態標籤定義
const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待處理' },
  { value: 'issued', label: '已開立' },
  { value: 'voided', label: '已作廢' },
  { value: 'allowance', label: '已折讓' },
  { value: 'failed', label: '失敗' },
]

// 狀態配色
const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'issued':
      return 'success'
    case 'pending':
      return 'warning'
    case 'voided':
    case 'failed':
      return 'error'
    case 'allowance':
      return 'info'
    default:
      return 'default'
  }
}

// 狀態文字
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return '待處理'
    case 'issued':
      return '已開立'
    case 'voided':
      return '已作廢'
    case 'allowance':
      return '已折讓'
    case 'failed':
      return '失敗'
    default:
      return status
  }
}

export default function TravelInvoicePage() {
  const router = useRouter()
  const { invoices, isLoading, error, fetchInvoices } = useTravelInvoiceStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // 篩選發票
  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter(invoice => {
      // 狀態篩選
      const matchesStatus = activeTab === 'all' || invoice.status === activeTab

      // 搜尋篩選
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        invoice.transactionNo.toLowerCase().includes(searchLower) ||
        invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        invoice.buyerInfo.buyerName?.toLowerCase().includes(searchLower)

      return matchesStatus && matchesSearch
    })
  }, [invoices, activeTab, searchTerm])

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

  // 操作按鈕
  const renderActions = (row: TravelInvoice) => (
    <ActionCell
      actions={[
        {
          icon: Eye,
          label: '查看',
          onClick: () => router.push(`/finance/travel-invoice/${row.id}`),
        },
      ]}
    />
  )

  // 點擊行跳轉
  const handleRowClick = (row: TravelInvoice) => {
    router.push(`/finance/travel-invoice/${row.id}`)
  }

  // 新增發票 - 改用懸浮視窗
  const handleAdd = () => {
    setIsDialogOpen(true)
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title="代轉發票管理"
          icon={FileText}
        />
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        </ContentContainer>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="代轉發票管理"
        icon={FileText}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋交易編號、發票號碼、買受人..."
        onAdd={handleAdd}
        addLabel="開立新發票"
        tabs={statusTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-hidden">
        <EnhancedTable
          columns={columns}
          data={filteredInvoices}
          loading={isLoading}
          actions={renderActions}
          onRowClick={handleRowClick}
          bordered={true}
          emptyMessage="尚無發票資料"
        />
      </div>

      {/* 開立發票懸浮視窗 */}
      <InvoiceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
