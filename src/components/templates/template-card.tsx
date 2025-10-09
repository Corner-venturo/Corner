'use client';

import { useState } from 'react';

import { MoreVertical, FileText, FileSpreadsheet, FileBarChart, File } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTemplateStore } from '@/stores/template-store';

import { cn } from '@/lib/utils';

import { Template } from '@/types/template';

import { UseTemplateDialog } from './use-template-dialog';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
}

// 模板類型標籤
function TemplateTypeBadge({ type }: { type: Template['type'] }) {
  const configs = {
    quote: { label: '報價單', icon: FileText, color: 'text-morandi-gold bg-morandi-gold/10' },
    itinerary: { label: '行程表', icon: FileSpreadsheet, color: 'text-morandi-green bg-morandi-green/10' },
    invoice: { label: '發票', icon: FileText, color: 'text-morandi-blue bg-morandi-blue/10' },
    receipt: { label: '收據', icon: FileText, color: 'text-morandi-purple bg-morandi-purple/10' },
    other: { label: '其他', icon: File, color: 'text-morandi-secondary bg-morandi-secondary/10' },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium', config.color)}>
      <Icon size={14} />
      {config.label}
    </div>
  );
}

export function TemplateCard({ template, onEdit }: TemplateCardProps) {
  const { deleteTemplate, duplicateTemplate } = useTemplateStore();
  const [useDialogOpen, setUseDialogOpen] = useState(false);

  const handleDelete = () => {
    if (confirm(`確定要刪除模板「${template.name}」嗎？`)) {
      deleteTemplate(template.id, 'current-user-id'); // TODO: 使用實際的用戶 ID
    }
  };

  const handleDuplicate = async () => {
    const newName = prompt('請輸入新模板名稱', `${template.name} (副本)`);
    if (newName) {
      await duplicateTemplate(template.id, newName);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <>
      <div className="bg-card rounded-xl p-6 border border-morandi-container/20 hover:border-morandi-gold/40 transition-all group">
        {/* 模板類型標籤 */}
        <div className="flex items-start justify-between mb-4">
          <TemplateTypeBadge type={template.type} />

          {/* 更多選單 */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-morandi-container rounded-md">
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit(template)}>編輯模板</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>複製模板</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-morandi-red">
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 模板資訊 */}
        <h3 className="text-lg font-bold text-morandi-primary mb-2 line-clamp-1">{template.name}</h3>
        <p className="text-sm text-morandi-secondary mb-4 line-clamp-2 min-h-[40px]">
          {template.description || '無說明'}
        </p>

        {/* 關聯欄位摘要 */}
        <div className="bg-morandi-container/5 rounded-lg p-3 mb-4">
          <div className="text-xs text-morandi-muted mb-2">需要的資料：</div>
          <div className="flex flex-wrap gap-1">
            {template.field_mappings && template.field_mappings.length > 0 ? (
              <>
                {template.field_mappings.slice(0, 5).map((field) => (
                  <span
                    key={field.id}
                    className="text-xs px-2 py-1 bg-morandi-gold/10 text-morandi-gold rounded"
                  >
                    {field.display_name}
                  </span>
                ))}
                {template.field_mappings.length > 5 && (
                  <span className="text-xs text-morandi-muted px-2 py-1">
                    +{template.field_mappings.length - 5} 更多
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-morandi-muted">尚未設定欄位</span>
            )}
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="flex items-center justify-between text-xs text-morandi-muted mb-4">
          <span>已使用 {template.usage_count || 0} 次</span>
          <span>{formatDate(template.metadata.updated_at)}</span>
        </div>

        {/* 快速動作 */}
        <div className="flex gap-2 pt-4 border-t border-morandi-container/10">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(template)}>
            編輯
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            onClick={() => setUseDialogOpen(true)}
          >
            使用模板
          </Button>
        </div>
      </div>

      {/* 使用模板對話框 */}
      <UseTemplateDialog
        template={template}
        open={useDialogOpen}
        onOpenChange={setUseDialogOpen}
      />
    </>
  );
}
