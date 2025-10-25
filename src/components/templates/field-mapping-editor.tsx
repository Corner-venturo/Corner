'use client';

import { useState } from 'react';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { getAvailableFields, getSourceLabel, validateField } from '@/lib/template-helpers';

import { TemplateField, DataSource } from '@/types/template';

interface FieldMappingEditorProps {
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
}

export function FieldMappingEditor({ fields, onChange }: FieldMappingEditorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addField = () => {
    const newField: TemplateField = {
      id: crypto.randomUUID(),
      field_key: '',
      display_name: '',
      field_type: 'text',
      is_required: false,
      data_source: 'manual',
    };

    onChange([...fields, newField]);
  };

  const updateField = (index: number, key: keyof TemplateField, value: unknown) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };

    // 如果切換資料來源，清空 source_field
    if (key === 'data_source') {
      newFields[index].source_field = undefined;
    }

    onChange(newFields);

    // 清除該欄位的錯誤
    const newErrors = { ...errors };
    delete newErrors[newFields[index].id];
    setErrors(newErrors);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const _validateAllFields = () => {
    const newErrors: Record<string, string> = {};
    let hasError = false;

    fields.forEach((field) => {
      const validation = validateField(field as unknown);
      if (!validation.valid) {
        newErrors[field.id] = validation.error!;
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-morandi-primary">欄位關聯設定</h3>
          <p className="text-sm text-morandi-secondary mt-1">
            定義模板中需要的資料欄位及其來源
          </p>
        </div>
        <Button size="sm" onClick={addField}>
          <Plus size={16} className="mr-2" />
          新增欄位
        </Button>
      </div>

      {/* 欄位列表 */}
      {fields.length === 0 ? (
        <div className="bg-morandi-container/5 rounded-lg p-8 text-center">
          <p className="text-sm text-morandi-secondary mb-4">
            尚未新增任何欄位
          </p>
          <Button size="sm" onClick={addField} variant="outline">
            <Plus size={16} className="mr-2" />
            新增第一個欄位
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-card rounded-lg p-4 border border-morandi-container/20"
            >
              <div className="grid grid-cols-12 gap-4 items-start">
                {/* 1. Excel 中的變數名稱 */}
                <div className="col-span-3">
                  <label className="text-xs text-morandi-secondary mb-1 block">
                    變數名稱（Excel中）
                    <span className="text-morandi-red ml-1">*</span>
                  </label>
                  <Input
                    value={field.field_key}
                    onChange={(e) => updateField(index, 'field_key', e.target.value)}
                    placeholder="例如：tour_name"
                    className="font-mono text-sm"
                  />
                </div>

                {/* 2. 顯示名稱 */}
                <div className="col-span-3">
                  <label className="text-xs text-morandi-secondary mb-1 block">
                    顯示名稱
                    <span className="text-morandi-red ml-1">*</span>
                  </label>
                  <Input
                    value={field.display_name}
                    onChange={(e) => updateField(index, 'display_name', e.target.value)}
                    placeholder="例如：旅遊團名稱"
                  />
                </div>

                {/* 3. 資料來源（關聯性）*/}
                <div className="col-span-2">
                  <label className="text-xs text-morandi-secondary mb-1 block">
                    資料來源
                    <span className="text-morandi-red ml-1">*</span>
                  </label>
                  <Select
                    value={field.data_source}
                    onValueChange={(v) => updateField(index, 'data_source', v as DataSource)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tour">旅遊團</SelectItem>
                      <SelectItem value="order">訂單</SelectItem>
                      <SelectItem value="customer">客戶</SelectItem>
                      <SelectItem value="employee">員工</SelectItem>
                      <SelectItem value="manual">手動輸入</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. 對應欄位 */}
                <div className="col-span-3">
                  <label className="text-xs text-morandi-secondary mb-1 block">
                    對應欄位
                    {field.data_source !== 'manual' && (
                      <span className="text-morandi-red ml-1">*</span>
                    )}
                  </label>
                  <Select
                    value={field.source_field || ''}
                    onValueChange={(v) => updateField(index, 'source_field', v)}
                    disabled={field.data_source === 'manual'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇欄位" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableFields(field.data_source).map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. 刪除按鈕 */}
                <div className="col-span-1 flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(index)}
                    className="text-morandi-red h-10 w-10 p-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {/* 錯誤訊息 */}
              {errors[field.id] && (
                <div className="mt-2 text-xs text-morandi-red">
                  {errors[field.id]}
                </div>
              )}

              {/* 預覽 */}
              <div className="mt-3 p-2 bg-morandi-container/5 rounded text-xs">
                <span className="text-morandi-muted">Excel 中：</span>
                <code className="ml-2 text-morandi-gold">
                  {field.field_key ? `{${field.field_key}}` : '{變數名稱}'}
                </code>
                <span className="mx-2 text-morandi-muted">→</span>
                <span className="text-morandi-secondary">
                  {field.data_source !== 'manual'
                    ? `自動從「${getSourceLabel(field.data_source)}」取得「${
                        field.source_field || '?'
                      }」`
                    : '使用時手動輸入'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
