'use client'

import { useState} from 'react'

import { useRouter } from 'next/navigation'

import { Plus } from 'lucide-react'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { TemplateCard } from '@/components/templates/template-card'
import { TemplateEditorDialog } from '@/components/templates/template-editor-dialog'
import { Button } from '@/components/ui/button'
import { useTemplateStore } from '@/stores/template-store'

// import { Template } from '@/types/template'

export default function TemplatesPage() {
  const router = useRouter()
  const { templates, _addTemplate } = useTemplateStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // 只顯示未刪除的模板
  const activeTemplates = templates.filter(t => !t.is_deleted)

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="模板管理"
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus size={16} className="mr-2" />
            新增模板
          </Button>
        }
      />

      {/* 模板列表 */}
      {activeTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-bold text-morandi-primary mb-2">尚未建立任何模板</h3>
            <p className="text-sm text-morandi-secondary mb-6">
              建立模板以快速產生報價單、行程表等文件
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              建立第一個模板
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={template => {
                // 導航到完整的編輯頁面
                router.push(`/templates/${template.id}`)
              }}
            />
          ))}
        </div>
      )}

      {/* 新增模板對話框 */}
      <TemplateEditorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        template={null}
      />
    </div>
  )
}
