/**
 * 日系風格 - 分桌頁面範本
 *
 * 設計特點：
 * - 多欄並排顯示（2-3 桌/頁）
 * - 桌長特別標示
 * - 賓客名單含公司標註
 * - 交替背景色增加可讀性
 */
import type { PageTemplate, TemplateData, VehicleData } from './types'
import type { CanvasElement, ShapeElement, TextElement, TextStyle } from '@/features/designer/components/types'

// A5 尺寸（像素，96 DPI）
const A5_WIDTH = 559
const A5_HEIGHT = 794

// 顏色定義
const COLORS = {
  ink: '#3e3a36',
  inkLight: '#757068',
  primary: '#8e8070',
  accent: '#b8a896',
  paperWhite: '#fcfbf9',
  border: 'rgba(142, 128, 112, 0.2)',
  headerBg: 'rgba(142, 128, 112, 0.15)',
  hostBg: 'rgba(184, 168, 150, 0.25)',
  rowAltBg: 'rgba(142, 128, 112, 0.05)',
}

// zIndex 計數器
let zIndexCounter = 0

// 輔助函數：創建基礎元素屬性
function createBaseElement(id: string, name: string) {
  return {
    id,
    name,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: ++zIndexCounter,
  }
}

// 輔助函數：創建文字樣式
function createTextStyle(overrides: Partial<TextStyle> = {}): TextStyle {
  return {
    fontFamily: 'Noto Serif TC',
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 0,
    color: COLORS.ink,
    ...overrides,
  }
}

// 預設桌次資料
function getDefaultTable(): VehicleData {
  return {
    id: 'default-table',
    groupType: 'table',
    vehicleName: '1桌',
    vehicleType: '10人桌',
    capacity: 10,
    driverName: '鄒立仁', // 桌長
    members: [
      { id: '1', chineseName: '張國賀', orderCode: '' },
      { id: '2', chineseName: '李明育', orderCode: '鼎級' },
      { id: '3', chineseName: '陳立儒', orderCode: '' },
    ],
  }
}

export const japaneseStyleV1Table: PageTemplate = {
  id: 'japanese-style-v1-table',
  name: '日系風格 - 分桌名單',
  description: '優雅的分桌名單頁面，多欄並排顯示',
  thumbnailUrl: '/templates/japanese-style-v1-table.png',
  category: 'table',

  generateElements: (data: TemplateData): CanvasElement[] => {
    zIndexCounter = 0
    const elements: CanvasElement[] = []

    // 取得所有桌次資料
    const vehicles = data.vehicles || []
    const tables = vehicles.filter(v => v.groupType === 'table')

    // 如果沒有桌次，使用預設資料
    const displayTables = tables.length > 0 ? tables : [getDefaultTable(), getDefaultTable(), getDefaultTable()]

    // 計算每頁顯示幾桌（最多 3 桌）
    const pageIndex = data.currentVehiclePageIndex ?? 0
    const tablesPerPage = Math.min(3, displayTables.length)
    const startIdx = Math.floor(pageIndex / tablesPerPage) * tablesPerPage
    const pageTables = displayTables.slice(startIdx, startIdx + tablesPerPage)

    // === 背景 ===
    const bgElement: ShapeElement = {
      ...createBaseElement('table-bg', '頁面背景'),
      type: 'shape',
      x: 0,
      y: 0,
      width: A5_WIDTH,
      height: A5_HEIGHT,
      variant: 'rectangle',
      fill: COLORS.paperWhite,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(bgElement)

    // === 頁面標題 ===
    const contentX = 30
    const contentWidth = A5_WIDTH - 60
    let currentY = 35

    const titleElement: TextElement = {
      ...createBaseElement('table-title', '頁面標題'),
      type: 'text',
      x: contentX,
      y: currentY,
      width: contentWidth,
      height: 32,
      content: '分桌名單',
      style: createTextStyle({
        fontFamily: 'Noto Serif TC',
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: COLORS.ink,
      }),
    }
    elements.push(titleElement)

    // 英文副標題
    const subtitleElement: TextElement = {
      ...createBaseElement('table-subtitle', '英文副標題'),
      type: 'text',
      x: contentX,
      y: currentY + 28,
      width: contentWidth,
      height: 14,
      content: 'TABLE ASSIGNMENT',
      style: createTextStyle({
        fontSize: 9,
        fontWeight: '500',
        letterSpacing: 2,
        color: COLORS.primary,
      }),
    }
    elements.push(subtitleElement)

    currentY += 55

    // === 計算欄位寬度 ===
    const columnGap = 12
    const columnCount = pageTables.length
    const totalGap = columnGap * (columnCount - 1)
    const columnWidth = (contentWidth - totalGap) / columnCount

    // === 渲染每一桌 ===
    pageTables.forEach((table, tableIdx) => {
      const columnX = contentX + tableIdx * (columnWidth + columnGap)
      let tableY = currentY

      // 桌次標題背景
      const headerBg: ShapeElement = {
        ...createBaseElement(`table-${tableIdx}-header-bg`, `${table.vehicleName}標題背景`),
        type: 'shape',
        x: columnX,
        y: tableY,
        width: columnWidth,
        height: 32,
        variant: 'rectangle',
        fill: COLORS.headerBg,
        stroke: COLORS.border,
        strokeWidth: 1,
        cornerRadius: 4,
      }
      elements.push(headerBg)

      // 桌次名稱
      const tableNameElement: TextElement = {
        ...createBaseElement(`table-${tableIdx}-name`, `${table.vehicleName}名稱`),
        type: 'text',
        x: columnX + 8,
        y: tableY + 8,
        width: columnWidth - 16,
        height: 18,
        content: table.vehicleName || `${tableIdx + 1}桌`,
        style: createTextStyle({
          fontSize: 13,
          fontWeight: 'bold',
          textAlign: 'center',
          color: COLORS.ink,
        }),
      }
      elements.push(tableNameElement)

      tableY += 36

      // 桌長（如果有）
      if (table.driverName) {
        // 桌長背景
        const hostBg: ShapeElement = {
          ...createBaseElement(`table-${tableIdx}-host-bg`, `${table.vehicleName}桌長背景`),
          type: 'shape',
          x: columnX,
          y: tableY,
          width: columnWidth,
          height: 28,
          variant: 'rectangle',
          fill: COLORS.hostBg,
          stroke: COLORS.border,
          strokeWidth: 1,
          cornerRadius: 0,
        }
        elements.push(hostBg)

        // 桌長名稱
        const hostNameElement: TextElement = {
          ...createBaseElement(`table-${tableIdx}-host`, `${table.vehicleName}桌長`),
          type: 'text',
          x: columnX + 8,
          y: tableY + 6,
          width: columnWidth - 16,
          height: 16,
          content: table.driverName,
          style: createTextStyle({
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
            color: COLORS.ink,
          }),
        }
        elements.push(hostNameElement)

        tableY += 28
      }

      // 成員列表
      const members = table.members || []
      const rowHeight = 26

      members.forEach((member, memberIdx) => {
        // 交替背景
        const rowBg: ShapeElement = {
          ...createBaseElement(`table-${tableIdx}-member-${memberIdx}-bg`, `成員背景`),
          type: 'shape',
          x: columnX,
          y: tableY,
          width: columnWidth,
          height: rowHeight,
          variant: 'rectangle',
          fill: memberIdx % 2 === 0 ? 'transparent' : COLORS.rowAltBg,
          stroke: COLORS.border,
          strokeWidth: memberIdx === members.length - 1 ? 1 : 0,
          cornerRadius: memberIdx === members.length - 1 ? 4 : 0,
        }
        // 只有最後一行加底部邊框
        if (memberIdx === members.length - 1) {
          rowBg.cornerRadius = 0
        }
        elements.push(rowBg)

        // 左右邊框線
        const leftBorder: ShapeElement = {
          ...createBaseElement(`table-${tableIdx}-member-${memberIdx}-left`, `左邊框`),
          type: 'shape',
          x: columnX,
          y: tableY,
          width: 1,
          height: rowHeight,
          variant: 'rectangle',
          fill: COLORS.border,
          stroke: 'transparent',
          strokeWidth: 0,
          cornerRadius: 0,
        }
        elements.push(leftBorder)

        const rightBorder: ShapeElement = {
          ...createBaseElement(`table-${tableIdx}-member-${memberIdx}-right`, `右邊框`),
          type: 'shape',
          x: columnX + columnWidth - 1,
          y: tableY,
          width: 1,
          height: rowHeight,
          variant: 'rectangle',
          fill: COLORS.border,
          stroke: 'transparent',
          strokeWidth: 0,
          cornerRadius: 0,
        }
        elements.push(rightBorder)

        // 成員名稱（含公司）
        const displayName = member.orderCode
          ? `${member.chineseName || ''}(${member.orderCode})`
          : member.chineseName || ''

        const memberNameElement: TextElement = {
          ...createBaseElement(`table-${tableIdx}-member-${memberIdx}`, `成員-${member.chineseName}`),
          type: 'text',
          x: columnX + 6,
          y: tableY + 5,
          width: columnWidth - 12,
          height: 16,
          content: displayName,
          style: createTextStyle({
            fontSize: 11,
            textAlign: 'center',
            color: COLORS.ink,
          }),
        }
        elements.push(memberNameElement)

        tableY += rowHeight
      })

      // 底部邊框
      const bottomBorder: ShapeElement = {
        ...createBaseElement(`table-${tableIdx}-bottom`, `底部邊框`),
        type: 'shape',
        x: columnX,
        y: tableY,
        width: columnWidth,
        height: 1,
        variant: 'rectangle',
        fill: COLORS.border,
        stroke: 'transparent',
        strokeWidth: 0,
        cornerRadius: 0,
      }
      elements.push(bottomBorder)
    })

    // === 頁碼（如果有多頁） ===
    const totalPages = Math.ceil(displayTables.length / tablesPerPage)
    if (totalPages > 1) {
      const currentPage = Math.floor(pageIndex / tablesPerPage) + 1
      const pageNumElement: TextElement = {
        ...createBaseElement('page-num', '頁碼'),
        type: 'text',
        x: contentX,
        y: A5_HEIGHT - 40,
        width: contentWidth,
        height: 16,
        content: `${currentPage} / ${totalPages}`,
        style: createTextStyle({
          fontSize: 10,
          color: COLORS.primary,
          textAlign: 'center',
        }),
      }
      elements.push(pageNumElement)
    }

    return elements
  },
}
