'use client'
/**
 * CompanyAssetsPage - 公司資源管理頁面
 * 
 * 改用樹狀資料夾結構（參考 TourFilesTree）
 */


import { logger } from '@/lib/utils/logger'
import React, { useState, useCallback } from 'react'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { FolderArchive } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CompanyAssetsTree } from './CompanyAssetsTree'
import { CompanyAssetsDialog } from './CompanyAssetsDialog'
import { supabase } from '@/lib/supabase/client'
import { createCompanyAsset, updateCompanyAsset } from '@/data/entities/company-assets'
import { useAuthStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import type { CompanyAsset, CompanyAssetType } from '@/types/company-asset.types'
import { COMPANY_ASSETS_LABELS } from '../constants/labels'

export const CompanyAssetsPage: React.FC = () => {
  const user = useAuthStore(state => state.user)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAsset, setEditingAsset] = useState<CompanyAsset | null>(null)
  const [previewAsset, setPreviewAsset] = useState<CompanyAsset | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'image' as CompanyAssetType,
    file: null as File | null,
    restricted: false,
  })

  // 處理選取檔案（預覽）
  const handleSelectFile = useCallback((asset: { id: string; name: string; file_path: string; mime_type: string | null }) => {
    setPreviewAsset(asset as CompanyAsset)
  }, [])

  // 處理新增檔案
  const handleAddFile = useCallback((folderId: string | null) => {
    setIsEditMode(false)
    setEditingAsset(null)
    setTargetFolderId(folderId)
    setFormData({ name: '', asset_type: 'image', file: null, restricted: false })
    setIsDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    setIsEditMode(false)
    setEditingAsset(null)
    setTargetFolderId(null)
    setIsLoading(false)
    setFormData({ name: '', asset_type: 'image', file: null, restricted: false })
  }, [])

  const handleFormFieldChange = useCallback(
    <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  const uploadFile = async (file: File, filePath: string): Promise<void> => {
    const formDataToSend = new FormData()
    formDataToSend.append('file', file)
    formDataToSend.append('bucket', 'company-assets')
    formDataToSend.append('path', filePath)

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formDataToSend,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || COMPANY_ASSETS_LABELS.上傳失敗)
    }
  }

  const deleteFile = async (filePath: string): Promise<void> => {
    const response = await fetch(
      `/api/storage/upload?bucket=company-assets&path=${encodeURIComponent(filePath)}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || COMPANY_ASSETS_LABELS.刪除失敗)
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      await alert(COMPANY_ASSETS_LABELS.請輸入資料名稱, 'warning')
      return
    }

    if (!isEditMode && !formData.file) {
      await alert(COMPANY_ASSETS_LABELS.請選擇檔案, 'warning')
      return
    }

    setIsLoading(true)
    try {
      if (isEditMode && editingAsset) {
        // 更新模式
        const updateData: Record<string, unknown> = {
          name: formData.name,
          asset_type: formData.asset_type,
          restricted: formData.restricted,
        }

        if (formData.file) {
          await deleteFile(editingAsset.file_path)

          const fileExt = formData.file.name.split('.').pop()
          const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
          const filePath = `assets/${safeFileName}`

          await uploadFile(formData.file, filePath)

          updateData.file_path = filePath
          updateData.file_size = formData.file.size
          updateData.mime_type = formData.file.type
        }

        await updateCompanyAsset(editingAsset.id, updateData)
        await alert(COMPANY_ASSETS_LABELS.更新成功, 'success')
      } else {
        // 新增模式
        const file = formData.file!
        const fileExt = file.name.split('.').pop()
        const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const filePath = `assets/${safeFileName}`

        await uploadFile(file, filePath)

        const userName =
          user?.display_name || user?.chinese_name || user?.personal_info?.email || 'Unknown'

        await createCompanyAsset({
          name: formData.name,
          asset_type: formData.asset_type,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id || null,
          uploaded_by_name: userName,
          description: formData.restricted ? COMPANY_ASSETS_LABELS.受限資源 : null,
          restricted: formData.restricted,
          workspace_id: user?.workspace_id ?? null,
          folder_id: targetFolderId,
        })
        await alert(COMPANY_ASSETS_LABELS.新增成功, 'success')
      }

      handleCloseDialog()
      setRefreshKey(k => k + 1) // 觸發重新載入
    } catch (error) {
      logger.error(COMPANY_ASSETS_LABELS.儲存失敗, error)
      await alert(`儲存失敗: ${error instanceof Error ? error.message : COMPANY_ASSETS_LABELS.未知錯誤}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [formData, isEditMode, editingAsset, user, handleCloseDialog, targetFolderId])

  return (
    <ContentPageLayout
      title={COMPANY_ASSETS_LABELS.公司資源管理}
      icon={FolderArchive}
      breadcrumb={[
        { label: COMPANY_ASSETS_LABELS.首頁, href: '/' },
        { label: COMPANY_ASSETS_LABELS.資料庫管理, href: '/database' },
        { label: COMPANY_ASSETS_LABELS.公司資源管理, href: '/database/company-assets' },
      ]}
      onAdd={() => handleAddFile(null)}
      addLabel={COMPANY_ASSETS_LABELS.上傳檔案}
      contentClassName="flex-1 overflow-hidden"
    >
        <div className="h-full border border-border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col">
          <CompanyAssetsTree
            key={refreshKey}
            onSelectFile={handleSelectFile}
            onAddFile={handleAddFile}
          />
        </div>

      <CompanyAssetsDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        isEditMode={isEditMode}
        formData={formData}
        onFormFieldChange={handleFormFieldChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* 預覽彈窗 */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent level={1} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-morandi-primary truncate">
              {previewAsset?.name}
            </DialogTitle>
          </DialogHeader>

          {/* 預覽內容 */}
          <div className="flex items-center justify-center bg-morandi-container/20 min-h-[300px] max-h-[60vh] rounded-lg">
            {previewAsset?.asset_type === 'image' ? (
              <img src={supabase.storage.from('company-assets').getPublicUrl(previewAsset.file_path).data.publicUrl}
                alt={previewAsset.name}
                className="max-w-full max-h-[55vh] object-contain"
              />
            ) : previewAsset?.asset_type === 'video' ? (
              <video
                src={supabase.storage.from('company-assets').getPublicUrl(previewAsset.file_path).data.publicUrl}
                controls
                className="max-w-full max-h-[55vh]"
              />
            ) : previewAsset ? (
              <iframe
                src={supabase.storage.from('company-assets').getPublicUrl(previewAsset.file_path).data.publicUrl}
                className="w-full h-[55vh] bg-card"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </ContentPageLayout>
  )
}
