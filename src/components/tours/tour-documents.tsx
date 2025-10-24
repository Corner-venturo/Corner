'use client';

import { useState } from 'react';
import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tour } from '@/stores/types';
import { FileText, Upload, Download, Eye, CheckCircle, AlertCircle, Clock, Plus } from 'lucide-react';

interface TourDocumentsProps {
  tour: Tour;
  orderFilter?: string; // 選填：只顯示特定訂單的文件
}

export function TourDocuments({ orderFilter }: TourDocumentsProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'contract',
    description: ''
  });

  // 模擬文件資料（實際使用時會從 store 取得）
  const allMockDocuments = [
    {
      id: '1',
      name: '旅遊合約書',
      type: '合約',
      status: '已簽署',
      uploadDate: '2024-11-01',
      size: '2.5 MB',
      format: 'PDF',
      description: '客戶已簽署完成',
      signedBy: '王小明'
    },
    {
      id: '2',
      name: '行程表',
      type: '行程',
      status: '已確認',
      uploadDate: '2024-11-05',
      size: '1.2 MB',
      format: 'PDF',
      description: '詳細行程安排',
      signedBy: ''
    },
    {
      id: '3',
      name: '保險單',
      type: '保險',
      status: '待確認',
      uploadDate: '2024-11-10',
      size: '800 KB',
      format: 'PDF',
      description: '旅遊保險證明',
      signedBy: ''
    },
    {
      id: '4',
      name: '機票確認書',
      type: '票務',
      status: '已確認',
      uploadDate: '2024-11-08',
      size: '1.5 MB',
      format: 'PDF',
      description: '航班資訊確認',
      signedBy: ''
    },
    {
      id: '5',
      name: '飯店確認書',
      type: '住宿',
      status: '已確認',
      uploadDate: '2024-11-09',
      size: '900 KB',
      format: 'PDF',
      description: '住宿預訂確認',
      signedBy: ''
    }
  ];

  // 根據 orderFilter 過濾文件（實際使用時會從 store 根據 order_id 過濾）
  const mockDocuments = orderFilter
    ? allMockDocuments.filter(doc => {
        // 模擬：當有 orderFilter 時，只顯示部分文件
        // 實際使用時會根據 doc.order_id === orderFilter 過濾
        return doc.type === '合約' || doc.type === '行程表';
      })
    : allMockDocuments;

  const handleUploadDocument = () => {
    if (!newDocument.name) return;

    // 這裡應該實作文件上傳邏輯
    console.log('Uploading document:', newDocument);

    setNewDocument({
      name: '',
      type: 'contract',
      description: ''
    });
    setIsUploadDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, unknown> = {
      '已簽署': CheckCircle,
      '已確認': CheckCircle,
      '待確認': Clock,
      '待簽署': AlertCircle
    };
    return icons[status] || Clock;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      '已簽署': 'bg-morandi-green text-white',
      '已確認': 'bg-morandi-green text-white',
      '待確認': 'bg-morandi-gold text-white',
      '待簽署': 'bg-morandi-red text-white'
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '合約': 'text-red-600',
      '行程': 'text-blue-600',
      '保險': 'text-green-600',
      '票務': 'text-purple-600',
      '住宿': 'text-orange-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const documentsByType = mockDocuments.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, typeof mockDocuments>);

  return (
    <div className="space-y-6">
      {/* 文件統計 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">文件狀態概覽</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-primary">
              {mockDocuments.length}
            </div>
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
                const StatusIcon = getStatusIcon(doc.status);
                return (
                  <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
                    <div className="col-span-3">
                      <div className="flex items-center">
                        <StatusIcon
                          size={16}
                          className={
                            doc.status.includes('已') ? 'text-morandi-green' :
                            doc.status.includes('待') ? 'text-morandi-gold' :
                            'text-morandi-red'
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
                        <div className="text-xs text-morandi-secondary">
                          簽署人：{doc.signedBy}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm text-morandi-primary">{doc.uploadDate}</div>
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}>
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
                );
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
                onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入文件名稱"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">文件類型</label>
              <select
                value={newDocument.type}
                onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="contract">合約</option>
                <option value="itinerary">行程</option>
                <option value="insurance">保險</option>
                <option value="ticket">票務</option>
                <option value="accommodation">住宿</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">說明</label>
              <Input
                value={newDocument.description}
                onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                placeholder="文件說明"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">選擇檔案</label>
              <div className="border-2 border-dashed border-morandi-container rounded-lg p-6 text-center">
                <Upload size={32} className="mx-auto mb-2 text-morandi-secondary" />
                <p className="text-sm text-morandi-secondary mb-2">
                  拖拽檔案到此處或點擊選擇
                </p>
                <Button variant="outline" size="sm">
                  選擇檔案
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
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
  );
}