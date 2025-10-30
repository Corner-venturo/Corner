export function DatasheetStyles() {
  return (
    <style jsx>{`
      /* Wrapper support for horizontal scrolling */
      .excel-datasheet-wrapper {
        width: 100%;
        overflow-x: auto;
      }

      :global(.excel-datasheet-wrapper .data-grid-container) {
        font-family: inherit;
        font-size: 14px;
      }

      :global(.excel-datasheet-wrapper .data-grid) {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        width: 100%;
      }

      :global(.excel-datasheet-wrapper .data-grid table) {
        width: 100%;
        border-collapse: collapse;
        table-layout: auto;
      }

      :global(.excel-datasheet-wrapper .data-grid ._cell) {
        border: 1px solid #e5e7eb;
        padding: 8px;
        min-height: 32px;
        background: white;
        text-align: left;
        vertical-align: middle;
        white-space: nowrap;
      }

      :global(.excel-datasheet-wrapper .data-grid td) {
        padding: 4px 8px;
        border: 1px solid #e5e7eb;
        min-width: 80px;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :global(.excel-datasheet-wrapper .data-grid th) {
        padding: 8px;
        border: 1px solid #e5e7eb;
        background: #f3f4f6;
        font-weight: 600;
        color: #374151;
        text-align: center;
        min-width: 80px;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.selected) {
        border: 2px solid #d97706;
        background: #fef3c7;
        outline: none;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.editing) {
        border: 2px solid #d97706;
        background: white;
        padding: 0;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.editing input) {
        width: 100%;
        height: 32px;
        padding: 4px 8px;
        border: none;
        outline: none;
        font-size: 14px !important;
        background: transparent;
        font-family: inherit;
        line-height: 1.4;
      }

      :global(.excel-datasheet-wrapper .datasheet-header) {
        background: #f3f4f6;
        font-weight: 600;
        color: #374151;
        text-align: center;
      }

      :global(.excel-datasheet-wrapper .datasheet-readonly) {
        background: #fafafa;
        color: #6b7280;
      }

      :global(.excel-datasheet-wrapper .datasheet-formula) {
        background: #ecfdf5;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell:hover) {
        background: #f9fafb;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.read-only:hover) {
        background: #f3f4f6;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.selected) {
        background: rgba(217, 119, 6, 0.1);
        border: 1px solid #d97706;
      }

      :global(.excel-datasheet-wrapper .data-grid:focus-within .cell.selected) {
        outline: 2px solid #d97706;
        outline-offset: -2px;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.copying) {
        border: 2px dashed #059669;
        background: rgba(5, 150, 105, 0.1);
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.selected::after) {
        content: '';
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 6px;
        height: 6px;
        background: #d97706;
        cursor: crosshair;
        border: 1px solid white;
      }

      /* Column resize handle styles */
      :global(.excel-datasheet-wrapper .resize-handle) {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: col-resize;
        background: transparent;
        z-index: 10;
      }

      :global(.excel-datasheet-wrapper .resize-handle:hover) {
        background: #d97706;
      }

      /* Row drag styles */
      :global(.excel-datasheet-wrapper .data-grid tr.draggable) {
        cursor: move;
      }

      :global(.excel-datasheet-wrapper .data-grid tr.draggable:hover) {
        background: rgba(217, 119, 6, 0.05);
      }

      :global(.excel-datasheet-wrapper .data-grid tr.dragging) {
        opacity: 0.5;
        background: rgba(217, 119, 6, 0.1);
        border-left: 3px solid #d97706;
      }

      /* Optimized table layout */
      :global(.excel-datasheet-wrapper .data-grid table) {
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0;
      }

      :global(.excel-datasheet-wrapper .data-grid td) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border-right: 1px solid #e5e7eb;
        border-bottom: 1px solid #e5e7eb;
      }

      :global(.excel-datasheet-wrapper .data-grid th) {
        position: relative;
        border-right: 1px solid #e5e7eb;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        user-select: none;
      }
    `}</style>
  )
}
