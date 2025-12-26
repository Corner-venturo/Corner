'use client'

import { useState } from 'react'
import { ContentContainer } from '@/components/layout/content-container'
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
}

export function TourDocuments({ orderFilter }: TourDocumentsProps) {
   
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
    <div className="space-y-6">
      {/* 文件統計 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">文件狀態概覽</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-primary">{mockDocuments.length}</div>
            <div className="text-sm text-morandi-secondary">總文件數</div>
          </div>
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-green">
              {mockDocuments.filter(doc => doc.status.includes('已')).length}
            </div>
            <div className="text-sm text-morandi-secondary">已確認</div>
          </div>
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-gold">
              {mockDocuments.filter(doc => doc.status.includes('待')).length}
            </div>
            <div className="text-sm text-morandi-secondary">待處理</div>
          </div>
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-primary">
              {mockDocuments.filter(doc => doc.signedBy).length}
            </div>
            <div className="text-sm text-morandi-secondary">已簽署</div>
          </div>
        </div>
      </ContentContainer>

      {/* 文件操作按鈕 - 右上角 */}
      <div className="flex justify-end gap-2 mb-6">
        <Button variant="outline">
          <Download size={16} className="mr-2" />
          批量下載
        </Button>
        <Button
          onClick={() => setIsUploadDialogOpen(true)}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Plus size={16} className="mr-2" />
          上傳文件
        </Button>
      </div>

      {/* 文件分類展示 */}
      <div className="space-y-6">
        {Object.entries(documentsByType).map(([type, documents]) => (
          <ContentContainer key={type}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-morandi-primary flex items-center">
                <FileText size={20} className={`mr-2 ${getTypeColor(type)}`} />
                {type}文件
                <span className="ml-2 text-sm text-morandi-secondary">
                  ({documents.length} 個文件)
                </span>
              </h4>
            </div>

            <div className="space-y-2">
              {documents.map((doc) => {
                const StatusIcon = getStatusIcon(doc.status)
                return (
                  <div
                    key={doc.id}
                    className="grid grid-cols-12 gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="col-span-3">
                      <div className="flex items-center">
                        <StatusIcon
                          size={16}
                          className={
                            doc.status.includes('已')
                              ? 'text-morandi-green'
                              : doc.status.includes('待')
                                ? 'text-morandi-gold'
                                : 'text-morandi-red'
                          }
                        />
                        <div className="ml-2">
                          <div className="font-medium text-morandi-primary">{doc.name}</div>
                          <div className="text-xs text-morandi-secondary">
                            {doc.format} • {doc.size}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="text-sm text-morandi-primary">{doc.description}</div>
                      {doc.signedBy && (
                        <div className="text-xs text-morandi-secondary">簽署人：{doc.signedBy}</div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm text-morandi-primary">{doc.uploadDate}</div>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Eye size={12} className="mr-1" />
                          預覽
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download size={12} className="mr-1" />
                          下載
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ContentContainer>
        ))}
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
