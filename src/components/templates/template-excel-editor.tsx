'use client';

import { useRef, useEffect } from 'react';

import { HotTable } from '@handsontable/react';
import { registerLanguageDictionary, zhTW } from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';

import 'handsontable/dist/handsontable.full.css';
import { TemplateField, RepeatableSection } from '@/types/template';

// 註冊所有模組和中文語言包
registerAllModules();
registerLanguageDictionary(zhTW);

interface TemplateExcelEditorProps {
  data: any;
  onChange: (data: any) => void;
  onColumnWidthChange?: (widths: number[]) => void;
  fieldMappings?: TemplateField[];
  repeatableSections?: RepeatableSection[];
  highlightedSection?: RepeatableSection | null;
}

export function TemplateExcelEditor({
  data,
  onChange,
  onColumnWidthChange,
  field_mappings,
  repeatableSections = [],
  highlightedSection
}: TemplateExcelEditorProps) {
  const hotRef = useRef(null);

  // 初始化空白資料（60 列 × 20 欄，給予足夠的欄位讓使用者調整）
  const initialData = (data && Array.isArray(data) && data.length > 0)
    ? data
    : Array.from({ length: 60 }, () => Array.from({ length: 20 }, () => ''));

  // 檢查某一列是否在可重複區塊內
  const isRowInRepeatableSection = (row: number) => {
    return repeatableSections.find(
      section => row >= section.range.start_row && row <= section.range.end_row
    );
  };

  // 儲存格樣式自定義 + A4 邊框繪製
  useEffect(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    // 添加樣式，讓變數欄位有特殊顏色
    hot.addHook('afterRenderer', (TD, row, col, prop, value) => {
      // 變數高亮
      if (typeof value === 'string' && value.match(/\{.+?\}/)) {
        TD.style.background = '#fff3cd';
        TD.style.color = '#856404';
        TD.style.fontWeight = 'bold';
      }

      // 可重複區塊樣式
      const section = isRowInRepeatableSection(row);
      if (section) {
        // 如果是高亮的區塊，使用更明顯的顏色
        if (highlightedSection && section.id === highlightedSection.id) {
          TD.style.backgroundColor = '#fef3c7'; // 金色背景
          TD.style.borderLeft = col === 0 ? '3px solid #f59e0b' : TD.style.borderLeft;
          TD.style.borderRight = '1px solid #f59e0b';
          TD.style.borderTop = row === section.range.start_row ? '3px solid #f59e0b' : '1px solid #f59e0b';
          TD.style.borderBottom = row === section.range.end_row ? '3px solid #f59e0b' : '1px solid #f59e0b';
        } else {
          // 普通可重複區塊樣式
          TD.style.backgroundColor = '#fefce8'; // 淡黃色背景
          TD.style.borderLeft = col === 0 ? '2px solid #eab308' : TD.style.borderLeft;
          TD.style.borderTop = row === section.range.start_row ? '2px solid #eab308' : TD.style.borderTop;
          TD.style.borderBottom = row === section.range.end_row ? '2px solid #eab308' : TD.style.borderBottom;
        }
      }
    });

    // 繪製 A4 列印範圍背景（白色背景 + 紅色邊框）
    const drawA4Background = () => {
      const container = hot.rootElement;
      if (!container) return;

      // 移除舊的背景
      const oldBg = container.querySelector('.a4-print-area');
      if (oldBg) oldBg.remove();

      // 找到第一個儲存格 (A1) 的位置
      const firstCell = hot.getCell(0, 0);
      if (!firstCell) return;

      const rect = firstCell.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // 計算相對於容器的偏移
      const offsetTop = rect.top - containerRect.top;
      const offsetLeft = rect.left - containerRect.left;

      // 創建 A4 背景區域
      const bg = document.createElement('div');
      bg.className = 'a4-print-area';
      bg.style.position = 'absolute';
      bg.style.top = `${offsetTop}px`;
      bg.style.left = `${offsetLeft}px`;
      bg.style.width = '21cm';
      bg.style.height = '29.7cm';
      bg.style.backgroundColor = 'white';
      bg.style.border = '3px solid #ef4444';
      bg.style.pointerEvents = 'none';
      bg.style.zIndex = '-1'; // 放在表格後面
      bg.style.boxSizing = 'border-box';

      container.style.position = 'relative';
      container.appendChild(bg);
    };

    // 初始繪製和窗口大小改變時重新繪製
    drawA4Background();
    hot.addHook('afterRender', drawA4Background);
    window.addEventListener('resize', drawA4Background);

    return () => {
      window.removeEventListener('resize', drawA4Background);
    };
  }, [repeatableSections, highlightedSection]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 主標題卡片 */}
      <div className="mb-4">
        <div className="bg-card rounded-lg border border-morandi-container/20 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-morandi-primary">Excel 編輯器</h2>
            <p className="text-xs text-morandi-secondary mt-1">60 列 × 12 欄 · 可調整欄寬與列高</p>
          </div>
        </div>
      </div>

      {/* Handsontable 編輯器 - 全頁模式（灰色區域 = 工作區，紅框 = A4 列印範圍） */}
      <div className="flex-1 overflow-auto bg-gray-800 rounded-lg border border-morandi-container/20 p-8">
        <div className="flex items-start justify-center">
          <div className="inline-block">
            <HotTable
            ref={hotRef}
            data={initialData}
            colHeaders={true}
            rowHeaders={true}
            width="auto"
            height="29.7cm"
            minRows={60}
            minCols={20}
            licenseKey="non-commercial-and-evaluation"
            language="zh-TW"
            stretchH="none"

          // 功能設定
          contextMenu={true}           // 右鍵選單
          manualRowMove={true}         // 拖動調整列順序
          manualColumnMove={true}      // 拖動調整欄順序
          manualRowResize={true}       // 調整列高
          manualColumnResize={true}    // 調整欄寬

          // 編輯功能
          copyPaste={true}             // 複製貼上
          undo={true}                  // 復原/重做
          search={true}                // 搜尋

          // 合併儲存格
          mergeCells={true}

          // 儲存格樣式
          cell={[
            // 第一列作為標題列，加粗置中
            ...Array(12).fill(null).map((_, col) => ({
              row: 0,
              col,
              className: 'htCenter htMiddle',
              renderer: function(instance, td, row, col, prop, value, cellProperties) {
                td.style.fontWeight = 'bold';
                td.style.textAlign = 'center';
                td.style.backgroundColor = '#f8f9fa';
                td.innerHTML = value || '';
                return td;
              }
            }))
          ]}

          // 欄位設定（預設寬度）
          colWidths={[80, 100, 150, 120, 100, 100, 100, 100, 100, 100, 100, 100]}

          // 變更處理
          afterChange={(changes) => {
            if (changes) {
              const hot = hotRef.current?.hotInstance;
              if (hot) {
                const currentData = hot.getData();
                onChange(currentData);
              }
            }
          }}

          // 欄寬調整處理
          afterColumnResize={(newSize, column) => {
            const hot = hotRef.current?.hotInstance;
            if (hot && onColumnWidthChange) {
              // 獲取所有欄位的寬度
              const widths: number[] = [];
              for (let i = 0; i < 12; i++) {
                const width = hot.getColWidth(i);
                widths.push(width || 100);
              }
              onColumnWidthChange(widths);
              hot.render();
            }
          }}

          // 列高調整處理
          afterRowResize={(newSize, row) => {
            const hot = hotRef.current?.hotInstance;
            if (hot) {
              hot.render();
            }
          }}

          // 格式化設定
          className="template-excel-editor"
            />
          </div>
        </div>
      </div>

      {/* 自定義樣式 */}
      <style jsx global>{`
        .template-excel-editor .handsontable td {
          border-color: #e0e0e0;
        }

        .template-excel-editor .handsontable th {
          background-color: #f8f9fa;
          color: #495057;
          font-weight: 500;
        }

        .template-excel-editor .htCore {
          font-family: 'Arial', 'Microsoft JhengHei', sans-serif;
        }
      `}</style>
    </div>
  );
}
