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
        border: 1px solid var(--border);
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
        border: 1px solid var(--border);
        padding: 8px;
        min-height: 32px;
        background: var(--card);
        text-align: left;
        vertical-align: middle;
        white-space: nowrap;
      }

      :global(.excel-datasheet-wrapper .data-grid td) {
        padding: 4px 8px;
        border: 1px solid var(--border);
        min-width: 80px;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :global(.excel-datasheet-wrapper .data-grid th) {
        padding: 8px;
        border: 1px solid var(--border);
        background: var(--accent);
        font-weight: 600;
        color: var(--foreground);
        text-align: center;
        min-width: 80px;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.selected) {
        border: 2px solid var(--morandi-gold);
        background: var(--accent);
        outline: none;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.editing) {
        border: 2px solid var(--morandi-gold);
        background: var(--card);
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
        color: var(--foreground);
      }

      :global(.excel-datasheet-wrapper .datasheet-header) {
        background: var(--accent);
        font-weight: 600;
        color: var(--foreground);
        text-align: center;
      }

      :global(.excel-datasheet-wrapper .datasheet-readonly) {
        background: var(--morandi-container);
        color: var(--muted-foreground);
      }

      :global(.excel-datasheet-wrapper .datasheet-formula) {
        background: rgba(var(--morandi-green-rgb), 0.1); /* Assuming morandi-green-rgb is defined */
      }

      :global(.excel-datasheet-wrapper .data-grid .cell:hover) {
        background: var(--accent);
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.read-only:hover) {
        background: var(--morandi-container);
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.selected) {
        background: rgba(var(--morandi-gold-rgb), 0.1); /* Assuming morandi-gold-rgb is defined */
        border: 1px solid var(--morandi-gold);
      }

      :global(.excel-datasheet-wrapper .data-grid:focus-within .cell.selected) {
        outline: 2px solid var(--morandi-gold);
        outline-offset: -2px;
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.copying) {
        border: 2px dashed var(--morandi-green);
        background: rgba(var(--morandi-green-rgb), 0.1);
      }

      :global(.excel-datasheet-wrapper .data-grid .cell.selected::after) {
        content: '';
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 6px;
        height: 6px;
        background: var(--morandi-gold);
        cursor: crosshair;
        border: 1px solid var(--card);
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
        background: var(--morandi-gold);
      }

      /* Row drag styles */
      :global(.excel-datasheet-wrapper .data-grid tr.draggable) {
        cursor: move;
      }

      :global(.excel-datasheet-wrapper .data-grid tr.draggable:hover) {
        background: rgba(var(--morandi-gold-rgb), 0.05);
      }

      :global(.excel-datasheet-wrapper .data-grid tr.dragging) {
        opacity: 0.5;
        background: rgba(var(--morandi-gold-rgb), 0.1);
        border-left: 3px solid var(--morandi-gold);
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
        border-right: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
      }

      :global(.excel-datasheet-wrapper .data-grid th) {
        position: relative;
        border-right: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        background: var(--accent);
        user-select: none;
      }
    `}</style>
  )
}
