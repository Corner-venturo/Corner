interface CalculatorDisplayProps {
  expression: string
  display: string
}

/**
 * 計算機顯示器元件
 */
export const CalculatorDisplay = ({ expression, display }: CalculatorDisplayProps) => {
  return (
    <div className="mb-3 p-2.5 bg-morandi-container/20 rounded-xl">
      {/* 完整算式顯示 */}
      <div className="text-xs font-mono text-morandi-secondary text-right mb-1 min-h-4 overflow-x-auto whitespace-nowrap">
        {expression && <span>{expression}</span>}
      </div>
      {/* 當前數字顯示 */}
      <div className="text-xl font-mono text-morandi-primary overflow-x-auto text-right whitespace-nowrap">
        {display}
      </div>
    </div>
  )
}
