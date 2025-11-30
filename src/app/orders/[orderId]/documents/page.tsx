'use client'

import React, { useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Button } from '@/components/ui/button'
import { EnhancedTable, TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table'
import { useOrderStore } from '@/stores'
import { ArrowLeft, FileText, Upload, Download, Eye, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  name: string
  _type: string
  size: string
  uploadDate: string
  category: string
}

export default function DocumentsDetailPage() {
  const router = useRouter()
  const params = useParams()
  const order_id = params.order_id as string
  const { items: orders } = useOrderStore()

  const order = orders.find(o => o.id === order_id)

  // 模擬文件數據
  const documents: Document[] = [
    {
      id: '1',
      name: '行程確認書.pdf',
      _type: 'PDF',
      size: '2.4 MB',
      uploadDate: '2024-11-15',
      category: '合約文件',
    },
    {
      id: '2',
      name: '保險清單.xlsx',
      _type: 'Excel',
      size: '1.2 MB',
      uploadDate: '2024-11-14',
      category: '保險文件',
    },
    {
      id: '3',
      name: '成員名單.docx',
      _type: 'Word',
      size: '0.8 MB',
      uploadDate: '2024-11-13',
      category: '成員資料',
    },
  ]

  const getFileIcon = (_type: string) => {
    return <FileText size={16} className="text-morandi-gold" />
  }

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'name',
        label: '文件名稱',
        sortable: true,
        filterable: true,
        render: (value, row: unknown) => {
          const document = row as Document
          return (
            <div className="flex items-center space-x-2">
              {getFileIcon(document._type)}
              <span className="font-medium text-morandi-primary">{String(value || '')}</span>
            </div>
          )
        },
      },
      {
        key: 'category',
        label: '分類',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { value: '合約文件', label: '合約文件' },
          { value: '保險文件', label: '保險文件' },
          { value: '成員資料', label: '成員資料' },
        ],
        render: (value) => (
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
              'bg-morandi-container text-morandi-primary'
            )}
          >
            {String(value || '')}
          </span>
        ),
      },
      {
        key: '_type',
        label: '類型',
        sortable: true,
        filterable: true,
        render: (value) => <span className="text-morandi-secondary">{String(value || '')}</span>,
      },
      {
        key: 'size',
        label: '大小',
        sortable: true,
        filterable: true,
        render: (value) => <span className="text-morandi-secondary">{String(value || '')}</span>,
      },
      {
        key: 'uploadDate',
        label: '上傳日期',
        sortable: true,
        filterable: true,
        filterType: 'date',
        render: (value) => <span className="text-morandi-secondary">{String(value || '')}</span>,
      },
      {
        key: 'actions',
        label: '操作',
        sortable: false,
        filterable: false,
        render: (_, _row) => (
          <div className="flex items-center space-x-2">
            <button
              className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
              title="預覽文件"
            >
              <Eye size={14} className="text-morandi-secondary" />
            </button>
            <button
              className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
              title="下載文件"
            >
              <Download size={14} className="text-morandi-secondary" />
            </button>
            <button
              className="p-1 hover:bg-morandi-red/10 rounded transition-colors"
              title="刪除文件"
            >
              <Trash2 size={14} className="text-morandi-red" />
            </button>
          </div>
        ),
      },
    ],
    []
  )

  // 排序和篩選函數
  const sortFunction = (data: Document[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: string | number | Date = a[column as keyof Document]
      let bValue: string | number | Date = b[column as keyof Document]

      if (column === 'uploadDate') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const filterFunction = (data: Document[], filters: Record<string, string>) => {
    return data.filter((doc) => {
      return (
        (!filters.name || doc.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.category || doc.category === filters.category) &&
        (!filters._type || doc._type.toLowerCase().includes(filters._type.toLowerCase())) &&
        (!filters.size || doc.size.includes(filters.size)) &&
        (!filters.uploadDate || doc.uploadDate.includes(filters.uploadDate))
      )
    })
  }

  const {
    data: filteredAndSortedDocuments,
    handleSort,
    handleFilter,
  } = useEnhancedTable(documents, sortFunction, filterFunction)

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-morandi-secondary mb-4">找不到該訂單</p>
          <Button onClick={() => router.push('/orders')} variant="outline">
            <ArrowLeft size={16} className="mr-1" />
            返回訂單列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ">
      <ResponsiveHeader
        title={`文件管理 - ${order.order_number}`}
        onAdd={() => {
          /* 上傳文件 */
        }}
        addLabel="上傳文件"
      >
        <div className="flex items-center space-x-4">
          <div className="text-sm text-morandi-secondary">
            旅遊團: <span className="text-morandi-primary font-medium">{order.tour_name}</span>
          </div>
          <Button onClick={() => router.push('/orders')} variant="ghost" size="sm" className="p-2">
            <ArrowLeft size={16} />
          </Button>
        </div>
      </ResponsiveHeader>

      <ContentContainer>
        <EnhancedTable
          columns={tableColumns}
          data={filteredAndSortedDocuments}
          onSort={handleSort}
          onFilter={handleFilter}
        />

        {filteredAndSortedDocuments.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>尚未上傳任何文件</p>
            <p className="text-sm mt-1">點擊上方「上傳文件」按鈕開始上傳</p>
          </div>
        )}
      </ContentContainer>

      {/* 上傳區域 */}
      <div className="mt-8 border border-dashed border-morandi-container rounded-lg p-8 text-center bg-morandi-container/5">
        <Upload size={48} className="mx-auto mb-4 text-morandi-secondary opacity-50" />
        <p className="text-morandi-secondary mb-2">拖拽文件至此處或點擊上傳</p>
        <p className="text-sm text-morandi-secondary/70">
          支援 PDF, DOC, DOCX, XLS, XLSX, JPG, PNG 等格式
        </p>
        <Button className="mt-4 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
          <Upload size={16} className="mr-1" />
          選擇文件
        </Button>
      </div>
    </div>
  )
}
