'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, FileSpreadsheet, FileText, Presentation } from 'lucide-react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { DateCell, ActionCell } from '@/components/table-cells'
import { confirm } from '@/lib/ui/alert-dialog'
import { NewDocumentDialog } from '@/features/office/components/NewDocumentDialog'

// 文件類型
type DocumentType = 'spreadsheet' | 'document' | 'slides'

// 文件資料結構
interface OfficeDocument {
  id: string
  name: string
  type: DocumentType
  created_by: string
  created_at: string
  updated_at: string
}

// 暫時用假資料（之後會改成從資料庫讀取）
const mockDocuments: OfficeDocument[] = [
  {
    id: '1',
    name: '團費試算表',
    type: 'spreadsheet',
    created_by: 'William',
    created_at: '2026-01-19T10:00:00Z',
    updated_at: '2026-01-19T10:00:00Z',
  },
  {
    id: '2',
    name: '清邁五日行程報價',
    type: 'spreadsheet',
    created_by: 'William',
    created_at: '2026-01-18T14:30:00Z',
    updated_at: '2026-01-19T08:00:00Z',
  },
  {
    id: '3',
    name: '供應商合約範本',
    type: 'document',
    created_by: 'Admin',
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-17T16:00:00Z',
  },
  {
    id: '4',
    name: '公司介紹簡報',
    type: 'slides',
    created_by: 'Admin',
    created_at: '2026-01-10T11:00:00Z',
    updated_at: '2026-01-12T15:00:00Z',
  },
]

// 取得文件類型圖標
function getDocTypeIcon(type: DocumentType) {
  switch (type) {
    case 'spreadsheet':
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />
    case 'document':
      return <FileText className="w-5 h-5 text-blue-600" />
    case 'slides':
      return <Presentation className="w-5 h-5 text-orange-600" />
  }
}

export default function OfficePage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<OfficeDocument[]>(mockDocuments)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)

  const handleDelete = async (id: string) => {
    const confirmed = await confirm('確定要刪除此文件嗎？', {
      title: '刪除文件',
      type: 'warning',
    })
    if (confirmed) {
      setDocuments(prev => prev.filter(doc => doc.id !== id))
    }
  }

  const handleEdit = (doc: OfficeDocument) => {
    router.push(`/office/editor?id=${doc.id}&name=${encodeURIComponent(doc.name)}&type=${doc.type}`)
  }

  const handleCreate = () => {
    setIsNewDialogOpen(true)
  }

  const columns = [
    {
      key: 'type',
      label: '類型',
      width: '60px',
      render: (_: unknown, row: OfficeDocument) => (
        <div className="flex items-center justify-center">
          {getDocTypeIcon(row.type)}
        </div>
      ),
    },
    {
      key: 'name',
      label: '檔名',
      render: (_: unknown, row: OfficeDocument) => (
        <button
          onClick={() => handleEdit(row)}
          className="font-medium text-morandi-primary hover:underline text-left"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'created_by',
      label: '作者',
      width: '120px',
      render: (_: unknown, row: OfficeDocument) => (
        <span className="text-morandi-text-secondary">{row.created_by}</span>
      ),
    },
    {
      key: 'updated_at',
      label: '更新時間',
      width: '180px',
      render: (_: unknown, row: OfficeDocument) => (
        <DateCell date={row.updated_at} format="long" />
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '100px',
      render: (_: unknown, row: OfficeDocument) => (
        <ActionCell
          actions={[
            { icon: Edit2, label: '編輯', onClick: () => handleEdit(row) },
            { icon: Trash2, label: '刪除', onClick: () => handleDelete(row.id), variant: 'danger' },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <ListPageLayout
        title="文件管理"
        data={documents}
        columns={columns}
        searchable
        searchPlaceholder="搜尋檔名..."
        searchFields={['name']}
        headerActions={
          <button
            onClick={handleCreate}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增
          </button>
        }
      />

      <NewDocumentDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
      />
    </>
  )
}
