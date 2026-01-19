/**
 * 日系風格 - 分車頁面範本
 *
 * 設計特點：
 * - 連續顯示多台車輛
 * - 序號 + 姓名簡潔排版
 * - 支援單欄/雙欄/三欄排版
 * - 可選顯示司機資訊
 */
import type { PageTemplate, TemplateData, VehicleData, VehicleColumnSettings } from './types'
import type { CanvasElement, ShapeElement, TextElement, IconElement, TextStyle } from '@/features/designer/components/types'

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
  border: 'rgba(142, 128, 112, 0.15)',
  headerBg: 'rgba(142, 128, 112, 0.08)',
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

// 預設車輛資料
function getDefaultVehicles(): VehicleData[] {
  return [
    {
      id: 'default-vehicle-1',
      vehicleName: '1號車',
      vehicleType: '43人座大巴',
      capacity: 43,
      members: [
        { id: '1', chineseName: '張小明', orderCode: 'ORD-001', seatNumber: 1 },
        { id: '2', chineseName: '李小華', orderCode: 'ORD-001', seatNumber: 2 },
        { id: '3', chineseName: '陳大文', orderCode: 'ORD-002', seatNumber: 3 },
        { id: '4', chineseName: '王美玲', orderCode: 'ORD-002', seatNumber: 4 },
        { id: '5', chineseName: '林志明', orderCode: 'ORD-003', seatNumber: 5 },
      ],
    },
    {
      id: 'default-vehicle-2',
      vehicleName: '2號車',
      vehicleType: '43人座大巴',
      capacity: 43,
      members: [
        { id: '6', chineseName: '黃大偉', orderCode: 'ORD-004', seatNumber: 1 },
        { id: '7', chineseName: '周小芳', orderCode: 'ORD-004', seatNumber: 2 },
        { id: '8', chineseName: '吳明輝', orderCode: 'ORD-005', seatNumber: 3 },
      ],
    },
  ]
}

export const japaneseStyleV1Vehicle: PageTemplate = {
  id: 'japanese-style-v1-vehicle',
  name: '日系風格 - 分車名單',
  description: '優雅的分車名單頁面，連續顯示多台車輛',
  thumbnailUrl: '/templates/japanese-style-v1-vehicle.png',
  category: 'vehicle',

  generateElements: (data: TemplateData): CanvasElement[] => {
    zIndexCounter = 0
    const elements: CanvasElement[] = []

    // 取得車輛資料
    const vehicles = data.vehicles?.length ? data.vehicles : getDefaultVehicles()

    // 判斷內容類型（可能混合）
    const vehicleCount = vehicles.filter(v => v.groupType !== 'table').length
    const tableCount = vehicles.filter(v => v.groupType === 'table').length
    const hasBoth = vehicleCount > 0 && tableCount > 0
    const isTableOnly = tableCount > 0 && vehicleCount === 0

    // 排版設定
    const columnSettings: VehicleColumnSettings = data.vehicleColumnSettings || {
      showDriverInfo: false,
      columnsPerRow: 2,
    }
    const columnsPerRow = columnSettings.columnsPerRow || 2

    // === 背景 ===
    const bgElement: ShapeElement = {
      ...createBaseElement('vehicle-bg', '頁面背景'),
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

    // === 頁面設定 ===
    const contentX = 40
    const contentWidth = A5_WIDTH - 80
    let currentY = 40

    // === 頁面標題（根據類型調整） ===
    const titleText = hasBoth ? '分組名單' : isTableOnly ? '分桌名單' : '分車名單'
    const subtitleText = hasBoth ? 'GROUP ASSIGNMENT' : isTableOnly ? 'TABLE ASSIGNMENT' : 'BUS ASSIGNMENT'

    const titleElement: TextElement = {
      ...createBaseElement('vehicle-title', '頁面標題'),
      type: 'text',
      x: contentX,
      y: currentY,
      width: contentWidth,
      height: 36,
      content: titleText,
      style: createTextStyle({
        fontFamily: 'Noto Serif TC',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 4,
        color: COLORS.ink,
      }),
    }
    elements.push(titleElement)

    // 英文副標題
    const subtitleElement: TextElement = {
      ...createBaseElement('vehicle-subtitle', '英文副標題'),
      type: 'text',
      x: contentX,
      y: currentY + 32,
      width: contentWidth,
      height: 16,
      content: subtitleText,
      style: createTextStyle({
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 2,
        color: COLORS.primary,
      }),
    }
    elements.push(subtitleElement)

    currentY += 60

    // === 根據排版模式渲染 ===
    const layoutMode = columnSettings.layoutMode || 'list'

    if (layoutMode === 'grid') {
      // ========== 表格式排版 ==========
      // 車輛為欄，成員為列
      // 分開渲染車輛和桌次

      const memberRowHeight = 18
      const headerHeight = 28
      const sectionSpacing = 20

      // 分離車輛和桌次
      const vehicleItems = vehicles.filter(v => v.groupType !== 'table')
      const tableItems = vehicles.filter(v => v.groupType === 'table')

      // 渲染一組項目的 Grid 表格
      const renderGridSection = (
        items: VehicleData[],
        prefix: string,
        sectionLabel?: string
      ) => {
        if (items.length === 0) return

        const gridColumnWidth = contentWidth / items.length
        const maxMemberCount = Math.max(...items.map(v => v.members?.length || 0))
        const maxRows = Math.floor((A5_HEIGHT - currentY - 80) / memberRowHeight)

        // 區段標題（如果有）
        if (sectionLabel) {
          const sectionTitle: TextElement = {
            ...createBaseElement(`${prefix}-section-title`, `${sectionLabel}標題`),
            type: 'text',
            x: contentX,
            y: currentY,
            width: contentWidth,
            height: 18,
            content: sectionLabel,
            style: createTextStyle({
              fontSize: 12,
              fontWeight: '500',
              color: COLORS.inkLight,
              letterSpacing: 1,
            }),
          }
          elements.push(sectionTitle)
          currentY += 22
        }

        // --- 表頭（名稱） ---
        const headerBg: ShapeElement = {
          ...createBaseElement(`${prefix}-header-bg`, `${prefix}表頭背景`),
          type: 'shape',
          x: contentX,
          y: currentY,
          width: contentWidth,
          height: headerHeight,
          variant: 'rectangle',
          fill: COLORS.headerBg,
          stroke: COLORS.border,
          strokeWidth: 1,
          cornerRadius: 4,
        }
        elements.push(headerBg)

        items.forEach((item, itemIdx) => {
          const colX = contentX + (itemIdx * gridColumnWidth)
          const headerText: TextElement = {
            ...createBaseElement(`${prefix}-header-${itemIdx}`, `${item.vehicleName}`),
            type: 'text',
            x: colX + 4,
            y: currentY + 6,
            width: gridColumnWidth - 8,
            height: 18,
            content: item.vehicleName,
            style: createTextStyle({
              fontSize: 11,
              fontWeight: 'bold',
              color: COLORS.ink,
              textAlign: 'center',
            }),
          }
          elements.push(headerText)
        })

        currentY += headerHeight + 4

        // --- 成員列表 ---
        const displayRows = Math.min(maxMemberCount, maxRows)
        for (let rowIdx = 0; rowIdx < displayRows; rowIdx++) {
          const rowY = currentY + (rowIdx * memberRowHeight)

          // 淡淡的分隔線（除了第一行之外）
          if (rowIdx > 0) {
            const separatorLine: ShapeElement = {
              ...createBaseElement(`${prefix}-separator-${rowIdx}`, `分隔線${rowIdx}`),
              type: 'shape',
              x: contentX + 8,
              y: rowY - 1,
              width: contentWidth - 16,
              height: 1,
              variant: 'rectangle',
              fill: 'rgba(142, 128, 112, 0.08)',
              stroke: 'transparent',
              strokeWidth: 0,
              cornerRadius: 0,
            }
            elements.push(separatorLine)
          }

          items.forEach((item, itemIdx) => {
            const member = item.members?.[rowIdx]
            if (!member) return

            const colX = contentX + (itemIdx * gridColumnWidth)

            const seqNumber = rowIdx + 1
            const memberName = member.chineseName || member.passportName || '-'

            // 序號（靠左）
            const seqElement: TextElement = {
              ...createBaseElement(`${prefix}-seq-${itemIdx}-${rowIdx}`, `${item.vehicleName}序號${seqNumber}`),
              type: 'text',
              x: colX + 4,
              y: rowY + 2,
              width: 20,
              height: 16,
              content: `${seqNumber}.`,
              style: createTextStyle({
                fontSize: 10,
                color: COLORS.inkLight,
                textAlign: 'left',
              }),
            }
            elements.push(seqElement)

            // 姓名（居中）
            const nameElement: TextElement = {
              ...createBaseElement(`${prefix}-name-${itemIdx}-${rowIdx}`, `${item.vehicleName}成員${seqNumber}`),
              type: 'text',
              x: colX + 20,
              y: rowY + 2,
              width: gridColumnWidth - 28,
              height: 16,
              content: memberName,
              style: createTextStyle({
                fontSize: 10,
                color: COLORS.ink,
                textAlign: 'center',
              }),
            }
            elements.push(nameElement)
          })
        }

        // 更新 currentY
        currentY += (displayRows * memberRowHeight) + sectionSpacing
      }

      // 渲染車輛區（如果有）
      if (vehicleItems.length > 0) {
        // 如果同時有桌次，顯示區段標題
        const showVehicleLabel = tableItems.length > 0
        renderGridSection(vehicleItems, 'vehicle', showVehicleLabel ? '車輛' : undefined)
      }

      // 渲染桌次區（如果有）
      if (tableItems.length > 0) {
        // 如果同時有車輛，顯示區段標題
        const showTableLabel = vehicleItems.length > 0
        renderGridSection(tableItems, 'table', showTableLabel ? '桌次' : undefined)
      }
    } else {
      // ========== 列表式排版（原有邏輯） ==========
      const columnWidth = contentWidth / columnsPerRow
      const memberHeight = 22
      const vehicleTitleHeight = 36
      const vehicleSpacing = 16
      const maxY = A5_HEIGHT - 50

      vehicles.forEach((vehicle, vehicleIdx) => {
        const members = vehicle.members || []
        const rowsNeeded = Math.max(1, Math.ceil(members.length / columnsPerRow))
        const vehicleBlockHeight = vehicleTitleHeight + (rowsNeeded * memberHeight) + vehicleSpacing

        if (currentY + vehicleBlockHeight > maxY) return

        // --- 車輛標題區塊 ---
        const vehicleHeaderBg: ShapeElement = {
          ...createBaseElement(`vehicle-${vehicleIdx}-header-bg`, `${vehicle.vehicleName}標題背景`),
          type: 'shape',
          x: contentX,
          y: currentY,
          width: contentWidth,
          height: 28,
          variant: 'rectangle',
          fill: COLORS.headerBg,
          stroke: COLORS.border,
          strokeWidth: 1,
          cornerRadius: 4,
        }
        elements.push(vehicleHeaderBg)

        const vehicleNameElement: TextElement = {
          ...createBaseElement(`vehicle-${vehicleIdx}-name`, `${vehicle.vehicleName}`),
          type: 'text',
          x: contentX + 12,
          y: currentY + 6,
          width: 100,
          height: 20,
          content: vehicle.vehicleName,
          style: createTextStyle({
            fontSize: 14,
            fontWeight: 'bold',
            color: COLORS.ink,
          }),
        }
        elements.push(vehicleNameElement)

        if (vehicle.vehicleType) {
          const vehicleTypeElement: TextElement = {
            ...createBaseElement(`vehicle-${vehicleIdx}-type`, `${vehicle.vehicleName}車型`),
            type: 'text',
            x: contentX + 110,
            y: currentY + 8,
            width: 120,
            height: 16,
            content: vehicle.vehicleType,
            style: createTextStyle({
              fontSize: 10,
              color: COLORS.inkLight,
            }),
          }
          elements.push(vehicleTypeElement)
        }

        const memberCountElement: TextElement = {
          ...createBaseElement(`vehicle-${vehicleIdx}-count`, `${vehicle.vehicleName}人數`),
          type: 'text',
          x: contentX + contentWidth - 80,
          y: currentY + 7,
          width: 68,
          height: 18,
          content: `${members.length} 人`,
          style: createTextStyle({
            fontSize: 11,
            color: COLORS.inkLight,
            textAlign: 'right',
          }),
        }
        elements.push(memberCountElement)

        if (columnSettings.showDriverInfo && vehicle.driverName) {
          const driverElement: TextElement = {
            ...createBaseElement(`vehicle-${vehicleIdx}-driver`, `${vehicle.vehicleName}司機`),
            type: 'text',
            x: contentX + 140,
            y: currentY + 7,
            width: 150,
            height: 18,
            content: `司機：${vehicle.driverName}${vehicle.driverPhone ? ` ${vehicle.driverPhone}` : ''}`,
            style: createTextStyle({
              fontSize: 10,
              color: COLORS.inkLight,
            }),
          }
          elements.push(driverElement)
        }

        currentY += 32

        members.forEach((member, memberIdx) => {
          const colIndex = memberIdx % columnsPerRow
          const rowIndex = Math.floor(memberIdx / columnsPerRow)
          const memberX = contentX + (colIndex * columnWidth)
          const memberY = currentY + (rowIndex * memberHeight)

          const seqNumber = memberIdx + 1
          const memberName = member.chineseName || member.passportName || '-'
          const content = `${seqNumber}. ${memberName}`

          const memberElement: TextElement = {
            ...createBaseElement(`vehicle-${vehicleIdx}-member-${memberIdx}`, `成員${seqNumber}`),
            type: 'text',
            x: memberX + 8,
            y: memberY + 3,
            width: columnWidth - 16,
            height: 18,
            content,
            style: createTextStyle({
              fontSize: 11,
              color: COLORS.ink,
            }),
          }
          elements.push(memberElement)
        })

        const rowsUsed = Math.ceil(members.length / columnsPerRow)
        currentY += (rowsUsed * memberHeight) + vehicleSpacing
      })
    }

    // === 底部總計 ===
    const totalMembers = vehicles.reduce((sum, v) => sum + (v.members?.length || 0), 0)
    const statsY = A5_HEIGHT - 40

    // 底部分隔線
    const bottomBorder: ShapeElement = {
      ...createBaseElement('bottom-border', '底部分隔線'),
      type: 'shape',
      x: contentX,
      y: statsY - 8,
      width: contentWidth,
      height: 1,
      variant: 'rectangle',
      fill: COLORS.border,
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    elements.push(bottomBorder)

    // 總人數統計（根據類型顯示）
    let statsText: string
    if (hasBoth) {
      statsText = `共 ${vehicleCount} 車 ${tableCount} 桌 ${totalMembers} 人`
    } else if (isTableOnly) {
      statsText = `共 ${vehicles.length} 桌 ${totalMembers} 人`
    } else {
      statsText = `共 ${vehicles.length} 車 ${totalMembers} 人`
    }

    const statsElement: TextElement = {
      ...createBaseElement('stats', '總人數統計'),
      type: 'text',
      x: contentX,
      y: statsY,
      width: contentWidth,
      height: 16,
      content: statsText,
      style: createTextStyle({
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.inkLight,
      }),
    }
    elements.push(statsElement)

    return elements
  },
}
