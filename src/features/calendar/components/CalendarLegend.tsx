export function CalendarLegend() {
  return (
    <div className="mt-6 flex flex-wrap gap-4 p-4 bg-morandi-container/10 rounded-lg">
      <div className="text-sm font-medium text-morandi-secondary">圖例：</div>

      {/* 旅遊團狀態圖例 */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9BB5D6' }} />
        <span className="text-sm text-morandi-secondary">提案</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#A8C4A2' }} />
        <span className="text-sm text-morandi-secondary">進行中</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#D4B896' }} />
        <span className="text-sm text-morandi-secondary">待結案</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#B8B3AE' }} />
        <span className="text-sm text-morandi-secondary">結案</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#D4A5A5' }} />
        <span className="text-sm text-morandi-secondary">特殊團</span>
      </div>

      {/* 個人事項圖例 */}
      <div className="flex items-center gap-2 ml-4">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#B8A9D1' }} />
        <span className="text-sm text-morandi-secondary">個人事項</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E6B8C8' }} />
        <span className="text-sm text-morandi-secondary">生日</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E0C3A0' }} />
        <span className="text-sm text-morandi-secondary">公司活動</span>
      </div>
    </div>
  )
}
