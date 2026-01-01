'use client'

interface TotalAmountSectionProps {
  totals: {
    mealsTotal: number
    accomTotal: number
    activityTotal: number
    othersTotal: number
    expectedTotal: number
    actualTotal: number
  }
}

const formatMoney = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '-'
  return amount.toLocaleString('zh-TW')
}

export function TotalAmountSection({ totals }: TotalAmountSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-morandi-primary mb-4">總金額</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-morandi-container/10 rounded-lg">
          <label className="text-sm text-morandi-primary">餐食</label>
          <div className="mt-1 text-xl font-bold text-morandi-primary">{formatMoney(totals.mealsTotal)}</div>
        </div>
        <div className="p-4 bg-morandi-container/10 rounded-lg">
          <label className="text-sm text-morandi-primary">住宿</label>
          <div className="mt-1 text-xl font-bold text-morandi-primary">{formatMoney(totals.accomTotal)}</div>
        </div>
        <div className="p-4 bg-morandi-container/10 rounded-lg">
          <label className="text-sm text-morandi-primary">活動</label>
          <div className="mt-1 text-xl font-bold text-morandi-primary">{formatMoney(totals.activityTotal)}</div>
        </div>
        <div className="p-4 bg-morandi-container/10 rounded-lg">
          <label className="text-sm text-morandi-primary">其他</label>
          <div className="mt-1 text-xl font-bold text-morandi-primary">{formatMoney(totals.othersTotal)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-morandi-container/20 rounded-lg text-center">
          <label className="text-sm text-morandi-primary">預計總支出</label>
          <div className="mt-2 text-3xl font-bold text-morandi-primary">
            NT$ {formatMoney(totals.expectedTotal)}
          </div>
        </div>
        <div className="p-6 bg-morandi-green/10 rounded-lg text-center">
          <label className="text-sm text-morandi-primary">實際總支出</label>
          <div className="mt-2 text-3xl font-bold text-morandi-green">
            NT$ {formatMoney(totals.actualTotal)}
          </div>
        </div>
      </div>
    </div>
  )
}
