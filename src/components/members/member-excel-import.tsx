'use client'

import { useState, useCallback } from 'react'
import { FileSpreadsheet, Upload, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMemberStore, useCustomerStore } from '@/stores'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { logger } from '@/lib/utils/logger'

interface MemberExcelImportProps {
  orderId: string
  onImportComplete?: () => void
}

// 系統欄位定義
const SYSTEM_FIELDS = [
  { key: 'name', label: '姓名', required: true },
  { key: 'name_en', label: '英文姓名', required: false },
  { key: 'id_number', label: '身分證字號', required: false },
  { key: 'passport_number', label: '護照號碼', required: false },
  { key: 'passport_expiry', label: '護照效期', required: false },
  { key: 'birthday', label: '生日', required: false },
  { key: 'gender', label: '性別', required: false },
] as const

type SystemFieldKey = typeof SYSTEM_FIELDS[number]['key']

interface ColumnMapping {
  excelColumn: string
  systemField: SystemFieldKey | ''
}

interface ParsedRow {
  [key: string]: string | number | undefined
}

export function MemberExcelImport({ orderId, onImportComplete }: MemberExcelImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload')

  // Excel 資料
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [excelData, setExcelData] = useState<ParsedRow[]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])

  // Stores
  const memberStore = useMemberStore()
  const { items: customers, create: createCustomer } = useCustomerStore()

  // 處理檔案上傳
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // 轉成 JSON，包含表頭
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { header: 1 })

        if (jsonData.length < 2) {
          toast.error('Excel 檔案至少需要表頭和一筆資料')
          return
        }

        // 第一行是表頭
        const headers = (jsonData[0] as unknown as string[]).map(h => String(h || '').trim())
        const rows = jsonData.slice(1).map(row => {
          const obj: ParsedRow = {}
          headers.forEach((header, index) => {
            obj[header] = (row as unknown as (string | number)[])[index]
          })
          return obj
        }).filter(row => Object.values(row).some(v => v !== undefined && v !== ''))

        setExcelHeaders(headers.filter(h => h !== ''))
        setExcelData(rows)

        // 初始化欄位對應（嘗試自動對應）
        const initialMappings: ColumnMapping[] = headers
          .filter(h => h !== '')
          .map(header => {
            // 嘗試自動對應
            const lowerHeader = header.toLowerCase()
            let autoMatch: SystemFieldKey | '' = ''

            if (lowerHeader.includes('姓名') && !lowerHeader.includes('英文')) {
              autoMatch = 'name'
            } else if (lowerHeader.includes('英文') || lowerHeader.includes('english')) {
              autoMatch = 'name_en'
            } else if (lowerHeader.includes('身分證') || lowerHeader.includes('身份證')) {
              autoMatch = 'id_number'
            } else if (lowerHeader.includes('護照') && lowerHeader.includes('號')) {
              autoMatch = 'passport_number'
            } else if (lowerHeader.includes('護照') && (lowerHeader.includes('效期') || lowerHeader.includes('到期'))) {
              autoMatch = 'passport_expiry'
            } else if (lowerHeader.includes('生日') || lowerHeader.includes('出生')) {
              autoMatch = 'birthday'
            } else if (lowerHeader.includes('性別')) {
              autoMatch = 'gender'
            }

            return { excelColumn: header, systemField: autoMatch }
          })

        setColumnMappings(initialMappings)
        setStep('mapping')
        toast.success(`讀取到 ${rows.length} 筆資料`)
      } catch (error) {
        logger.error('讀取 Excel 失敗:', error)
        toast.error('讀取 Excel 失敗，請確認檔案格式')
      }
    }
    reader.readAsBinaryString(file)

    // 清除 input 值，允許重新選擇同一個檔案
    e.target.value = ''
  }, [])

  // 更新欄位對應
  const updateMapping = (excelColumn: string, systemField: SystemFieldKey | '') => {
    setColumnMappings(prev =>
      prev.map(m =>
        m.excelColumn === excelColumn ? { ...m, systemField } : m
      )
    )
  }

  // 檢查必填欄位是否已對應
  const requiredFieldsMapped = SYSTEM_FIELDS
    .filter(f => f.required)
    .every(f => columnMappings.some(m => m.systemField === f.key))

  // 執行匯入
  const handleImport = async () => {
    if (!requiredFieldsMapped) {
      toast.error('請至少對應「姓名」欄位')
      return
    }

    const existingMembers = memberStore.items.filter(m => m.order_id === orderId)
    let importedCount = 0
    let skippedCount = 0

    for (const row of excelData) {
      // 根據對應取得資料
      const memberData: Record<string, string> = {}

      for (const mapping of columnMappings) {
        if (mapping.systemField && row[mapping.excelColumn] !== undefined) {
          let value = String(row[mapping.excelColumn] || '').trim()

          // 性別轉換
          if (mapping.systemField === 'gender') {
            if (value === '男' || value.toLowerCase() === 'm' || value.toLowerCase() === 'male') {
              value = 'M'
            } else if (value === '女' || value.toLowerCase() === 'f' || value.toLowerCase() === 'female') {
              value = 'F'
            }
          }

          // 日期格式處理（Excel 數字日期轉換）
          if ((mapping.systemField === 'birthday' || mapping.systemField === 'passport_expiry') && !isNaN(Number(value))) {
            const excelDate = Number(value)
            if (excelDate > 0) {
              // Excel 日期序列數字轉換
              const date = new Date((excelDate - 25569) * 86400 * 1000)
              value = date.toISOString().split('T')[0]
            }
          }

          memberData[mapping.systemField] = value
        }
      }

      // 跳過沒有姓名的行
      if (!memberData.name) continue

      // 檢查是否已存在（用護照號碼或身分證比對）
      const isDuplicate = existingMembers.some(m =>
        (memberData.passport_number && m.passport_number === memberData.passport_number) ||
        (memberData.id_number && m.id_number === memberData.id_number)
      )

      if (isDuplicate) {
        skippedCount++
        continue
      }

      // 檢查顧客資料庫
      let customerId: string | undefined
      const existingCustomer = customers.find(c =>
        (memberData.passport_number && c.passport_number === memberData.passport_number) ||
        (memberData.id_number && c.national_id === memberData.id_number)
      )

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else if (memberData.name) {
        // 新增到顧客資料庫
        const newCustomer = await createCustomer({
          name: memberData.name,
          passport_number: memberData.passport_number || '',
          passport_romanization: memberData.name_en || '',
          passport_expiry_date: memberData.passport_expiry || '',
          national_id: memberData.id_number || '',
          date_of_birth: memberData.birthday || '',
          gender: memberData.gender || '',
          email: '',
          phone: '',
        } as unknown as Parameters<typeof createCustomer>[0])
        customerId = newCustomer?.id
      }

      // 新增成員
      await memberStore.create({
        order_id: orderId,
        name: memberData.name,
        name_en: memberData.name_en || '',
        passport_number: memberData.passport_number || '',
        passport_expiry: memberData.passport_expiry || '',
        id_number: memberData.id_number || '',
        birthday: memberData.birthday || '',
        gender: memberData.gender || '',
        customer_id: customerId,
        reservation_code: '',
        add_ons: [],
        refunds: [],
      } as unknown as Parameters<typeof memberStore.create>[0])

      importedCount++
    }

    const messages: string[] = []
    if (importedCount > 0) messages.push(`成功匯入 ${importedCount} 位`)
    if (skippedCount > 0) messages.push(`跳過 ${skippedCount} 位重複`)

    toast.success(messages.join('，') || '匯入完成')

    setIsOpen(false)
    setStep('upload')
    setExcelHeaders([])
    setExcelData([])
    setColumnMappings([])
    onImportComplete?.()
  }

  // 關閉並重置
  const handleClose = () => {
    setIsOpen(false)
    setStep('upload')
    setExcelHeaders([])
    setExcelData([])
    setColumnMappings([])
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center space-y-2"
        onClick={() => setIsOpen(true)}
      >
        <FileSpreadsheet size={24} />
        <span>匯入 Excel</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 'upload' && '上傳 Excel 檔案'}
              {step === 'mapping' && '欄位對應'}
              {step === 'preview' && '預覽資料'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: 上傳檔案 */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-morandi-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload size={40} className="text-morandi-secondary" />
                  <p className="text-morandi-primary font-medium">點擊選擇檔案</p>
                  <p className="text-sm text-morandi-secondary">支援 .xlsx, .xls, .csv</p>
                </label>
              </div>

              <div className="bg-morandi-background p-4 rounded-lg">
                <p className="text-sm font-medium text-morandi-primary mb-2">Excel 欄位說明：</p>
                <ul className="text-sm text-morandi-secondary space-y-1">
                  <li>• 姓名（必填）</li>
                  <li>• 英文姓名</li>
                  <li>• 身分證字號</li>
                  <li>• 護照號碼</li>
                  <li>• 護照效期（格式：YYYY-MM-DD）</li>
                  <li>• 生日（格式：YYYY-MM-DD）</li>
                  <li>• 性別（男/女 或 M/F）</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: 欄位對應 */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-sm text-morandi-secondary">
                請將 Excel 欄位對應到系統欄位，系統已嘗試自動對應，請確認是否正確。
              </p>

              <div className="space-y-3">
                {columnMappings.map((mapping) => (
                  <div key={mapping.excelColumn} className="flex items-center gap-4">
                    <div className="w-1/3 text-sm font-medium text-morandi-primary truncate">
                      {mapping.excelColumn}
                    </div>
                    <div className="text-morandi-secondary">→</div>
                    <Select
                      value={mapping.systemField || '__none__'}
                      onValueChange={(value) => updateMapping(mapping.excelColumn, (value === '__none__' ? '' : value) as SystemFieldKey | '')}
                    >
                      <SelectTrigger className="w-1/2">
                        <SelectValue placeholder="選擇對應欄位" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">不匯入</SelectItem>
                        {SYSTEM_FIELDS.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label} {field.required && '*'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mapping.systemField && (
                      <Check size={16} className="text-status-success" />
                    )}
                  </div>
                ))}
              </div>

              {!requiredFieldsMapped && (
                <div className="flex items-center gap-2 text-status-warning bg-status-warning-bg p-3 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm">請至少對應「姓名」欄位</span>
                </div>
              )}

              <div className="bg-morandi-background p-4 rounded-lg">
                <p className="text-sm text-morandi-secondary">
                  預覽：共 {excelData.length} 筆資料待匯入
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  上一步
                </Button>
                <Button onClick={handleImport} disabled={!requiredFieldsMapped}>
                  開始匯入
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
