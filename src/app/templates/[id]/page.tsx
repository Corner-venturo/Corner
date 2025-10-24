'use client'

import { use, useState} from 'react'

import { useRouter } from 'next/navigation'

import { Save, Eye, Download} from 'lucide-react'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { TemplateExcelEditor } from '@/components/templates/template-excel-editor'
import { TemplatePDFPreview } from '@/components/templates/template-pdf-preview'
import { Button } from '@/components/ui/button'
import { useTemplateStore } from '@/stores/template-store'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TemplateEditorPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { getTemplate, updateTemplate } = useTemplateStore()
  const template = getTemplate(id)

  const [excelData, setExcelData] = useState(template?.excel_structure || null)
  const [isSaving, setIsSaving] = useState(false)
  const [columnWidths, setColumnWidths] = useState<number[]>([
    80, 100, 150, 120, 100, 100, 100, 100, 100, 100, 100, 100,
  ])

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-xl font-bold text-morandi-primary mb-2">找不到此模板</h2>
        <Button onClick={() => router.push('/templates')}>返回列表</Button>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateTemplate(id, {
        excel_structure: excelData || undefined,
      })
      alert('儲存成功！')
    } catch (error) {
      console.error('儲存失敗:', error)
      alert('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // TODO: 實作預覽功能
    alert('PDF 預覽功能即將推出')
  }

  const handleExport = () => {
    // TODO: 實作匯出功能
    alert('PDF 匯出功能即將推出')
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={template.name}
        showBackButton={true}
        onBack={() => router.push('/templates')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye size={16} className="mr-2" />
              預覽
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={16} className="mr-2" />
              匯出 PDF
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-morandi-gold hover:bg-morandi-gold-hover"
            >
              <Save size={16} className="mr-2" />
              {isSaving ? '儲存中...' : '儲存'}
            </Button>
          </div>
        }
      />

      {/* 主要編輯區：左右分割（固定 50/50） */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* 左側：Excel 編輯器 */}
        <div className="flex-1 overflow-hidden">
          <TemplateExcelEditor
            data={excelData}
            onChange={setExcelData}
            onColumnWidthChange={setColumnWidths}
            field_mappings={template.field_mappings}
          />
        </div>

        {/* 分隔線 */}
        <div className="w-px bg-morandi-muted/70" />

        {/* 右側：即時 PDF 預覽 */}
        <div className="flex-1 overflow-hidden">
          <TemplatePDFPreview
            data={excelData}
            columnWidths={columnWidths}
            fieldMappings={template.field_mappings}
          />
        </div>
      </div>
    </div>
  )
}
