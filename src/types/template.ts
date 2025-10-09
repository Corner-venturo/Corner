// 模板相關的類型定義（符合 TEMPLATE_DESIGNER_SPEC.md）

import type { BaseEntity } from './base.types';

export type TemplateType = 'itinerary' | 'quote' | 'invoice' | 'receipt' | 'other';

export type DataSource = 'tour' | 'order' | 'customer' | 'employee' | 'manual';

export type FieldType = 'text' | 'number' | 'date' | 'array' | 'boolean';

// 紙張設定
export interface PaperSettings {
  size: 'A4' | 'Letter' | 'Legal' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;    // cm
    bottom: number; // cm
    left: number;   // cm
    right: number;  // cm
  };
  show_grid: boolean;   // 顯示格線
  show_ruler: boolean;  // 顯示尺規
}

// 儲存格格式
export interface CellFormat {
  // 背景和邊框
  background_color: string;  // HEX 顏色
  border_style: 'none' | 'thin' | 'medium' | 'thick' | 'double';
  border_color: string;      // HEX 顏色

  // 文字格式
  text_align: 'left' | 'center' | 'right';
  vertical_align: 'top' | 'middle' | 'bottom';
  font_size: number;         // pt
  font_weight: 'normal' | 'bold';
  font_family?: string;      // 字體

  // 欄位類型（用於辨識和樣式）
  field_type: 'title' | 'label' | 'input' | 'data' | 'signature';
}

// 儲存格資料結構
export interface Cell {
  // 位置
  position: string;        // 'A1'

  // 內容
  value: string;          // 顯示內容（可包含綁定語法）

  // 格式
  format: CellFormat;     // 格式設定

  // 合併
  merged?: {
    range: string;        // 'A1:C1'
    master: boolean;      // 是否為主儲存格
  };

  // 資料綁定
  data_binding?: {
    field_path: string;    // 'tour.name'
    format?: string;      // 'currency', 'date'
    default_value?: string;
  };

  // 公式
  formula?: string;       // '=SUM(A1:A5)'
}

// 模板欄位定義
export interface TemplateField {
  id: string;
  field_key: string;           // Excel 中的變數名稱，例如：tour_name
  display_name: string;        // 顯示名稱，例如：旅遊團名稱
  field_type: FieldType;
  is_required: boolean;
  default_value?: string;

  // 資料來源（關聯性）
  data_source: DataSource;
  source_field?: string;       // 對應的欄位名稱

  description?: string;        // 欄位說明
}

// 動態區塊定義（符合規格書）
export interface DynamicBlock {
  id: string;              // 區塊唯一 ID
  name: string;            // 區塊名稱（例如：行程天數）
  type: 'static' | 'repeatable';  // 靜態 or 可重複

  // 區塊範圍（Excel 座標）
  range: {
    start_row: number;     // 起始列（例如：10）
    end_row: number;       // 結束列（例如：15）
    columns: string;       // 欄位範圍（例如：'A:F'）
  };

  // 重複設定（只在 repeatable 時有效）
  repeat_config?: {
    min: number;           // 最少幾個區塊
    max: number;           // 最多幾個區塊
    default_count: number; // 預設幾個區塊
    auto_number: boolean;  // 是否自動編號
    number_format: string; // 編號格式（例如：'Day [N]'）
  };

  // 分頁設定
  page_break: {
    enabled: boolean;      // 是否啟用分頁
    after_count: number;   // 每幾個區塊後分頁
  };
}

// 向下相容：RepeatableSection 作為 DynamicBlock 的別名
export type RepeatableSection = DynamicBlock;

// 模板主體（符合規格書）
export interface Template extends BaseEntity {
  // 基本資訊
  name: string;            // 模板名稱
  version: number;         // 版本號
  type: TemplateType;
  description?: string;
  tags?: string[];         // 標籤

  // 紙張設定
  paper_settings: PaperSettings;

  // 儲存格資料（使用 Record 以便序列化）
  cells: Record<string, Cell>;  // key: 'A1', 'B2' 等

  // 動態區塊
  dynamic_blocks: DynamicBlock[];

  // 欄位對應（向下相容）
  field_mappings?: TemplateField[];

  // Excel 資料結構（向下相容，逐步淘汰）
  excel_structure?: {
    headers?: string[];
    columns?: Array<{
      key: string;
      width?: number;
      type?: FieldType;
    }>;
    styles?: Array<{
      range?: string;
      format?: Partial<CellFormat>;
    }>;
  };

  // 統計
  usage_count: number;

  // 元資料（保留向下相容）
  metadata: {
    created_by: string;
  };

  // 刪除標記
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

// 模板資料值類型
export type TemplateDataValue = string | number | boolean | Date | null | TemplateDataValue[] | { [key: string]: TemplateDataValue };

// 生成的文件
export interface GeneratedDocument {
  id: string;
  template_id: string;
  template_name: string;       // 冗餘儲存，方便查詢

  // 使用的資料
  data_used: Record<string, TemplateDataValue>;

  // 檔案資訊
  file_path?: string;
  file_type: 'pdf' | 'html' | 'xlsx';
  file_size?: number;

  // 元資料
  created_by: string;
  created_at: string;
}

// 使用模板時的表單資料
export interface TemplateFormData {
  // 自動填充的資料（從 tour/order 等來源）
  auto_filled: Record<string, TemplateDataValue>;

  // 手動輸入的資料
  manual_input: Record<string, TemplateDataValue>;
}

// 可用的資料來源欄位
export interface SourceField {
  key: string;
  label: string;
  type: FieldType;
}

// 資料來源定義
export interface DataSourceDefinition {
  source: DataSource;
  label: string;
  fields: SourceField[];
}
