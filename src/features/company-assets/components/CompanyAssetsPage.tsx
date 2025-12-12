/**
 * CompanyAssetsPage - 公司資源管理頁面
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { FolderArchive, X } from 'lucide-react'
import { CompanyAssetsList } from './CompanyAssetsList'
import { CompanyAssetsDialog } from './CompanyAssetsDialog'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import type { CompanyAsset, CompanyAssetType } from '@/types/company-asset.types'

export const CompanyAssetsPage: React.FC = () => {
  const user = useAuthStore(state => state.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAsset, setEditingAsset] = useState<CompanyAsset | null>(null)
  const [assets, setAssets] = useState<CompanyAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<CompanyAsset | null>(null)

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'image' as CompanyAssetType,
    file: null as File | null,
    restricted: false,
  })

  // 判斷是否為管理者或會計
  const isAdminOrAccountant =
    user?.permissions?.includes('admin') ||
    user?.permissions?.includes('*') ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('accountant')

  // 載入資料
  const fetchAssets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('company_assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // 過濾受限資源（非管理者/會計看不到）
      const filteredData = (data || []).filter(asset => {
        const assetWithRestricted = asset as typeof asset & { restricted?: boolean }
        if (!assetWithRestricted.restricted) return true
        return isAdminOrAccountant
      })

      setAssets(filteredData as unknown as CompanyAsset[])
    } catch (error) {
      logger.error('載入公司資源失敗:', error)
    }
  }, [isAdminOrAccountant])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // 過濾資源
  const filteredAssets = assets.filter(asset =>
    searchQuery
      ? asset.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  )

  const handleOpenAddDialog = useCallback(() => {
    setIsEditMode(false)
    setEditingAsset(null)
    setFormData({ name: '', asset_type: 'image', file: null, restricted: false })
    setIsDialogOpen(true)
  }, [])

  const handleEdit = useCallback((asset: CompanyAsset) => {
    setIsEditMode(true)
    setEditingAsset(asset)
    setFormData({
      name: asset.name || '',
      asset_type: asset.asset_type || 'image',
      file: null,
      restricted: asset.restricted || false,
    })
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (asset: CompanyAsset) => {
    const confirmed = await confirm(`確定要刪除「${asset.name}」嗎？`, {
      title: '刪除資源',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/storage/upload?bucket=company-assets&path=${encodeURIComponent(asset.file_path)}`,
        { method: 'DELETE' }
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '刪除檔案失敗')
      }

      const { error } = await supabase.from('company_assets').delete().eq('id', asset.id)
      if (error) throw error

      await alert('刪除成功', 'success')
      fetchAssets()
    } catch (error) {
      logger.error('刪除失敗:', error)
      await alert('刪除失敗', 'error')
    }
  }, [fetchAssets])

  const handlePreview = useCallback((asset: CompanyAsset) => {
    setPreviewAsset(asset)
  }, [])

  const handleDownload = useCallback((asset: CompanyAsset) => {
    const { data } = supabase.storage.from('company-assets').getPublicUrl(asset.file_path)
    const link = document.createElement('a')
    link.href = data.publicUrl
    link.download = asset.name
    link.target = '_blank'
    link.click()
  }, [])

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    setIsEditMode(false)
    setEditingAsset(null)
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
      throw new Error(errorData.error || '上傳失敗')
    }
  }

  const deleteFile = async (filePath: string): Promise<void> => {
    const response = await fetch(
      `/api/storage/upload?bucket=company-assets&path=${encodeURIComponent(filePath)}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '刪除失敗')
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      await alert('請輸入資料名稱', 'warning')
      return
    }

    if (!isEditMode && !formData.file) {
      await alert('請選擇檔案', 'warning')
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

        const { error } = await supabase
          .from('company_assets')
          .update(updateData)
          .eq('id', editingAsset.id)

        if (error) throw error
        await alert('更新成功', 'success')
      } else {
        // 新增模式
        const file = formData.file!
        const fileExt = file.name.split('.').pop()
        const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const filePath = `assets/${safeFileName}`

        await uploadFile(file, filePath)

        const userName =
          user?.display_name || user?.chinese_name || user?.personal_info?.email || 'Unknown'

         
        const { error: dbError } = await (supabase as any).from('company_assets').insert({
          name: formData.name,
          category: formData.asset_type, // 使用 category 欄位而非 asset_type
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id || null,
          uploaded_by_name: userName,
          description: formData.restricted ? '受限資源' : null,
        })

        if (dbError) throw dbError
        await alert('新增成功', 'success')
      }

      handleCloseDialog()
      fetchAssets()
    } catch (error) {
      logger.error('儲存失敗:', error)
      await alert(`儲存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [formData, isEditMode, editingAsset, user, handleCloseDialog, fetchAssets])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="公司資源管理"
        icon={FolderArchive}
        breadcrumb={[
          { label: '資料庫', href: '/database' },
          { label: '公司資源管理', href: '/database/company-assets' },
        ]}
        showSearch
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋檔案名稱..."
        onAdd={handleOpenAddDialog}
        addLabel="新增資源"
      />

      <div className="flex-1 overflow-auto">
        <CompanyAssetsList
          assets={filteredAssets}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onThumbnailClick={handlePreview}
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

      {/* 預覽彈窗 - 用 Portal 掛到 body */}
      {previewAsset && createPortal(
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 標題列 */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-medium text-morandi-primary truncate">{previewAsset.name}</h3>
              <button
                className="text-morandi-secondary hover:text-morandi-primary transition-colors"
                onClick={() => setPreviewAsset(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* 預覽內容 */}
            <div className="p-4 flex items-center justify-center bg-morandi-container/20 min-h-[300px] max-h-[60vh]">
              {previewAsset.asset_type === 'image' ? (
                <img
                  src={supabase.storage.from('company-assets').getPublicUrl(previewAsset.file_path).data.publicUrl}
                  alt={previewAsset.name}
                  className="max-w-full max-h-[55vh] object-contain"
                />
              ) : previewAsset.asset_type === 'video' ? (
                <video
                  src={supabase.storage.from('company-assets').getPublicUrl(previewAsset.file_path).data.publicUrl}
                  controls
                  className="max-w-full max-h-[55vh]"
                />
              ) : (
                <iframe
                  src={supabase.storage.from('company-assets').getPublicUrl(previewAsset.file_path).data.publicUrl}
                  className="w-full h-[55vh] bg-white"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
