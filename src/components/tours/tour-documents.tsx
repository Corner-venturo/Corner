'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tour } from '@/stores/types'
import {
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  LucideIcon,
} from 'lucide-react'

interface MockDocument {
  id: string
  name: string
  type: string
  description: string
  status: string
  format: string
  size: string
  uploadDate: string
  signedBy?: string
  order_id?: string
}

interface TourDocumentsProps {
  tour: Tour
  orderFilter?: string
  showSummary?: boolean
}

export function TourDocuments({ orderFilter, showSummary = true }: TourDocumentsProps) {
   
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'contract',
    description: '',
  })

  const allMockDocuments: MockDocument[] = []

  const mockDocuments = orderFilter
    ? allMockDocuments.filter(doc => doc.order_id === orderFilter)
    : allMockDocuments

  const handleUploadDocument = () => {
    if (!newDocument.name) return

    setNewDocument({
      name: '',
      type: 'contract',
      description: '',
    })
    setIsUploadDialogOpen(false)
  }

  const getStatusIcon = (status: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      已簽署: CheckCircle,
      已確認: CheckCircle,
      待確認: Clock,
      待簽署: AlertCircle,
    }
    return icons[status] || Clock
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      已簽署: 'bg-morandi-green text-white',
      已確認: 'bg-morandi-green text-white',
      待確認: 'bg-morandi-gold text-white',
      待簽署: 'bg-morandi-red text-white',
    }
    return badges[status] || 'bg-morandi-container text-morandi-secondary'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      合約: 'text-morandi-red',
      行程: 'text-status-info',
      保險: 'text-status-success',
      票務: 'text-purple-600',
      住宿: 'text-status-warning',
    }
    return colors[type] || 'text-morandi-secondary'
  }

  const documentsByType = mockDocuments.reduce(
    (acc, doc) => {
      if (!acc[doc.type]) acc[doc.type] = []
      acc[doc.type].push(doc)
      return acc
    },
    {} as Record<string, MockDocument[]>
  )

  return (
    <div className="space-y-4">
      {/* 統計 + 按鈕 */}
      {showSummary && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-morandi-secondary">總文件</span>
              <span className="ml-2 font-semibold text-morandi-primary">{mockDocuments.length}</span>
            </div>
            <div>
              <span className="text-morandi-secondary">已確認</span>
              <span className="ml-2 font-semibold text-morandi-green">{mockDocuments.filter(doc => doc.status.includes('已')).length}</span>
            </div>
            <div>
              <span className="text-morandi-secondary">待處理</span>
              <span className="ml-2 font-semibold text-morandi-gold">{mockDocuments.filter(doc => doc.status.includes('待')).length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download size={14} className="mr-1" />
              批量下載
            </Button>
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              size="sm"
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Plus size={14} className="mr-1" />
              上傳文件
            </Button>
          </div>
        </div>
      )}

      {/* 文件列表 */}
      <div className="border border-border rounded-lg overflow-hidden">
        {mockDocuments.length === 0 ? (
          <div className="py-12 text-center text-morandi-secondary">
            <FileText size={24} className="mx-auto mb-4 opacity-50" />
            <p>尚無文件</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mockDocuments.map((doc) => {
              const StatusIcon = getStatusIcon(doc.status)
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-morandi-container/20"
                >
                  <StatusIcon
                    size={16}
                    className={
                      doc.status.includes('已') ? 'text-morandi-green' :
                      doc.status.includes('待') ? 'text-morandi-gold' : 'text-morandi-red'
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-morandi-primary">{doc.name}</div>
                    <div className="text-xs text-morandi-secondary">{doc.format} • {doc.size} • {doc.uploadDate}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(doc.status)}`}>
                    {doc.status}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Download size={14} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 上傳文件對話框 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>上傳文件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">文件名稱</label>
              <Input
                value={newDocument.name}
                onChange={e => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入文件名稱"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">文件類型</label>
              <Select
                value={newDocument.type}
                onValueChange={value => setNewDocument(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">合約</SelectItem>
                  <SelectItem value="itinerary">行程</SelectItem>
                  <SelectItem value="insurance">保險</SelectItem>
                  <SelectItem value="ticket">票務</SelectItem>
                  <SelectItem value="accommodation">住宿</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">說明</label>
              <Input
                value={newDocument.description}
                onChange={e => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                placeholder="文件說明"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                選擇檔案
              </label>
              <div className="border-2 border-dashed border-morandi-container rounded-lg p-6 text-center">
                <Upload size={32} className="mx-auto mb-2 text-morandi-secondary" />
                <p className="text-sm text-morandi-secondary mb-2">拖拽檔案到此處或點擊選擇</p>
                <Button variant="outline" size="sm">
                  選擇檔案
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleUploadDocument}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                上傳
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
