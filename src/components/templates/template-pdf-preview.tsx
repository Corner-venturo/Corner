'use client'

import { TemplateField, RepeatableSection } from '@/types/template'

interface TemplatePDFPreviewProps {
  data: unknown
  columnWidths?: number[]
  fieldMappings?: TemplateField[]
  _repeatableSections?: RepeatableSection[]
  highlightedSection?: RepeatableSection | null
}

export function TemplatePDFPreview({
  data,
  columnWidths = [80, 100, 150, 120, 100, 100, 100, 100, 100, 100, 100, 100],
  _repeatableSections = [],
}: TemplatePDFPreviewProps) {
  // 如果沒有資料，顯示空白 A4
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="mb-4">
          <div className="bg-card rounded-lg border border-morandi-container/20 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-morandi-primary">即時預覽</h2>
              <p className="text-xs text-morandi-secondary mt-1">
                A4 尺寸 (21cm × 29.7cm) · 3mm 出血
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-morandi-secondary">
            <div className="text-4xl mb-4">📄</div>
            <p>開始在左側編輯，這裡會即時預覽</p>
          </div>
        </div>
      </div>
    )
  }

  // 偵測區塊類型標記
  const detectBlockType = (row: unknown[]) => {
    const firstCell = String(row[0] || '').trim()

    if (firstCell.startsWith('#標題')) return 'title'
    if (firstCell.startsWith('#客戶資訊') || firstCell.startsWith('#客戶')) return 'customer-info'
    if (firstCell.startsWith('#表格') || firstCell.startsWith('#價格表')) return 'table'
    if (firstCell.startsWith('#備註') || firstCell.startsWith('#說明')) return 'notes'
    if (firstCell.startsWith('#總計') || firstCell.startsWith('#合計')) return 'total'
    if (firstCell.startsWith('#行程')) return 'itinerary'
    if (firstCell.startsWith('#Logo') || firstCell.startsWith('#logo')) return 'logo'

    return null
  }

  // 智能判斷儲存格類型
  const getCellStyle = (
    cell: any,
    rowIndex: number,
    colIndex: number,
    blockType: string | null
  ) => {
    const cellStr = String(cell || '')

    // 標籤判斷（冒號前的內容）
    const isLabel = cellStr.includes('：') || cellStr.includes(':')

    // 價格判斷
    const isPrice =
      cellStr.includes('$') || cellStr.includes('NT') || /^\d+,?\d*$/.test(cellStr.trim())

    // 動態變數
    const isDynamic = typeof cell === 'string' && cell.match(/\{.+?\}/)

    // 是否為表頭（表格區塊的第一列）
    const isTableHeader = blockType === 'table'

    return { isLabel, isPrice, isDynamic, isTableHeader }
  }

  // 將 Excel 資料轉換成美化的莫蘭迪風格預覽
  const renderContent = () => {
    let currentBlockType: string | null = null
    let isFirstRowOfBlock = false

    return (
      <div className="space-y-4">
        {data.map((row: unknown[], rowIndex: number) => {
          // 檢查這一列是否全部為空
          const isEmpty = row.every(cell => !cell || cell === '')
          if (isEmpty) return null

          // 檢測是否為新區塊標記
          const detectedBlockType = detectBlockType(row)
          if (detectedBlockType) {
            currentBlockType = detectedBlockType
            isFirstRowOfBlock = true
            return null // 不顯示標記列，只記錄區塊類型
          }

          // 區塊樣式配置
          const blockStyles = {
            title: {
              container:
                'bg-gradient-to-r from-morandi-primary to-morandi-primary/80 text-white py-6 px-8 rounded-lg shadow-md mb-6',
              text: 'text-center text-2xl font-bold tracking-wide',
            },
            'customer-info': {
              container: 'bg-morandi-container/20 rounded-lg p-6 border-l-4 border-morandi-gold',
              text: 'text-sm',
            },
            table: {
              container: isFirstRowOfBlock
                ? 'bg-morandi-primary/90 text-white font-semibold rounded-t-lg'
                : 'bg-white border-b border-morandi-container/20 hover:bg-morandi-container/10 transition-colors',
              text: 'text-sm',
            },
            notes: {
              container:
                'bg-morandi-container/10 rounded-lg p-4 border border-morandi-container/30',
              text: 'text-xs text-morandi-secondary leading-relaxed',
            },
            total: {
              container: 'bg-morandi-gold/20 rounded-lg p-4 border-2 border-morandi-gold',
              text: 'text-base font-bold text-morandi-gold',
            },
            logo: {
              container:
                'flex items-center justify-center py-8 border-2 border-dashed border-morandi-container/30 rounded-lg bg-morandi-container/5',
              text: 'text-morandi-muted',
            },
          }

          const currentStyle =
            currentBlockType && blockStyles[currentBlockType as keyof typeof blockStyles]

          const content = (
            <div key={rowIndex} className="relative">
              {/* 內容列 - 根據區塊類型美化 */}
              <div className={`flex items-center ${(currentStyle as unknown)?.container || ''}`}>
                {row.map((cell: any, colIndex: number) => {
                  // 跳過空白儲存格（不渲染）
                  if (!cell || cell === '') return null

                  const { isLabel, isPrice, isDynamic } = getCellStyle(
                    cell,
                    rowIndex,
                    colIndex,
                    currentBlockType
                  )
                  const width = columnWidths[colIndex] || 100

                  return (
                    <div
                      key={colIndex}
                      className={`px-3 py-2 transition-all ${(currentStyle as unknown)?.text || ''}
                        ${isLabel ? 'text-morandi-secondary font-medium' : ''}
                        ${isPrice ? 'text-morandi-gold font-semibold' : ''}
                        ${isDynamic ? 'bg-morandi-gold/10 text-morandi-gold font-medium rounded-md px-3 border border-morandi-gold/20' : ''}
                        ${currentBlockType === 'title' ? 'w-full' : ''}
                      `}
                      style={{
                        width: currentBlockType === 'title' ? '100%' : `${width}px`,
                        minWidth: currentBlockType === 'title' ? '100%' : `${width}px`,
                        maxWidth: currentBlockType === 'title' ? '100%' : `${width}px`,
                        lineHeight: '1.8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: currentBlockType === 'notes' ? 'normal' : 'nowrap',
                      }}
                    >
                      {cell}
                    </div>
                  )
                })}
              </div>
            </div>
          )

          isFirstRowOfBlock = false
          return content
        })}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 主標題卡片 */}
      <div className="mb-4">
        <div className="bg-card rounded-lg border border-morandi-container/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-morandi-primary">即時預覽</h2>
              <p className="text-xs text-morandi-secondary mt-1">
                A4 尺寸 (21cm × 29.7cm) · 3mm 出血
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 預覽內容區 */}
      <div className="flex-1 overflow-auto bg-gray-800 rounded-lg border border-morandi-container/20 p-8">
        <div className="flex items-start justify-center">
          {/* 出血區域（外框） */}
          <div
            className="relative bg-gray-100 shadow-2xl"
            style={{
              width: 'calc(21cm + 6mm)', // A4 + 左右各 3mm
              minHeight: 'calc(29.7cm + 6mm)', // A4 + 上下各 3mm
              padding: '3mm',
            }}
          >
            {/* 出血提示線 */}
            <div className="absolute inset-[3mm] border-2 border-dashed border-red-400 pointer-events-none z-10">
              <div className="absolute -top-5 left-0 text-xs text-red-500 font-medium">安全線</div>
            </div>
            <div className="absolute top-0 left-0 right-0 bottom-0 border-2 border-dashed border-blue-400 pointer-events-none z-10">
              <div className="absolute -top-5 right-0 text-xs text-blue-500 font-medium">
                出血線
              </div>
            </div>

            {/* A4 實際內容區 */}
            <div
              className="bg-white relative"
              style={{
                width: '21cm',
                minHeight: '29.7cm',
                padding: '0',
                fontSize: '12px',
                lineHeight: '1.5',
              }}
            >
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
