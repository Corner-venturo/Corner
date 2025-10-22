// 模板相關的輔助函數

import { DataSource, DataSourceDefinition, SourceField } from '@/types/template';

// 定義各個資料來源可用的欄位
export const DATA_SOURCE_DEFINITIONS: DataSourceDefinition[] = [
  {
    source: 'tour',
    label: '旅遊團',
    fields: [
      { key: 'code', label: '團號', type: 'text' },
      { key: 'name', label: '團名', type: 'text' },
      { key: 'location', label: '地點', type: 'text' },
      { key: 'departure_date', label: '出發日期', type: 'date' },
      { key: 'return_date', label: '返回日期', type: 'date' },
      { key: 'days', label: '天數', type: 'number' },
      { key: 'price', label: '價格', type: 'number' },
      { key: 'max_participants', label: '最大人數', type: 'number' },
      { key: 'description', label: '說明', type: 'text' },
    ],
  },
  {
    source: 'order',
    label: '訂單',
    fields: [
      { key: 'order_number', label: '訂單編號', type: 'text' },
      { key: 'contact_person', label: '聯絡人', type: 'text' },
      { key: 'phone', label: '電話', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'participants', label: '參加人數', type: 'number' },
      { key: 'total_amount', label: '總金額', type: 'number' },
      { key: 'paid_amount', label: '已付金額', type: 'number' },
      { key: 'status', label: '狀態', type: 'text' },
      { key: 'sales_person', label: '業務人員', type: 'text' },
      { key: 'notes', label: '備註', type: 'text' },
    ],
  },
  {
    source: 'customer',
    label: '客戶',
    fields: [
      { key: 'name', label: '姓名', type: 'text' },
      { key: 'phone', label: '電話', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: '地址', type: 'text' },
      { key: 'company', label: '公司', type: 'text' },
    ],
  },
  {
    source: 'employee',
    label: '員工',
    fields: [
      { key: 'name', label: '姓名', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: '電話', type: 'text' },
      { key: 'department', label: '部門', type: 'text' },
      { key: 'position', label: '職位', type: 'text' },
    ],
  },
];

// 根據資料來源取得可用欄位
export function getAvailableFields(source: DataSource): SourceField[] {
  if (source === 'manual') {
    return [];
  }

  const definition = DATA_SOURCE_DEFINITIONS.find((d) => d.source === source);
  return definition?.fields || [];
}

// 取得資料來源的顯示名稱
export function getSourceLabel(source: DataSource): string {
  if (source === 'manual') {
    return '手動輸入';
  }

  const definition = DATA_SOURCE_DEFINITIONS.find((d) => d.source === source);
  return definition?.label || source;
}

// 取得欄位的顯示名稱
export function getFieldLabel(source: DataSource, fieldKey: string): string {
  const fields = getAvailableFields(source);
  const field = fields.find((f) => f.key === fieldKey);
  return field?.label || fieldKey;
}

// 驗證欄位設定是否完整
export function validateField(field: {
  fieldKey: string;
  displayName: string;
  dataSource: DataSource;
  sourceField?: string;
}): { valid: boolean; error?: string } {
  if (!field.fieldKey || !field.fieldKey.trim()) {
    return { valid: false, error: '變數名稱不可為空' };
  }

  if (!field.displayName || !field.displayName.trim()) {
    return { valid: false, error: '顯示名稱不可為空' };
  }

  if (field.dataSource !== 'manual' && !field.sourceField) {
    return { valid: false, error: '請選擇對應欄位' };
  }

  // 檢查變數名稱格式（只允許字母、數字、底線）
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.fieldKey)) {
    return {
      valid: false,
      error: '變數名稱只能包含字母、數字、底線，且不能以數字開頭',
    };
  }

  return { valid: true };
}
