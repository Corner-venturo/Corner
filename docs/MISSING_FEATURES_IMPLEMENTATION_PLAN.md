# 缺失功能完整實作計劃

> **開始日期**: 2025-11-09
> **預估總工時**: 12-17 工作天
> **目標**: 將新系統功能完整度從 65% 提升到 95%+

---

## 📋 功能清單總覽

### Phase 1: PDF 生成功能 (優先級 P1) - 2 天
- [ ] 1.1 出納單 PDF 生成
- [ ] 1.2 收款單 PDF 生成
- [ ] 1.3 請款單 PDF 生成
- [ ] 1.4 PDF 工具函數庫

### Phase 2: Excel 匯出功能 (優先級 P1) - 1 天
- [ ] 2.1 收款單 Excel 匯出
- [ ] 2.2 請款單 Excel 匯出
- [ ] 2.3 出納單 Excel 匯出
- [ ] 2.4 Excel 工具函數庫

### Phase 3: 批量操作功能 (優先級 P1) - 2 天
- [ ] 3.1 批量創建收款單
- [ ] 3.2 Excel 匯入收款單
- [ ] 3.3 Excel 匯入請款單
- [ ] 3.4 批量確認功能

### Phase 4: 利潤計算系統 (優先級 P1) - 2-3 天
- [ ] 4.1 出納單計算邏輯 (按供應商分組)
- [ ] 4.2 團體利潤計算 Hook
- [ ] 4.3 利潤分析頁面 (ProfitTab)
- [ ] 4.4 利潤表格組件

### Phase 5: 獎金設定功能 (優先級 P2) - 1-2 天
- [ ] 5.1 獎金設定資料結構
- [ ] 5.2 獎金設定 Store
- [ ] 5.3 獎金設定頁面 (BonusSettingTab)
- [ ] 5.4 獎金 PDF 生成

### Phase 6: 請款單功能增強 (優先級 P2) - 1-2 天
- [ ] 6.1 請款項目類型標準化
- [ ] 6.2 請款單詳情頁面
- [ ] 6.3 請款單搜尋對話框
- [ ] 6.4 依團號查詢 API

### Phase 7: 搜尋與查詢功能 (優先級 P2) - 1 天
- [ ] 7.1 整合收款單進階搜尋
- [ ] 7.2 整合請款單進階搜尋
- [ ] 7.3 依訂單查詢收款單
- [ ] 7.4 依團號查詢請款單

### Phase 8: 其他優化功能 (優先級 P3) - 1-2 天
- [ ] 8.1 使用者字典 Hook
- [ ] 8.2 供應商字典 Hook
- [ ] 8.3 供應商歷史記錄
- [ ] 8.4 客戶參團歷史

---

## 🎯 Phase 1: PDF 生成功能

### 1.1 出納單 PDF 生成

**檔案**: `/src/lib/pdf/disbursement-pdf.ts`

**需求**:
- 生成出納單 PDF
- 包含：出納單號、日期、請款單列表、總金額
- 按供應商分組顯示
- 支援中文字體

**參考舊系統**: `BillPdf.tsx`

**技術方案**:
```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateDisbursementPDF = async (order: DisbursementOrder) => {
  const doc = new jsPDF()

  // 1. 載入字體
  doc.addFileToVFS('NotoSansTC-Regular.ttf', NotoSansTCFont)
  doc.addFont('NotoSansTC-Regular.ttf', 'NotoSansTC', 'normal')
  doc.setFont('NotoSansTC')

  // 2. 標題
  doc.setFontSize(18)
  doc.text('出納單', 105, 20, { align: 'center' })

  // 3. 基本資訊
  doc.setFontSize(12)
  doc.text(`出納單號: ${order.code}`, 20, 40)
  doc.text(`出納日期: ${formatDate(order.disbursement_date)}`, 20, 50)

  // 4. 請款單表格
  autoTable(doc, {
    startY: 60,
    head: [['請款單號', '團號', '供應商', '金額', '備註']],
    body: order.payment_requests.map(req => [
      req.code,
      req.tour_code,
      req.supplier_name,
      formatCurrency(req.total_amount),
      req.notes || '-'
    ]),
    foot: [['', '', '', `總計: ${formatCurrency(order.total_amount)}`, '']],
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' }
  })

  // 5. 下載
  doc.save(`出納單_${order.code}.pdf`)
}
```

---

### 1.2 收款單 PDF 生成

**檔案**: `/src/lib/pdf/receipt-pdf.ts`

**需求**:
- 生成收款單 PDF
- 包含：收款單號、訂單號、收款資訊、LinkPay 記錄

**技術方案**:
```typescript
export const generateReceiptPDF = async (receipt: Receipt) => {
  const doc = new jsPDF()

  // 類似結構，包含：
  // - 收款單基本資訊
  // - 收款方式詳細資訊
  // - LinkPay 記錄（如果有）
  // - 備註

  doc.save(`收款單_${receipt.receipt_number}.pdf`)
}
```

---

### 1.3 請款單 PDF 生成

**檔案**: `/src/lib/pdf/payment-request-pdf.ts`

**需求**:
- 生成請款單 PDF
- 包含：請款單號、團號、供應商、項目明細

---

## 🎯 Phase 2: Excel 匯出功能

### 2.1 收款單 Excel 匯出

**檔案**: `/src/lib/excel/receipt-excel.ts`

**需求**:
- 匯出收款單列表為 Excel
- 包含欄位：收款編號、訂單編號、收款日期、收款金額、實收金額、收款類型、狀態、經手人、備註

**技術方案**:
```typescript
import * as XLSX from 'xlsx'

export const exportReceiptsToExcel = (receipts: Receipt[]) => {
  const data = receipts.map(r => ({
    收款編號: r.receipt_number,
    訂單編號: r.order?.order_number || '-',
    收款日期: formatDate(r.receipt_date),
    應收金額: r.receipt_amount,
    實收金額: r.actual_amount || '-',
    收款方式: getReceiptTypeName(r.receipt_type),
    狀態: getReceiptStatusName(r.status),
    經手人: r.handler_name || '-',
    備註: r.notes || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '收款單列表')

  const filename = `${new Date().toISOString().split('T')[0].replace(/-/g, '_')}_收款單列表.xlsx`
  XLSX.writeFile(workbook, filename)
}
```

---

## 🎯 Phase 3: 批量操作功能

### 3.1 批量創建收款單

**檔案**: `/src/app/finance/payments/components/BatchCreateReceiptDialog.tsx`

**需求**:
- 一次建立多筆收款單
- 支援多行輸入
- 每行包含：訂單編號、收款金額、收款方式、收款日期

**UI 設計**:
```typescript
interface BatchReceiptItem {
  order_id: string
  receipt_amount: number
  receipt_type: ReceiptType
  receipt_date: string
  handler_name?: string
  notes?: string
}

export function BatchCreateReceiptDialog() {
  const [items, setItems] = useState<BatchReceiptItem[]>([
    { order_id: '', receipt_amount: 0, receipt_type: 0, receipt_date: '' }
  ])

  // 新增項目
  const handleAddItem = () => {
    setItems([...items, { order_id: '', receipt_amount: 0, receipt_type: 0, receipt_date: '' }])
  }

  // 批量創建
  const handleBatchCreate = async () => {
    await Promise.all(items.map(item => createReceipt(item)))
    toast.success(`成功創建 ${items.length} 筆收款單`)
  }

  return (
    <Dialog>
      <Table>
        {items.map((item, index) => (
          <BatchReceiptItemRow key={index} item={item} onChange={...} />
        ))}
      </Table>
      <Button onClick={handleAddItem}>新增項目</Button>
      <Button onClick={handleBatchCreate}>批量創建</Button>
    </Dialog>
  )
}
```

---

## 🎯 Phase 4: 利潤計算系統

### 4.1 出納單計算邏輯

**檔案**: `/src/hooks/useDisbursementCalculation.ts`

**需求**:
- 按供應商分組請款單
- 計算每組總金額
- 處理客戶退款/外幣請款

**參考舊系統**: `useBillCalculation.ts`

```typescript
export const useDisbursementCalculation = (requestIds: string[]) => {
  const requests = usePaymentRequestStore(state =>
    state.items.filter(r => requestIds.includes(r.id))
  )

  // 按供應商分組
  const grouped = useMemo(() => {
    const map = new Map<string, PaymentRequest[]>()
    requests.forEach(req => {
      const supplierId = req.supplier_id
      if (!map.has(supplierId)) {
        map.set(supplierId, [])
      }
      map.get(supplierId)!.push(req)
    })
    return map
  }, [requests])

  // 計算總金額
  const totalAmount = useMemo(() => {
    return requests.reduce((sum, req) => sum + req.total_amount, 0)
  }, [requests])

  return { grouped, totalAmount, requests }
}
```

---

### 4.2 團體利潤計算

**檔案**: `/src/hooks/useTourProfitCalculation.ts`

**需求**:
- 計算公式：收入 - 支出 - 獎金 = 利潤
- 收入：所有收款單的實收金額
- 支出：所有請款單的總金額
- 獎金：獎金設定的總額

```typescript
export const useTourProfitCalculation = (tourId: string) => {
  const receipts = useReceiptStore(state =>
    state.items.filter(r => r.tour_id === tourId && r.status === 1)
  )
  const requests = usePaymentRequestStore(state =>
    state.items.filter(r => r.tour_id === tourId)
  )
  const bonusSettings = useBonusSettingStore(state =>
    state.items.filter(b => b.tour_id === tourId)
  )

  // 收入
  const revenue = useMemo(() => {
    return receipts.reduce((sum, r) => sum + (r.actual_amount || 0), 0)
  }, [receipts])

  // 支出
  const expense = useMemo(() => {
    return requests.reduce((sum, r) => sum + r.total_amount, 0)
  }, [requests])

  // 獎金
  const bonuses = useMemo(() => {
    return bonusSettings.map(setting => {
      if (setting.bonus_type === 'percent') {
        return revenue * setting.bonus / 100
      } else {
        return setting.bonus
      }
    })
  }, [bonusSettings, revenue])

  const totalBonus = useMemo(() => {
    return bonuses.reduce((sum, b) => sum + b, 0)
  }, [bonuses])

  // 利潤
  const profit = revenue - expense - totalBonus

  return {
    revenue,
    expense,
    totalBonus,
    profit,
    receipts,
    requests,
    bonusSettings
  }
}
```

---

## 🎯 Phase 5: 獎金設定功能

### 5.1 獎金設定資料結構

**檔案**: `/src/types/bonus-setting.types.ts`

```typescript
export interface BonusSetting extends SyncableEntity {
  tour_id: string              // 團號
  bonus_type_code: number      // 獎金類型（稅金、OP獎金等）
  bonus: number                // 獎金金額
  calculation_type: 'percent' | 'dollar'  // 計算方式
  employee_id?: string         // 員工 ID（可選）
}

export enum BonusTypeCode {
  TAX = 0,           // 稅金
  OP_BONUS = 1,      // OP 獎金
  SALES_BONUS = 2,   // 業務獎金
  GUIDE_BONUS = 3,   // 導遊獎金
  OTHER = 999        // 其他
}
```

---

## 🎯 Phase 6: 請款單功能增強

### 6.1 請款項目類型標準化

**檔案**: `/src/types/payment-request-item-types.ts`

```typescript
export enum PaymentRequestItemType {
  HOTEL = 0,        // 飯店
  TRANSPORT = 1,    // 交通
  MEAL = 2,         // 餐飲
  ACTIVITY = 3,     // 活動
  TOUR_PAYMENT = 4, // 出團款
  TOUR_RETURN = 5,  // 回團款
  OTHER = 6,        // 其他
  INSURANCE = 7,    // 保險
  BONUS = 8,        // 獎金
  REFUND = 9,       // 退預收款
  B2B = 10,         // 同業
  ESIM = 11,        // 網卡
  EMPLOYEE = 999    // 員工
}

export const getPaymentRequestItemTypeName = (type: PaymentRequestItemType): string => {
  const names = {
    [PaymentRequestItemType.HOTEL]: '飯店',
    [PaymentRequestItemType.TRANSPORT]: '交通',
    [PaymentRequestItemType.MEAL]: '餐飲',
    [PaymentRequestItemType.ACTIVITY]: '活動',
    [PaymentRequestItemType.TOUR_PAYMENT]: '出團款',
    [PaymentRequestItemType.TOUR_RETURN]: '回團款',
    [PaymentRequestItemType.OTHER]: '其他',
    [PaymentRequestItemType.INSURANCE]: '保險',
    [PaymentRequestItemType.BONUS]: '獎金',
    [PaymentRequestItemType.REFUND]: '退預收款',
    [PaymentRequestItemType.B2B]: '同業',
    [PaymentRequestItemType.ESIM]: '網卡',
    [PaymentRequestItemType.EMPLOYEE]: '員工'
  }
  return names[type] || '未知'
}
```

---

## 📅 實作時程表

### Week 1 (Day 1-5)
- Day 1: Phase 1.1-1.2 (出納單、收款單 PDF)
- Day 2: Phase 1.3-1.4 (請款單 PDF、PDF 工具庫)
- Day 3: Phase 2 (Excel 匯出功能)
- Day 4: Phase 3.1-3.2 (批量創建、Excel 匯入)
- Day 5: Phase 3.3-3.4 (批量確認)

### Week 2 (Day 6-10)
- Day 6: Phase 4.1 (出納單計算邏輯)
- Day 7: Phase 4.2-4.3 (團體利潤計算、利潤頁面)
- Day 8: Phase 5 (獎金設定功能)
- Day 9: Phase 6 (請款單功能增強)
- Day 10: Phase 7 (搜尋與查詢功能)

### Week 3 (Day 11-12)
- Day 11: Phase 8 (其他優化功能)
- Day 12: 整合測試、文檔更新

---

## 📦 需要安裝的套件

```bash
# PDF 生成
npm install jspdf jspdf-autotable

# Excel 處理
npm install xlsx

# 字體檔案（中文支援）
# 需下載 Noto Sans TC 字體並轉換為 base64
```

---

## ✅ 完成檢查清單

### PDF 生成
- [ ] 出納單 PDF 可正常生成
- [ ] 收款單 PDF 可正常生成
- [ ] 請款單 PDF 可正常生成
- [ ] 中文字體正常顯示
- [ ] 表格自動換頁

### Excel 匯出
- [ ] 收款單列表可匯出
- [ ] 請款單列表可匯出
- [ ] 匯出檔案格式正確
- [ ] 欄位名稱正確

### 批量操作
- [ ] 可批量創建收款單
- [ ] 可批量創建請款單
- [ ] Excel 匯入功能正常
- [ ] 錯誤處理完善

### 利潤計算
- [ ] 出納單按供應商分組正確
- [ ] 團體利潤計算正確
- [ ] 利潤頁面顯示正常
- [ ] 獎金計算正確

### 請款單增強
- [ ] 項目類型標準化完成
- [ ] 詳情頁面功能完整
- [ ] 搜尋功能正常
- [ ] 依團號查詢正常

---

**文檔版本**: v1.0
**最後更新**: 2025-11-09
**負責人**: Claude Code
