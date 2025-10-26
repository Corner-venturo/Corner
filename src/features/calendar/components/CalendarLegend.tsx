const legendGroups = [
  {
    title: '旅遊團狀態',
    items: [
      { label: '提案', color: '#9BB5D6', description: '洽談中的行程規劃' },
      { label: '進行中', color: '#A8C4A2', description: '目前正在執行的團體' },
      { label: '待結案', color: '#D4B896', description: '待收尾或後續追蹤的團體' },
      { label: '已結案', color: '#B8B3AE', description: '已完成的旅遊團' },
      { label: '特殊團', color: '#D4A5A5', description: '特殊需求或客製行程' },
    ],
  },
  {
    title: '個人與公司事項',
    items: [
      { label: '個人事項', color: '#B8A9D1', description: '個人待辦或提醒' },
      { label: '生日', color: '#E6B8C8', description: '團隊成員生日提醒' },
      { label: '公司活動', color: '#E0C3A0', description: '內部會議或活動' },
    ],
  },
];

export function CalendarLegend() {
  return (
    <div className="space-y-6">
      {legendGroups.map((group) => (
        <div key={group.title}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-morandi-secondary/80">
            {group.title}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 rounded-2xl border border-morandi-container/40 bg-white/80 px-3 py-3 shadow-sm backdrop-blur"
              >
                <span
                  className="mt-1 h-3.5 w-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-morandi-primary">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-morandi-secondary/80 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
