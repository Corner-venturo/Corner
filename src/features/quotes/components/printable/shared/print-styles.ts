/**
 * Shared print styles for printable components
 */

export const PRINT_STYLES = `
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    @page {
      size: A4;
      margin: 1cm;
    }

    /* 防止表格行被切斷 */
    table tr {
      page-break-inside: avoid;
    }

    /* 使用 table 的 thead/tfoot 來實作固定頁首頁尾 */
    table.print-wrapper {
      width: 100%;
      border-collapse: collapse;
    }

    table.print-wrapper thead {
      display: table-header-group;
    }

    table.print-wrapper tfoot {
      display: table-footer-group;
    }

    table.print-wrapper tbody {
      display: table-row-group;
    }

    /* A4 頁面設定 */
    @page {
      size: A4;
      margin: 8mm;
    }

    /* 防止表格內容被切斷 */
    .avoid-break {
      page-break-inside: avoid;
    }

    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
`

export const MORANDI_COLORS = {
  gold: '#D4AF37',
  brown: '#6B5B4F',
  lightBrown: '#FAF7F2',
  gray: '#4B5563',
  lightGray: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
}

export const TABLE_STYLES = {
  borderCollapse: 'separate' as const,
  borderSpacing: 0,
  borderRadius: '8px',
  overflow: 'hidden',
  border: `1px solid ${MORANDI_COLORS.border}`,
}
