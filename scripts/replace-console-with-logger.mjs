#!/usr/bin/env node
/**
 * 自動替換 console.log/error/warn/info 為 logger
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 需要處理的檔案列表
const files = [
  'src/app/api/auth/sync-password/route.ts',
  'src/components/tours/tour-members-advanced.tsx',
  'src/components/tours/tour-departure-dialog.tsx',
  'src/app/reports/tour-closing/page.tsx',
  'src/components/tours/tour-close-dialog.tsx',
  'src/stores/operations/create.ts',
  'src/features/confirmations/components/ConfirmationsPage.tsx',
  'src/features/tours/components/ToursPage.tsx',
  'src/features/tours/components/TourExpandedView.tsx',
  'src/app/confirmations/[id]/page.tsx',
  'src/app/finance/payments/[id]/page.tsx',
  'src/hooks/useRequireAuth.ts',
  'src/stores/auth-store.ts',
  'src/stores/utils/code-generator.ts',
  'src/lib/db/operations/write.ts',
  'src/app/api/itineraries/[id]/route.ts',
  'src/lib/realtime/realtime-manager.ts',
  'src/app/api/workspaces/[workspaceId]/channels/[channelId]/members/route.ts',
  'src/lib/realtime/createRealtimeHook.ts',
  'src/components/hr/add-employee/useEmployeeForm.ts',
  'src/features/visas/components/AddVisaDialog.tsx',
  'src/app/hr/page.tsx',
  'src/components/orders/OrderMembersExpandable.tsx',
  'src/components/tours/tour-members.tsx',
  'src/features/finance/requests/components/AddRequestDialog.tsx',
  'src/features/quotes/components/CategorySection.tsx',
  'src/features/transportation-rates/components/RatesDetailDialog.tsx',
  'src/components/workspace/CreatePaymentRequestDialog.tsx',
  'src/app/database/transportation-rates/page.tsx',
  'src/features/quotes/components/QuickQuoteDetail.tsx',
  'src/features/quotes/hooks/useQuickQuoteForm.ts',
  'src/lib/pnr-parser.ts',
  'src/lib/db/migrations.ts',
  'src/lib/db/migrations/clean-todos-description.ts',
  'src/features/tours/components/sections/TourContactSection.tsx',
  'src/features/suppliers/components/SuppliersPage.tsx',
  'src/features/suppliers/components/CostTemplateDialog.tsx',
  'src/features/suppliers/components/PriceListTab.tsx',
  'src/features/quotes/components/QuotesPage.tsx',
  'src/features/quotes/components/PrintableQuotation.tsx',
  'src/features/quotes/components/PrintableQuickQuote.tsx',
  'src/features/finance/payments/components/AddReceiptDialog.tsx',
  'src/features/esims/components/EsimCreateDialog.tsx',
  'src/components/workspace/channel-sidebar/ChannelSidebar.tsx',
  'src/components/todos/quick-actions/quick-pnr.tsx',
  'src/components/todos/todo-expanded-view/QuickActionsSection.tsx',
  'src/components/todos/quick-actions/quick-disbursement.tsx',
  'src/components/orders/simple-order-table.tsx',
  'src/components/editor/tour-form/sections/HotelSection.tsx',
  'src/components/TourPage.tsx',
  'src/components/AppInitializer.tsx',
  'src/app/workspace/page.tsx',
  'src/app/finance/payments/page.tsx',
  'src/app/database/regions/page.tsx',
  'src/app/customers/[id]/page.tsx',
  'src/stores/workspace-permission-store.ts',
  'src/stores/workspace/chat-store.ts',
  'src/services/fastmove.service.ts',
  'src/stores/accounting-store.ts',
  'src/lib/sync/sync-manager.ts',
  'src/lib/realtime/hooks/useRealtimeSubscription.ts',
  'src/lib/db/operations/read.ts',
  'src/hooks/use-workspace-rls.ts',
  'src/features/disbursement/hooks/useDisbursementPDF.ts',
  'src/features/attractions/hooks/useAttractionsData.ts',
  'src/features/company-assets/components/CompanyAssetsPage.tsx',
  'src/features/attractions/components/DatabaseManagementPage.tsx',
  'src/features/attractions/components/tabs/MichelinRestaurantsTab.tsx',
  'src/features/attractions/components/tabs/PremiumExperiencesTab.tsx',
  'src/features/attractions/components/AttractionsPage.tsx',
  'src/components/workspace-switcher.tsx',
  'src/components/ui/date-input.tsx',
  'src/components/tours/tour-payments.tsx',
  'src/components/todos/quick-actions/quick-receipt.tsx',
  'src/components/tours/tour-costs.tsx',
  'src/components/layout/mobile-bottom-nav.tsx',
  'src/app/finance/payments/hooks/usePaymentData.ts',
  'src/app/finance/payments/components/LinkPayLogsTable.tsx',
  'src/app/finance/payments/components/BatchCreateReceiptDialog.tsx',
  'src/app/finance/payments/components/CreateLinkPayDialog.tsx',
  'src/app/customers/companies/page.tsx',
  'src/app/api/linkpay/route.ts',
  'src/lib/db/seed-regions.ts',
  'src/lib/db/utils/connection.ts',
  'src/lib/db/operations/delete.ts',
  'src/lib/db/operations/query.ts',
  'src/features/esims/components/EsimForm.tsx',
  'src/lib/performance/monitor.tsx',
  'src/lib/performance/memory-manager.ts',
  'src/lib/db/version-manager.ts',
  'src/lib/db/verify-and-fix.ts',
  'src/features/dashboard/components/flight-widget.tsx',
  'src/components/contracts/ContractViewDialog.tsx',
]

// 排除的檔案（特殊處理或不需要替換）
const excludeFiles = [
  'src/components/ErrorLogger.tsx', // 本身就是 logger
  'src/app/global-error.tsx', // 錯誤處理頁面需要 console.error
  'src/app/error.tsx', // 錯誤處理頁面需要 console.error
  'src/app/api/log-error/route.ts', // API route 特殊處理
]

let totalFiles = 0
let totalReplacements = 0

files.forEach(file => {
  if (excludeFiles.includes(file)) {
    console.log(`⏭️  跳過: ${file}`)
    return
  }

  const filePath = path.join(projectRoot, file)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ 檔案不存在: ${file}`)
    return
  }

  let content = fs.readFileSync(filePath, 'utf-8')
  const originalContent = content

  // 檢查是否已經有 logger import
  const hasLoggerImport = /import.*logger.*from ['"]@\/lib\/utils\/logger['"]/g.test(content)

  // 計算替換次數
  let replacements = 0

  // 替換 console.log -> logger.log
  content = content.replace(/console\.log\(/g, () => {
    replacements++
    return 'logger.log('
  })

  // 替換 console.error -> logger.error
  content = content.replace(/console\.error\(/g, () => {
    replacements++
    return 'logger.error('
  })

  // 替換 console.warn -> logger.warn
  content = content.replace(/console\.warn\(/g, () => {
    replacements++
    return 'logger.warn('
  })

  // 替換 console.info -> logger.info
  content = content.replace(/console\.info\(/g, () => {
    replacements++
    return 'logger.info('
  })

  if (replacements === 0) {
    return
  }

  // 加入 logger import（如果尚未存在）
  if (!hasLoggerImport) {
    // 找到第一個 import 語句的位置
    const importMatch = content.match(/^import .+$/m)
    if (importMatch) {
      const firstImportPos = importMatch.index
      const importLine = "import { logger } from '@/lib/utils/logger'\n"
      content = content.slice(0, firstImportPos) + importLine + content.slice(firstImportPos)
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ ${file} (${replacements} 個替換)`)
    totalFiles++
    totalReplacements += replacements
  }
})

console.log(`\n📊 總計：`)
console.log(`  - 處理檔案: ${totalFiles}`)
console.log(`  - 替換次數: ${totalReplacements}`)
console.log(`\n✨ 完成！`)
