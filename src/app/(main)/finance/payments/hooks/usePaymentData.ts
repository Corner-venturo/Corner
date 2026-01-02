/**
 * 收款管理資料處理 Hook
 */

import { logger } from '@/lib/utils/logger'
import { useMemo } from 'react'
import { useOrderStore, useReceiptStore, useLinkPayLogStore, useAuthStore, useTourStore, useEmployeeStore } from '@/stores'
import { sendPaymentAbnormalNotification } from '@/lib/utils/bot-notification'
import { generateReceiptNumber } from '@/lib/utils/receipt-number-generator'
import { generateVoucherFromPayment, generateVoucherFromCardPayment } from '@/services/voucher-auto-generator'
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
  const { items: receipts, create: createReceipt, update: updateReceipt, fetchAll: fetchReceipts } = useReceiptStore()
  const { items: linkpayLogs } = useLinkPayLogStore()
  const { items: tours } = useTourStore()
  const { user } = useAuthStore()
  const { items: employees } = useEmployeeStore()
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

    // 取得團號（從訂單關聯的旅遊團）
    const tour = tours.find(t => t.id === selectedOrder?.tour_id)
    const tourCode = tour?.code || ''
    if (!tourCode) {
      throw new Error('無法取得團號，請確認訂單已關聯旅遊團')
    }

    // 為每個收款項目建立收款單
    for (const item of paymentItems) {
      // 生成收款單號（新格式：{團號}-R{2位數}）
      const receiptNumber = generateReceiptNumber(
        tourCode,
        receipts.filter(r => r.receipt_number?.startsWith(`${tourCode}-R`))
      )

      // 建立收款單
      const receipt = await createReceipt({
        receipt_number: receiptNumber,
        workspace_id: user.workspace_id || '',
        order_id: selectedOrderId,
        tour_id: selectedOrder?.tour_id || null, // 直接關聯團號
        order_number: selectedOrder?.order_number || '',
        tour_name: selectedOrder?.tour_name || '',
        receipt_date: item.transaction_date,
        receipt_type: item.receipt_type,
        receipt_amount: item.amount,
        actual_amount: 0, // 待會計確認
        status: '0', // 待確認
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
        check_date: null, // 支票兌現日期
        link: null, // LinkPay 連結（建立後由 API 填入）
        linkpay_order_number: null, // LinkPay 訂單號
        note: item.note || null,
        deleted_at: null,
        created_by: user.id,
        updated_by: user.id,
      })

      // ✅ 自動產生會計傳票（如果啟用會計模組）
      if (hasAccounting && !isExpired && user.workspace_id) {
        try {
          // 判斷收款方式
          if (item.receipt_type === RECEIPT_TYPES.CREDIT_CARD) {
            // V2: 刷卡收款使用 4 筆分錄
            // 預設費率：銀行實扣 1.68%，團成本固定 2%
            const feeRateDeducted = item.fees ? item.fees / item.amount : 0.0168

            await generateVoucherFromCardPayment({
              workspace_id: user.workspace_id,
              order_id: selectedOrderId,
              payment_date: item.transaction_date,
              gross_amount: item.amount,
              fee_rate_deducted: feeRateDeducted,
              description: `${selectedOrder?.order_number || ''} - ${receiptNumber} 刷卡收款`,
            })

            logger.info('✅ 刷卡收款傳票已自動產生 (V2)', {
              receiptNumber,
              grossAmount: item.amount,
              feeRateDeducted,
            })
          } else {
            // 現金/匯款收款使用傳統 2 筆分錄
            const paymentMethod = item.receipt_type === RECEIPT_TYPES.CASH ? 'cash' : 'bank'

            await generateVoucherFromPayment({
              workspace_id: user.workspace_id,
              order_id: selectedOrderId,
              payment_amount: item.amount,
              payment_date: item.transaction_date,
              payment_method: paymentMethod,
              description: `${selectedOrder?.order_number || ''} - ${receiptNumber} 收款`,
            })

            logger.info('✅ 收款傳票已自動產生', { receiptNumber, amount: item.amount })
          }
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

  // 確認收款（更新實收金額和狀態，異常時記錄備註並通知建立者）
  const handleConfirmReceipt = async (receiptId: string, actualAmount: number, isAbnormal: boolean = false) => {
    if (!user?.id) {
      throw new Error('請先登入')
    }

    // 找到收款單資訊
    const receipt = receipts.find(r => r.id === receiptId)

    // 如果金額異常，在備註中記錄
    const abnormalNote = isAbnormal && receipt
      ? `[金額異常] 應收 NT$ ${(receipt.receipt_amount || 0).toLocaleString()}，實收 NT$ ${actualAmount.toLocaleString()}`
      : null

    await updateReceipt(receiptId, {
      actual_amount: actualAmount,
      status: '1', // 已確認
      note: abnormalNote ? `${receipt?.note || ''} ${abnormalNote}`.trim() : receipt?.note,
      updated_by: user.id,
    })

    // 如果金額異常，發送機器人通知給建立者
    if (isAbnormal && receipt?.created_by && receipt.created_by !== user.id) {
      const confirmer = employees.find(e => e.id === user.id)
      const confirmerName = confirmer?.chinese_name || confirmer?.display_name || '會計'

      try {
        await sendPaymentAbnormalNotification({
          recipientId: receipt.created_by,
          receiptNumber: receipt.receipt_number || receiptId,
          expectedAmount: receipt.receipt_amount || 0,
          actualAmount,
          confirmedBy: confirmerName,
        })
        logger.info('⚠️ 收款金額異常通知已發送', {
          receiptId,
          actualAmount,
          expectedAmount: receipt?.receipt_amount,
          creatorId: receipt.created_by,
        })
      } catch (error) {
        logger.error('發送金額異常通知失敗:', error)
        // 不阻斷主流程
      }
    }

    if (isAbnormal) {
      logger.info('⚠️ 收款金額異常已記錄', { receiptId, actualAmount, expectedAmount: receipt?.receipt_amount })
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
    handleConfirmReceipt,
  }
}
