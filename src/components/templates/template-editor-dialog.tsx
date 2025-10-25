'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTemplateStore } from '@/stores/template-store';

import { Template, TemplateType, TemplateField } from '@/types/template';

import { FieldMappingEditor } from './field-mapping-editor';

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null; // null = 新增模式
}

// 預設範本
const TEMPLATE_PRESETS = {
  blank: {
    name: '空白模板',
    fields: [],
    excel: Array.from({ length: 60 }, () => Array.from({ length: 12 }, () => ''))
  },
  confirmation: {
    name: '行程確認單',
    fields: [
      { id: '1', field_key: 'customer_name', display_name: '客戶名稱', field_type: 'text', data_source: 'manual', is_required: true },
      { id: '2', field_key: 'contact_person', display_name: '聯絡人', field_type: 'text', data_source: 'manual', is_required: true },
      { id: '3', field_key: 'phone', display_name: '聯絡電話', field_type: 'text', data_source: 'manual', is_required: true },
      { id: '4', field_key: 'departure_date', display_name: '出發日期', field_type: 'date', data_source: 'manual', is_required: true },
      { id: '5', field_key: 'destination', display_name: '目的地', field_type: 'text', data_source: 'manual', is_required: true },
    ],
    excel: [
      ['#標題'],
      ['', '', '旅遊行程確認單'],
      [''],
      ['#客戶資訊'],
      ['客戶名稱：', '{customer_name}', '', '聯絡人：', '{contact_person}'],
      ['聯絡電話：', '{phone}', '', '出發日期：', '{departure_date}'],
      ['目的地：', '{destination}'],
      [''],
      ['#表格'],
      ['天數', '日期', '行程內容', '餐食', '住宿'],
      ['第1天', '{day1_date}', '{day1_itinerary}', '{day1_meals}', '{day1_hotel}'],
      ['第2天', '{day2_date}', '{day2_itinerary}', '{day2_meals}', '{day2_hotel}'],
      ['第3天', '{day3_date}', '{day3_itinerary}', '{day3_meals}', '{day3_hotel}'],
      [''],
      ['#備註'],
      ['1. 本確認單僅供參考，實際行程以出團通知為準'],
      ['2. 如有任何問題，請隨時與我們聯繫'],
      [''],
      ...Array.from({ length: 40 }, () => Array.from({ length: 12 }, () => ''))
    ]
  }
};

export function TemplateEditorDialog({ open, onOpenChange, template }: TemplateEditorDialogProps) {
  const { addTemplate, updateTemplate } = useTemplateStore();
  const isEdit = !!template;

  const [selectedPreset, setSelectedPreset] = useState<'blank' | 'confirmation'>('blank');
  const [formData, setFormData] = useState({
    name: '',
    type: 'quote' as TemplateType,
    description: '',
  });

  const [fields, setFields] = useState<TemplateField[]>([]);
  const [excelData, setExcelData] = useState<unknown>(null);

  // 載入編輯的模板資料
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        type: template.type,
        description: template.description || '',
      });
      setFields(template.field_mappings || []);
      setExcelData(template.excel_structure);
    } else {
      // 重置表單
      setFormData({ name: '', type: 'quote', description: '' });
      setSelectedPreset('blank');
      setFields([]);
      setExcelData(null);
    }
  }, [template, open]);

  // 當選擇範本時，載入範本資料
  const handlePresetChange = (preset: 'blank' | 'confirmation') => {
    setSelectedPreset(preset);
    const presetData = TEMPLATE_PRESETS[preset];
    setFields(presetData.fields as TemplateField[]);
    setExcelData(presetData.excel);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('請輸入模板名稱');
      return;
    }

    try {
      if (isEdit) {
        // 更新模板
        await updateTemplate(template.id, {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          field_mappings: fields,
          excel_structure: excelData,
        });
      } else {
        // 新增模板
        await addTemplate({
          name: formData.name,
          type: formData.type,
          description: formData.description,
          paper_settings: {
            size: 'A4',
            orientation: 'portrait',
            margins: { top: 2.0, bottom: 2.0, left: 2.0, right: 2.0 },
            show_grid: true,
            show_ruler: true,
          },
          cells: {},
          dynamic_blocks: [],
          field_mappings: fields,
          excel_structure: excelData || { data: [['']], settings: {} },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('儲存模板失敗:', error);
      alert('儲存失敗，請稍後再試');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? '編輯模板' : '新增模板'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本資訊</TabsTrigger>
            <TabsTrigger value="fields">欄位設定</TabsTrigger>
            <TabsTrigger value="design">模板設計</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* 基本資訊 */}
            <TabsContent value="basic" className="space-y-4 mt-0">
              {/* 範本選擇（僅新增模式） */}
              {!isEdit && (
                <div>
                  <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                    選擇範本
                  </label>
                  <Select value={selectedPreset} onValueChange={handlePresetChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blank">📄 空白模板</SelectItem>
                      <SelectItem value="confirmation">✈️ 行程確認單</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-morandi-muted mt-1">
                    選擇範本後可以直接編輯，或從空白開始自行設計
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                  模板名稱 <span className="text-morandi-red">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：2025 清邁行程報價單"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                  模板類型 <span className="text-morandi-red">*</span>
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as TemplateType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quote">報價單</SelectItem>
                    <SelectItem value="itinerary">行程表</SelectItem>
                    <SelectItem value="invoice">發票</SelectItem>
                    <SelectItem value="receipt">收據</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                  說明
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="簡單描述這個模板的用途..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* 欄位設定 */}
            <TabsContent value="fields" className="mt-0">
              <FieldMappingEditor fields={fields} onChange={setFields} />
            </TabsContent>

            {/* 模板設計 */}
            <TabsContent value="design" className="mt-0">
              <div className="bg-morandi-container/5 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-morandi-primary mb-2">Excel 編輯器</h3>
                <p className="text-sm text-morandi-secondary mb-4">
                  即將整合 Handsontable 編輯器
                </p>
                <p className="text-xs text-morandi-muted">
                  目前可以先設定基本資訊和欄位，稍後再設計 Excel 樣式
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-morandi-container/20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} className="bg-morandi-gold hover:bg-morandi-gold-hover">
            {isEdit ? '儲存變更' : '建立模板'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
