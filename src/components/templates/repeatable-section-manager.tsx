'use client';

import { useState } from 'react';

import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { RepeatableSection } from '@/types/template';

interface RepeatableSectionManagerProps {
  sections: RepeatableSection[];
  onAdd: () => void;
  onEdit: (section: RepeatableSection) => void;
  onDelete: (sectionId: string) => void;
  onHighlight: (section: RepeatableSection | null) => void;
}

export function RepeatableSectionManager({
  sections,
  onAdd,
  onEdit,
  onDelete,
  onHighlight
}: RepeatableSectionManagerProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  return (
    <div className="border-t border-morandi-container/20 bg-card">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-morandi-muted" />
            <h3 className="text-sm font-bold text-morandi-primary">可重複區塊</h3>
            <span className="text-xs text-morandi-secondary">
              ({sections.length} 個區塊)
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onAdd}
            className="text-xs"
          >
            <Plus size={14} className="mr-1" />
            新增區塊
          </Button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-6 bg-morandi-container/5 rounded-lg border border-dashed border-morandi-container/30">
            <p className="text-sm text-morandi-secondary mb-2">尚未設定可重複區塊</p>
            <p className="text-xs text-morandi-muted">
              可重複區塊適合用於住宿資訊、行程天數等需要動態新增的內容
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`
                  group relative flex items-center gap-2 px-3 py-2
                  bg-white border rounded-lg transition-all
                  ${hoveredSection === section.id
                    ? 'border-morandi-gold shadow-md'
                    : 'border-morandi-container/30 hover:border-morandi-container/50'
                  }
                `}
                onMouseEnter={() => {
                  setHoveredSection(section.id);
                  onHighlight(section);
                }}
                onMouseLeave={() => {
                  setHoveredSection(null);
                  onHighlight(null);
                }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-morandi-primary">
                    {section.name}
                  </div>
                  <div className="text-xs text-morandi-secondary">
                    列 {section.range.start_row + 1} - {section.range.end_row + 1}
                    {section.repeat_config?.max && (
                      <span className="ml-2">
                        (最多 {section.repeat_config.max} 個)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(section)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(section.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
