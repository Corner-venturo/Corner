'use client'

import { Upload, UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PassportUploadZone } from '@/components/shared/passport-upload-zone'
import { CustomerCombobox } from '@/components/customers/customer-combobox'
import { MemberExcelImport } from '../member-excel-import'
import type { Customer } from '@/types/customer.types'

interface QuickAddFormProps {
  orderId: string
  mode: 'upload' | 'search' | null
  onModeChange: (mode: 'upload' | 'search' | null) => void
  passportFiles: File[]
  onPassportFilesChange: (files: File[]) => void
  isUploading: boolean
  onUploadPassports: () => void
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
  availableCustomers: Customer[]
  onSelectCustomerSubmit: () => void
  onImportComplete?: () => void
}

export function QuickAddForm({
  orderId,
  mode,
  onModeChange,
  passportFiles,
  onPassportFilesChange,
  isUploading,
  onUploadPassports,
  selectedCustomer,
  onSelectCustomer,
  availableCustomers,
  onSelectCustomerSubmit,
  onImportComplete,
}: QuickAddFormProps) {
  return (
    <div className="space-y-4">
      {/* 選擇模式 */}
      {!mode && (
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => onModeChange('upload')}
          >
            <Upload size={24} />
            <span>上傳護照 (OCR)</span>
          </Button>
          <MemberExcelImport
            orderId={orderId}
            onImportComplete={onImportComplete}
          />
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => onModeChange('search')}
          >
            <UserPlus size={24} />
            <span>搜尋現有顧客</span>
          </Button>
        </div>
      )}

      {/* 上傳護照模式 */}
      {mode === 'upload' && (
        <Dialog open={true} onOpenChange={() => onModeChange(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>上傳護照（自動辨識）</DialogTitle>
            </DialogHeader>

            <PassportUploadZone files={passportFiles} onFilesChange={onPassportFilesChange} maxFiles={10} />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onModeChange(null)} disabled={isUploading}>
                取消
              </Button>
              <Button onClick={onUploadPassports} disabled={isUploading || passportFiles.length === 0}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    辨識中...
                  </>
                ) : (
                  `開始辨識 (${passportFiles.length} 張)`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 搜尋顧客模式 */}
      {mode === 'search' && (
        <Dialog open={true} onOpenChange={() => onModeChange(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>選擇現有顧客</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <CustomerCombobox
                customers={availableCustomers}
                value={selectedCustomer?.id}
                onSelect={onSelectCustomer}
              />

              {selectedCustomer && (
                <div className="p-4 bg-morandi-background border border-morandi-border rounded-lg">
                  <p className="text-sm font-medium mb-2">已選擇：</p>
                  <p className="text-sm text-morandi-secondary">
                    {selectedCustomer.name}
                    {selectedCustomer.national_id && ` | 身分證：${selectedCustomer.national_id}`}
                    {selectedCustomer.passport_number && ` | 護照：${selectedCustomer.passport_number}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onModeChange(null)}>
                取消
              </Button>
              <Button onClick={onSelectCustomerSubmit} disabled={!selectedCustomer}>
                確定新增
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
