/**
 * CompanyAssetsDialog - 公司資源對話框
 */

'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CompanyAssetType } from '@/types/company-asset.types'
import { COMPANY_ASSETS_LABELS } from '../constants/labels'

type AssetFormData = {
  name: string
  asset_type: CompanyAssetType
  file: File | null
  restricted: boolean
}

interface CompanyAssetsDialogProps {
  isOpen: boolean
  onClose: () => void
  isEditMode: boolean
  formData: AssetFormData
  onFormFieldChange: <K extends keyof AssetFormData>(field: K, value: AssetFormData[K]) => void
  onSubmit: () => void
  isLoading?: boolean
}

export const CompanyAssetsDialog: React.FC<CompanyAssetsDialogProps> = ({
  isOpen,
  onClose,
  isEditMode,
  formData,
  onFormFieldChange,
  onSubmit,
  isLoading = false,
}) => {
  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title={isEditMode ? COMPANY_ASSETS_LABELS.編輯資源 : COMPANY_ASSETS_LABELS.新增資源}
      subtitle={COMPANY_ASSETS_LABELS.管理公司_Logo_合約章_發票章_文件等資源}
      onSubmit={onSubmit}
      submitLabel={isLoading ? COMPANY_ASSETS_LABELS.儲存中 : isEditMode ? COMPANY_ASSETS_LABELS.更新 : COMPANY_ASSETS_LABELS.新增}
      submitDisabled={!formData.name || (!isEditMode && !formData.file) || isLoading}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* 資料名稱 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            資料名稱 <span className="text-morandi-red">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={e => onFormFieldChange('name', e.target.value)}
            placeholder={COMPANY_ASSETS_LABELS.例如_公司合約章_發票專用章}
            className="mt-1"
          />
        </div>

        {/* 檔案類型 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            檔案類型 <span className="text-morandi-red">*</span>
          </label>
          <Select
            value={formData.asset_type}
            onValueChange={v => onFormFieldChange('asset_type', v as CompanyAssetType)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">圖片</SelectItem>
              <SelectItem value="document">文件</SelectItem>
              <SelectItem value="video">影片</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 上傳檔案 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            {isEditMode ? COMPANY_ASSETS_LABELS.更換檔案_選填 : COMPANY_ASSETS_LABELS.上傳檔案}{' '}
            {!isEditMode && <span className="text-morandi-red">*</span>}
          </label>
          <Input
            type="file"
            accept={
              formData.asset_type === 'image'
                ? 'image/*'
                : formData.asset_type === 'video'
                  ? 'video/*'
                  : '*'
            }
            onChange={e => {
              const file = e.target.files?.[0] || null
              onFormFieldChange('file', file)
            }}
            className="mt-1"
          />
          {formData.file && (
            <p className="text-xs text-morandi-secondary mt-1">已選擇：{formData.file.name}</p>
          )}
        </div>

        {/* 權限限制 */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="restricted"
            checked={formData.restricted}
            onCheckedChange={checked => onFormFieldChange('restricted', checked as boolean)}
          />
          <label
            htmlFor="restricted"
            className="text-sm font-medium text-morandi-primary cursor-pointer"
          >
            僅限會計/管理者可見
          </label>
        </div>
      </div>
    </FormDialog>
  )
}
