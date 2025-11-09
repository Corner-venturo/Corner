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

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { Plus } from 'lucide-react'
import { useCompanyStore, useAuthStore, type Company } from '@/stores'
import { useCompanyColumns } from './components/CompanyTableColumns'
import { CompanyFormDialog } from './components/CompanyFormDialog'
import type { CreateCompanyData } from '@/types/company.types'

export default function CompaniesPage() {
  const router = useRouter()
  const { items: companies, fetchAll, create, update } = useCompanyStore()
  const { user } = useAuthStore()
  const workspaceId = user?.workspace_id || ''

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | undefined>(undefined)

  // 載入企業客戶資料
  useEffect(() => {
    if (workspaceId) {
      fetchAll()
    }
  }, [workspaceId, fetchAll])

  // 查看企業詳情
  const handleViewDetail = (company: Company) => {
    router.push(`/customers/companies/${company.id}`)
  }

  // 新增企業客戶
  const handleCreate = async (data: CreateCompanyData) => {
    try {
      await create(data)
      setIsDialogOpen(false)
      alert('✅ 企業客戶新增成功')
    } catch (error) {
      console.error('新增企業客戶失敗:', error)
      alert('❌ 新增企業客戶失敗')
    }
  }

  // 編輯企業客戶
  const handleEdit = async (data: CreateCompanyData) => {
    if (!editingCompany) return

    try {
      await update(editingCompany.id, data)
      setEditingCompany(undefined)
      setIsDialogOpen(false)
      alert('✅ 企業客戶更新成功')
    } catch (error) {
      console.error('更新企業客戶失敗:', error)
      alert('❌ 更新企業客戶失敗')
    }
  }

  // 開啟新增對話框
  const handleOpenCreateDialog = () => {
    setEditingCompany(undefined)
    setIsDialogOpen(true)
  }

  // 表格欄位
  const columns = useCompanyColumns({ onView: handleViewDetail })

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
    </div>
  )
}
