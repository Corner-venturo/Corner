/**
 * 企業客戶管理頁面
 *
 * 功能：
 * 1. 企業客戶列表
 * 2. 新增/編輯企業客戶
 * 3. 查看企業詳情（含聯絡人）
 * 4. VIP 等級管理
 * 5. 付款條件設定
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { Plus } from 'lucide-react'
import { useAuthStore, type Company } from '@/stores'
import { useCompanies, createCompany, updateCompany, deleteCompany } from '@/data'
import { useCompanyColumns } from './components/CompanyTableColumns'
import { CompanyFormDialog } from './components/CompanyFormDialog'
import { CompanyDetailDialog } from './components/CompanyDetailDialog'
import type { CreateCompanyData } from '@/types/company.types'
import { alert, confirm } from '@/lib/ui/alert-dialog'
import { supabase } from '@/lib/supabase/client'

export default function CompaniesPage() {
  const { items: companies } = useCompanies()
  const { user } = useAuthStore()
  const workspaceId = user?.workspace_id || ''

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | undefined>(undefined)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // 查看企業詳情
  const handleViewDetail = (company: Company) => {
    setSelectedCompany(company)
    setIsDetailOpen(true)
  }

  // 更新企業客戶（從詳情對話框）
  const handleUpdateFromDetail = async (data: CreateCompanyData) => {
    if (!selectedCompany) return

    try {
      await updateCompany(selectedCompany.id, data)
      // 更新 selectedCompany 以反映變更
      setSelectedCompany({ ...selectedCompany, ...data } as Company)
      await alert('企業客戶更新成功', 'success')
    } catch (error) {
      logger.error('更新企業客戶失敗:', error)
      await alert('更新企業客戶失敗', 'error')
    }
  }

  // 新增企業客戶
  const handleCreate = async (data: CreateCompanyData) => {
    try {
      await createCompany(data as Parameters<typeof createCompany>[0])
      setIsDialogOpen(false)
      await alert('企業客戶新增成功', 'success')
    } catch (error) {
      logger.error('新增企業客戶失敗:', error)
      await alert('新增企業客戶失敗', 'error')
    }
  }

  // 編輯企業客戶
  const handleEdit = async (data: CreateCompanyData) => {
    if (!editingCompany) return

    try {
      await updateCompany(editingCompany.id, data)
      setEditingCompany(undefined)
      setIsDialogOpen(false)
      await alert('企業客戶更新成功', 'success')
    } catch (error) {
      logger.error('更新企業客戶失敗:', error)
      await alert('更新企業客戶失敗', 'error')
    }
  }

  // 開啟新增對話框
  const handleOpenCreateDialog = () => {
    setEditingCompany(undefined)
    setIsDialogOpen(true)
  }

  // 開啟編輯對話框
  const handleOpenEditDialog = (company: Company) => {
    setEditingCompany(company)
    setIsDialogOpen(true)
  }

  // 刪除企業客戶
  const handleDeleteCompany = async (company: Company) => {
    try {
      // 檢查是否有關聯的聯絡人
      const { data: contacts, error: contactsError } = await supabase
        .from('company_contacts')
        .select('id, name')
        .eq('company_id', company.id)
        .limit(5)

      if (contactsError) {
        logger.error('檢查聯絡人時發生錯誤:', contactsError)
      }

      // 如果有關聯的聯絡人，提示用戶
      if (contacts && contacts.length > 0) {
        const contactNames = contacts.map(c => c.name).join('、')
        const contactInfo = contacts.length > 5 
          ? `${contactNames}... 等 ${contacts.length} 位聯絡人`
          : contactNames

        const confirmed = await confirm(
          `此企業有 ${contacts.length} 位關聯的聯絡人（${contactInfo}），刪除企業將同時刪除這些聯絡人。\n\n確定要刪除企業「${company.company_name}」嗎？`,
          {
            title: '刪除企業客戶',
            type: 'warning',
            confirmText: '確定刪除',
            cancelText: '取消',
          }
        )

        if (!confirmed) return
      } else {
        // 沒有關聯的聯絡人，直接確認刪除
        const confirmed = await confirm(
          `確定要刪除企業「${company.company_name}」嗎？`,
          {
            title: '刪除企業客戶',
            type: 'warning',
            confirmText: '確定刪除',
            cancelText: '取消',
          }
        )

        if (!confirmed) return
      }

      // 執行刪除
      await deleteCompany(company.id)
      await alert('企業客戶刪除成功', 'success')
    } catch (error) {
      logger.error('刪除企業客戶失敗:', error)
      await alert('刪除企業客戶失敗', 'error')
    }
  }

  // 表格欄位
  const columns = useCompanyColumns({ 
    onView: handleViewDetail,
    onEdit: handleOpenEditDialog,
    onDelete: handleDeleteCompany,
  })

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="企業客戶管理"
        actions={
          <Button
            onClick={handleOpenCreateDialog}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} className="mr-2" />
            新增企業
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          data={companies}
          columns={columns}
          defaultSort={{ key: 'created_at', direction: 'desc' }}
          searchable
          searchPlaceholder="搜尋企業名稱、統編或聯絡資訊..."
        />
      </div>

      {/* 新增/編輯企業對話框 */}
      <CompanyFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingCompany(undefined)
        }}
        onSubmit={editingCompany ? handleEdit : handleCreate}
        workspaceId={workspaceId}
        company={editingCompany}
      />

      {/* 企業詳情 Dialog */}
      <CompanyDetailDialog
        company={selectedCompany}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={handleUpdateFromDetail}
      />
    </div>
  )
}
