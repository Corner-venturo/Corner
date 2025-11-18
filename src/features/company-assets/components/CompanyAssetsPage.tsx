/**
 * CompanyAssetsPage - 公司資源管理頁面
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Trash2, Download, Eye, Search } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { supabase } from '@/lib/supabase/client'
import {
  CompanyAsset,
  CompanyAssetCategory,
  COMPANY_ASSET_CATEGORY_LABELS,
} from '@/types/company-asset.types'
import { cn } from '@/lib/utils'

export const CompanyAssetsPage: React.FC = () => {
  const user = useAuthStore(state => state.user)
  const [assets, setAssets] = useState<CompanyAsset[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CompanyAssetCategory | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // 載入資源列表
  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('company_assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssets(data as any || [])
    } catch (error) {
      logger.error('載入公司資源失敗:', error)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  // 上傳檔案
  const handleUpload = async (category: CompanyAssetCategory, file: File) => {
    setIsUploading(true)
    try {
      // 生成檔案路徑
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const filePath = `${category}/${fileName}`

      // 上傳到 Storage
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file)

      if (uploadError) {
        logger.error('Storage upload error:', uploadError)
        throw uploadError
      }

      // 儲存到資料表
      const userName = user?.display_name || user?.chinese_name || user?.personal_info?.email || 'Unknown'

      const { error: dbError } = await supabase.from('company_assets').insert({
        name: file.name,
        category,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user?.id || null,
        uploaded_by_name: userName,
      })

      if (dbError) {
        logger.error('Database insert error:', dbError)
        throw dbError
      }

      alert('上傳成功！')
      fetchAssets()
    } catch (error: any) {
      logger.error('上傳失敗:', error)
      alert(`上傳失敗: ${error.message || '未知錯誤'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // 刪除檔案
  const handleDelete = async (asset: CompanyAsset) => {
    if (!confirm(`確定要刪除「${asset.name}」嗎？`)) return

    try {
      // 從 Storage 刪除
      const { error: storageError } = await supabase.storage
        .from('company-assets')
        .remove([asset.file_path])

      if (storageError) throw storageError

      // 從資料表刪除
      const { error: dbError } = await supabase.from('company_assets').delete().eq('id', asset.id)

      if (dbError) throw dbError

      alert('刪除成功！')
      fetchAssets()
    } catch (error) {
      logger.error('刪除失敗:', error)
      alert('刪除失敗')
    }
  }

  // 預覽檔案
  const handlePreview = (asset: CompanyAsset) => {
    const { data } = supabase.storage.from('company-assets').getPublicUrl(asset.file_path)

    setPreviewUrl(data.publicUrl)
  }

  // 下載檔案
  const handleDownload = async (asset: CompanyAsset) => {
    const { data } = supabase.storage.from('company-assets').getPublicUrl(asset.file_path)

    window.open(data.publicUrl, '_blank')
  }

  // 篩選資源
  const filteredAssets = assets.filter(asset => {
    const matchCategory = selectedCategory === 'all' || asset.category === selectedCategory
    const matchSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  const categories: CompanyAssetCategory[] = ['logos', 'seals', 'illustrations', 'documents']

  return (
    <div className="space-y-6">
      {/* 標題與搜尋 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-morandi-primary">公司資源管理</h2>
          <p className="text-sm text-morandi-secondary mt-1">
            管理公司 Logo、大小章、插圖等資源檔案
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-morandi-secondary" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜尋檔案..."
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* 分類標籤 */}
      <div className="flex gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          size="sm"
        >
          全部
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
            size="sm"
          >
            {COMPANY_ASSET_CATEGORY_LABELS[category]}
          </Button>
        ))}
      </div>

      {/* 上傳區域 */}
      <div className="grid grid-cols-4 gap-4">
        {categories.map(category => (
          <div
            key={category}
            className="border-2 border-dashed border-morandi-border rounded-lg p-4 text-center hover:border-morandi-gold transition-colors"
          >
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(category, file)
                }}
              />
              <Upload className="h-8 w-8 mx-auto text-morandi-secondary mb-2" />
              <p className="text-sm font-medium text-morandi-primary">
                上傳{COMPANY_ASSET_CATEGORY_LABELS[category]}
              </p>
              <p className="text-xs text-morandi-secondary mt-1">點擊選擇檔案</p>
            </label>
          </div>
        ))}
      </div>

      {/* 檔案列表 */}
      <div className="grid grid-cols-4 gap-4">
        {filteredAssets.map(asset => {
          const { data } = supabase.storage.from('company-assets').getPublicUrl(asset.file_path)

          return (
            <div
              key={asset.id}
              className="border border-morandi-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* 預覽圖 */}
              <div className="aspect-square bg-morandi-container/10 relative group">
                <img
                  src={data.publicUrl}
                  alt={asset.name}
                  className="w-full h-full object-contain p-4"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => handlePreview(asset)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleDownload(asset)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-white/20"
                    onClick={() => handleDelete(asset)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 檔案資訊 */}
              <div className="p-3">
                <p className="text-sm font-medium text-morandi-primary truncate" title={asset.name}>
                  {asset.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs px-2 py-1 bg-morandi-container/20 text-morandi-secondary rounded">
                    {COMPANY_ASSET_CATEGORY_LABELS[asset.category]}
                  </span>
                  <span className="text-xs text-morandi-secondary">
                    {asset.file_size ? `${(asset.file_size / 1024).toFixed(1)} KB` : '-'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 text-morandi-secondary">
          尚無檔案，請點擊上方「上傳」按鈕新增
        </div>
      )}

      {/* 預覽對話框 */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewUrl(null)}
        >
          <img src={previewUrl} alt="預覽" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  )
}
