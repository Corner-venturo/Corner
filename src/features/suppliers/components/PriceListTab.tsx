/**
 * PriceListTab - 供應商價目表頁籤（簡化 Excel 風格）
 */

'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSupplierStore, useCostTemplateStore } from '@/stores'
import { formatCurrency } from '@/lib/utils/currency'
import { Building2, Plus, Pencil, Trash2, Car, Users, UtensilsCrossed, Hotel, Ticket, Package } from 'lucide-react'
import { CostTemplate } from '@/types/supplier.types'
import { CostTemplateDialog } from './CostTemplateDialog'

// 預設分類
const CATEGORIES = [
  { value: 'transport', label: '交通服務', icon: Car },
  { value: 'guide', label: '導遊服務', icon: Users },
  { value: 'accommodation', label: '住宿', icon: Hotel },
  { value: 'meal', label: '餐飲', icon: UtensilsCrossed },
  { value: 'ticket', label: '門票', icon: Ticket },
  { value: 'other', label: '其他', icon: Package },
]

interface CategorySectionProps {
  supplierId: string
  category: typeof CATEGORIES[0]
  templates: CostTemplate[]
  onAddItem: (supplierId: string, category: string) => void
  onEditItem: (template: CostTemplate) => void
  onDeleteItem: (templateId: string) => void
}

const CategorySection: React.FC<CategorySectionProps> = ({
  supplierId,
  category,
  templates,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  const Icon = category.icon

  if (templates.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium">{category.label}</h4>
          <Badge variant="secondary">{templates.length}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddItem(supplierId, category.value)}
        >
          <Plus className="h-3 w-3 mr-1" />
          新增項目
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>項目名稱</TableHead>
            <TableHead className="text-right">單價</TableHead>
            <TableHead>單位</TableHead>
            <TableHead>備註</TableHead>
            <TableHead className="w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map(template => (
            <TableRow key={template.id}>
              <TableCell>{template.item_name}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(template.cost_price, template.currency)}
              </TableCell>
              <TableCell>{template.unit}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {template.notes || '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditItem(template)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteItem(template.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export const PriceListTab: React.FC = () => {
  const { items: suppliers } = useSupplierStore()
  const { items: costTemplates, delete: deleteTemplate } = useCostTemplateStore()
  const [editingTemplate, setEditingTemplate] = useState<CostTemplate | null>(null)
  const [addingToSupplier, setAddingToSupplier] = useState<{
    supplierId: string
    category: string
  } | null>(null)

  // 只顯示啟用的供應商
  const activeSuppliers = useMemo(
    () => suppliers.filter(s => s.is_active),
    [suppliers]
  )

  // 按供應商和分類分組
  const getTemplatesByCategory = (supplierId: string, categoryValue: string) => {
    return costTemplates.filter(
      ct =>
        ct.supplier_id === supplierId &&
        ct.category === categoryValue &&
        ct.is_active
    )
  }

  // 處理新增項目
  const handleAddItem = (supplierId: string, category: string) => {
    setAddingToSupplier({ supplierId, category })
  }

  // 處理編輯項目
  const handleEditItem = (template: CostTemplate) => {
    setEditingTemplate(template)
  }

  // 關閉 Dialog
  const handleCloseDialog = () => {
    setAddingToSupplier(null)
    setEditingTemplate(null)
  }

  // 處理刪除項目
  const handleDeleteItem = async (templateId: string) => {
    if (!confirm('確定要刪除此項目？')) return
    try {
      await deleteTemplate(templateId)
    } catch (error) {
      console.error('刪除失敗:', error)
      alert('刪除失敗')
    }
  }

  return (
    <>
      <div className="space-y-6 p-6">
        {activeSuppliers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>尚無供應商資料</p>
          </div>
        ) : (
          activeSuppliers.map(supplier => {
            // 計算該供應商的總項目數
            const allTemplates = costTemplates.filter(
              ct => ct.supplier_id === supplier.id && ct.is_active
            )

            return (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{supplier.name}</h3>
                      {supplier.name_en && (
                        <p className="text-sm text-muted-foreground">{supplier.name_en}</p>
                      )}
                    </div>
                    <Badge variant="outline">{allTemplates.length} 個項目</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {allTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-4">尚未建立價目表</p>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {CATEGORIES.map(cat => (
                          <Button
                            key={cat.value}
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddItem(supplier.id, cat.value)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            新增{cat.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {CATEGORIES.map(category => {
                        const templates = getTemplatesByCategory(supplier.id, category.value)
                        return (
                          <CategorySection
                            key={category.value}
                            supplierId={supplier.id}
                            category={category}
                            templates={templates}
                            onAddItem={handleAddItem}
                            onEditItem={handleEditItem}
                            onDeleteItem={handleDeleteItem}
                          />
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 新增/編輯 Dialog */}
      {(addingToSupplier || editingTemplate) && (
        <CostTemplateDialog
          isOpen={true}
          onClose={handleCloseDialog}
          supplierId={addingToSupplier?.supplierId || editingTemplate?.supplier_id || ''}
          category={addingToSupplier?.category || editingTemplate?.category || 'transport'}
          editingTemplate={editingTemplate}
        />
      )}
    </>
  )
}
