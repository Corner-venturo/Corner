/**
 * 收款管理資料處理 Hook
 */

import { logger } from '@/lib/utils/logger'
import { useMemo } from 'react'
import { useOrderStore, useReceiptStore, useLinkPayLogStore, useAuthStore } from '@/stores'
import { generateReceiptNumber } from '@/lib/utils/receipt-number-generator'
import { getCurrentWorkspaceCode } from '@/lib/workspace-helpers'
import { generateVoucherFromPayment } from '@/services/voucher-auto-generator'
import { useAccountingModule } from '@/hooks/use-accounting-module'
import type { ReceiptItem } from '@/stores'

const RECEIPT_TYPES = {
  BANK_TRANSFER: 0,
  CASH: 1,
  CREDIT_CARD: 2,
  CHECK: 3,
  LINK_PAY: 4,
} as const

export function usePaymentData() {
  const { items: orders } = useOrderStore()
  const { items: receipts, create: createReceipt, fetchAll: fetchReceipts } = useReceiptStore()
  const { items: linkpayLogs } = useLinkPayLogStore()
  const { user } = useAuthStore()
  const { hasAccounting, isExpired } = useAccountingModule()

  // 過濾可用訂單（未收款或部分收款）
  const availableOrders = useMemo(() => {
    return orders.filter(
      order => order.payment_status === 'unpaid' || order.payment_status === 'partial'
    )
  }, [orders])

  const handleCreateLinkPay = async (receiptNumber: string, item: ReceiptItem) => {
    try {
      const response = await fetch('/api/linkpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNumber,
          userName: item.receipt_account || '',
          email: item.email || '',
          paymentName: item.payment_name || '',
          createUser: user?.id || '',
          amount: item.amount,
          endDate: item.pay_dateline || '',
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ LinkPay 付款連結生成成功')
      } else {
        alert(`❌ LinkPay 生成失敗: ${data.message}`)
      }
    } catch (error) {
      logger.error('LinkPay API 錯誤:', error)
      alert('❌ LinkPay 連結生成失敗')
    }
  }

  const handleCreateReceipt = async (data: {
    selectedOrderId: string
    paymentItems: ReceiptItem[]
  }) => {
    const { selectedOrderId, paymentItems } = data

    if (!selectedOrderId || paymentItems.length === 0 || !user?.id) {
      throw new Error('請填寫完整資訊')
    }

    const selectedOrder = orders.find(order => order.id === selectedOrderId)

    // 為每個收款項目建立收款單
    for (const item of paymentItems) {
      // 生成收款單號
      const workspaceCode = getCurrentWorkspaceCode()
      if (!workspaceCode) {
        throw new Error('無法取得 workspace code')
      }
      const receiptNumber = generateReceiptNumber(workspaceCode, item.transaction_date, receipts)

      // 建立收款單
      const receipt = await createReceipt({
        receipt_number: receiptNumber,
        workspace_id: user.workspace_id || '',
        order_id: selectedOrderId,
        order_number: selectedOrder?.order_number || '',
        tour_name: selectedOrder?.tour_name || '',
        receipt_date: item.transaction_date,
        receipt_type: item.receipt_type,
        receipt_amount: item.amount,
        actual_amount: 0, // 待會計確認
        status: 0, // 待確認
        receipt_account: item.receipt_account || null,
        email: item.email || null,
        payment_name: item.payment_name || null,
        pay_dateline: item.pay_dateline || null,
        handler_name: item.handler_name || null,
        account_info: item.account_info || null,
        fees: item.fees || null,
        card_last_four: item.card_last_four || null,
        auth_code: item.auth_code || null,
        check_number: item.check_number || null,
        check_bank: item.check_bank || null,
        note: item.note || null,
        created_by: user.id,
        updated_by: user.id,
      } as any)

      // ✅ 自動產生會計傳票（如果啟用會計模組）
      if (hasAccounting && !isExpired && user.workspace_id) {
        try {
          // 判斷收款方式
          const paymentMethod = item.receipt_type === RECEIPT_TYPES.CASH ? 'cash' : 'bank'

          // 產生傳票
          await generateVoucherFromPayment({
            workspace_id: user.workspace_id,
            order_id: selectedOrderId,
            payment_amount: item.amount,
            payment_date: item.transaction_date,
            payment_method: paymentMethod,
            description: `${selectedOrder?.order_number || ''} - ${receiptNumber} 收款`,
          })

          logger.info('✅ 收款傳票已自動產生', { receiptNumber, amount: item.amount })
        } catch (error) {
          logger.error('❌ 傳票產生失敗（不影響收款單建立）:', error)
          // 不阻斷收款流程
        }
      }

      // 如果是 LinkPay，呼叫 API 生成付款連結
      if (item.receipt_type === RECEIPT_TYPES.LINK_PAY) {
        await handleCreateLinkPay(receiptNumber, item)
      }
    }

    // 重新載入資料
    await fetchReceipts()
  }

  return {
    receipts,
    orders,
    availableOrders,
    linkpayLogs,
    user,
    fetchReceipts,
    handleCreateReceipt,
  }
}
