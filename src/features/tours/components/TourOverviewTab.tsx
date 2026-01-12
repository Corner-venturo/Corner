import { Tour, Quote } from '@/stores/types'
import { useQuotes, useOrders } from '@/data'
import { cn } from '@/lib/utils'
import { DateCell, CurrencyCell } from '@/components/table-cells'

const paymentStore: { payment_requests: unknown[] } = { payment_requests: [] }

interface TourOverviewTabProps {
  tour: Tour
}

export function TourOverviewTab({ tour }: TourOverviewTabProps) {
  const { items: quotes } = useQuotes()
  const { items: orders } = useOrders()

  // Find tour's quote (approved or latest)
  const tourQuote =
    quotes.find((quote: Quote) => quote.tour_id === tour.id && quote.status === 'approved') ||
    quotes.find((quote: Quote) => quote.tour_id === tour.id)

  // Calculate tour order info
  const tourOrders = orders.filter(order => order.tour_id === tour.id)
  const totalPaidAmount = tourOrders.reduce((sum, order) => sum + (order.paid_amount || 0), 0)

  // 使用訂單中的 member_count 計算，避免額外資料庫查詢
  const currentParticipants = tourOrders.reduce((sum, order) => sum + (order.member_count || 0), 0)

  // Financial calculations
  const quotePrice = tourQuote?.total_cost || tour.price || 0
  const expectedRevenue = (quotePrice || 0) * currentParticipants
  const actualRevenue = totalPaidAmount
  const grossProfit = actualRevenue - tour.total_cost
  const netProfit = grossProfit - grossProfit * 0.05

  // Budget vs actual expenses
  const paymentRequests = paymentStore.payment_requests as Array<{ tour_id?: string; items?: Array<{ category: string; unit_price?: number; quantity?: number }> }>
  const tourPaymentRequests = paymentRequests.filter(req => req?.tour_id === tour.id)
  const quoteBudget = tourQuote?.categories || []

  interface QuoteCategory {
    name: string
    total?: number
  }

  interface PaymentRequestItem {
    category: string
    unit_price?: number
    quantity?: number
  }

  interface PaymentRequest {
    tour_id?: string
    items?: PaymentRequestItem[]
  }

  const actualExpenses = (quoteBudget as QuoteCategory[]).map((category) => {
    const categoryTotal = tourPaymentRequests.reduce((sum, request: PaymentRequest) => {
      const categoryItems = request?.items?.filter(item => item.category === category.name) || []
      return (
        sum +
        categoryItems.reduce(
          (itemSum, item) => itemSum + (item.unit_price || 0) * (item.quantity || 0),
          0
        )
      )
    }, 0)

    return {
      name: category.name,
      budgetPerPerson: category.total || 0,
      budgetTotal: (category.total || 0) * currentParticipants,
      actualTotal: categoryTotal || 0,
      variance: (categoryTotal || 0) - (category.total || 0) * currentParticipants,
    }
  })

  return (
    <div className="px-6 py-4 space-y-8">
      {/* Top section: Three-column financial overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic information */}
        <div className="space-y-3">
          <div className="text-lg font-medium text-morandi-primary border-b border-border pb-2">
            基本資訊
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-morandi-secondary">團號:</span>
              <span className="text-morandi-primary font-medium">{tour.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">目的地:</span>
              <span className="text-morandi-primary">{tour.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">出發日期:</span>
              <DateCell date={tour.departure_date} showIcon={false} />
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">返回日期:</span>
              <DateCell date={tour.return_date} showIcon={false} />
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">建立時間:</span>
              <DateCell date={tour.created_at} fallback="-" showIcon={false} className="text-morandi-secondary text-sm" />
            </div>
          </div>
        </div>

        {/* Quote and revenue */}
        <div className="space-y-3">
          <div className="text-lg font-medium text-morandi-primary border-b border-border pb-2">
            報價與收入
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-morandi-secondary">報價單價格:</span>
              <CurrencyCell amount={quotePrice || 0} className="font-medium" />
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">應收帳款:</span>
              <CurrencyCell amount={expectedRevenue} className="text-morandi-blue font-medium" />
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">實收帳款:</span>
              <CurrencyCell amount={actualRevenue} variant="income" className="font-semibold" />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-morandi-secondary">收款率:</span>
              <span
                className={cn(
                  'font-medium',
                  expectedRevenue > 0
                    ? actualRevenue / expectedRevenue >= 0.8
                      ? 'text-morandi-green'
                      : 'text-morandi-gold'
                    : 'text-morandi-secondary'
                )}
              >
                {expectedRevenue > 0
                  ? `${((actualRevenue / expectedRevenue) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">待收餘額:</span>
              <CurrencyCell
                amount={expectedRevenue - actualRevenue}
                className={cn(
                  'font-medium',
                  expectedRevenue - actualRevenue > 0 ? 'text-morandi-red' : 'text-morandi-green'
                )}
              />
            </div>
          </div>
        </div>

        {/* Cost and profit */}
        <div className="space-y-3">
          <div className="text-lg font-medium text-morandi-primary border-b border-border pb-2">
            成本與利潤
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-morandi-secondary">總成本:</span>
              <CurrencyCell amount={tour.total_cost} variant="expense" className="font-medium" />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-morandi-secondary">毛利潤:</span>
              <CurrencyCell
                amount={grossProfit}
                className={cn(
                  'font-semibold',
                  grossProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">淨利潤:</span>
              <CurrencyCell
                amount={netProfit}
                className={cn(
                  'font-bold text-lg',
                  netProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">利潤率:</span>
              <span
                className={cn(
                  'font-medium',
                  netProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              >
                {actualRevenue > 0 ? `${((netProfit / actualRevenue) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-4 p-3 rounded-lg border border-border bg-morandi-container/10">
            <div className="text-sm font-medium text-morandi-secondary mb-2">財務狀況</div>
            <div className="flex items-center space-x-2">
              {netProfit >= 0 ? (
                <div className="w-3 h-3 rounded-full bg-morandi-green"></div>
              ) : (
                <div className="w-3 h-3 rounded-full bg-morandi-red"></div>
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  netProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              >
                {netProfit >= 0 ? '盈利中' : '虧損中'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Budget vs actual expenses table */}
      <div className="border border-border rounded-xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-morandi-primary">預算 vs 實際支出明細</h3>
          <div className="text-sm text-morandi-secondary">基準：{currentParticipants}人團體</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-morandi-container/20 border-b border-border">
              <tr>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-morandi-primary">
                  類別
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">
                  單人預算
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">
                  預算總額
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">
                  實際支出
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">
                  差額
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">
                  差額率
                </th>
              </tr>
            </thead>
            <tbody>
              {actualExpenses.map((expense, index: number) => {
                const varianceRate =
                  expense.budgetTotal > 0 ? (expense.variance / expense.budgetTotal) * 100 : 0
                return (
                  <tr
                    key={expense.name}
                    className={cn(
                      'border-b border-border hover:bg-morandi-container/10',
                      index === actualExpenses.length - 1 && 'border-b-0'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-morandi-primary">{expense.name}</span>
                        {Math.abs(varianceRate) > 20 && (
                          <span
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              varianceRate > 20
                                ? 'bg-morandi-red/10 text-morandi-red'
                                : 'bg-morandi-green/10 text-morandi-green'
                            )}
                          >
                            {varianceRate > 20 ? '超支' : '節省'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-morandi-secondary">
                      <CurrencyCell amount={expense.budgetPerPerson} className="text-morandi-secondary" />
                    </td>
                    <td className="py-3 px-4 text-right text-morandi-primary font-medium">
                      <CurrencyCell amount={expense.budgetTotal} className="font-medium" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <CurrencyCell
                        amount={expense.actualTotal || 0}
                        className={cn(
                          'font-medium',
                          (expense.actualTotal || 0) > expense.budgetTotal
                            ? 'text-morandi-red'
                            : 'text-morandi-primary'
                        )}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <CurrencyCell
                        amount={expense.variance}
                        showSign
                        className={cn(
                          'font-semibold',
                          expense.variance > 0
                            ? 'text-morandi-red'
                            : expense.variance < 0
                              ? 'text-morandi-green'
                              : 'text-morandi-secondary'
                        )}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={cn(
                          'font-medium',
                          Math.abs(varianceRate) > 20
                            ? varianceRate > 0
                              ? 'text-morandi-red'
                              : 'text-morandi-green'
                            : 'text-morandi-secondary'
                        )}
                      >
                        {varianceRate > 0 ? '+' : ''}
                        {varianceRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}

              {/* Total row */}
              <tr className="bg-morandi-container/10 font-semibold">
                <td className="py-4 px-4 text-morandi-primary">總計</td>
                <td className="py-4 px-4 text-right text-morandi-secondary">
                  <CurrencyCell
                    amount={actualExpenses.reduce((sum, exp) => sum + exp.budgetPerPerson, 0)}
                    className="text-morandi-secondary"
                  />
                </td>
                <td className="py-4 px-4 text-right text-morandi-primary">
                  <CurrencyCell
                    amount={actualExpenses.reduce((sum, exp) => sum + exp.budgetTotal, 0)}
                  />
                </td>
                <td className="py-4 px-4 text-right text-morandi-primary">
                  <CurrencyCell
                    amount={actualExpenses.reduce((sum, exp) => sum + (exp.actualTotal || 0), 0)}
                  />
                </td>
                <td className="py-4 px-4 text-right">
                  <CurrencyCell
                    amount={actualExpenses.reduce((sum, exp) => sum + exp.variance, 0)}
                    showSign
                    className={cn(
                      'font-bold',
                      actualExpenses.reduce((sum, exp) => sum + exp.variance, 0) > 0
                        ? 'text-morandi-red'
                        : 'text-morandi-green'
                    )}
                  />
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-morandi-primary font-bold">
                    {actualExpenses.reduce((sum, exp) => sum + exp.budgetTotal, 0) > 0
                      ? `${((actualExpenses.reduce((sum, exp) => sum + exp.variance, 0) / actualExpenses.reduce((sum, exp) => sum + exp.budgetTotal, 0)) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Description */}
        <div className="mt-4 p-3 bg-morandi-container/5 rounded-lg text-sm text-morandi-secondary">
          <div className="flex items-center space-x-4">
            <span>
              💡 <strong>說明：</strong>
            </span>
            <span>綠色數字表示節省預算</span>
            <span>紅色數字表示超出預算</span>
            <span>差額率超過20%會特別標示</span>
          </div>
        </div>
      </div>
    </div>
  )
}
