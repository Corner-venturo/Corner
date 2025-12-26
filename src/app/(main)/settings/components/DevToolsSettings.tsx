'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

// 環境設定指令 - 給 Claude Code 用
// ⚠️ 注意：真實的 API Key 請存放在 .env.local，不要硬編碼在程式碼中
const ENV_SETUP_PROMPT = `請幫我在 .env.local 設定以下環境變數：

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OCR
OCR_SPACE_API_KEY=your-ocr-space-key
GOOGLE_VISION_API_KEY=your-google-vision-key

# AI
GEMINI_API_KEY=your-gemini-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Venturo
NEXT_PUBLIC_ENABLE_SUPABASE=true
NEXT_PUBLIC_DEBUG_MODE=false

請確認檔案建立在專案根目錄，並從安全的地方取得實際的 API Key 值`

// Vercel 環境變數清單
const VERCEL_ENV_LIST = `Vercel 環境變數設定：

1. NEXT_PUBLIC_SUPABASE_URL = (從 Supabase Dashboard 取得)
2. NEXT_PUBLIC_SUPABASE_ANON_KEY = (從 Supabase Dashboard 取得)
3. SUPABASE_SERVICE_ROLE_KEY = (從 Supabase Dashboard 取得)
4. OCR_SPACE_API_KEY = (從 OCR.space 取得)
5. GOOGLE_VISION_API_KEY = (從 Google Cloud Console 取得)
6. GEMINI_API_KEY = (從 Google AI Studio 取得)
7. NEXT_PUBLIC_APP_URL = https://venturo.vercel.app (改成你的 Vercel 網址)
8. NEXT_PUBLIC_APP_NAME = Venturo
9. NEXT_PUBLIC_ENABLE_SUPABASE = true

⚠️ 請從安全的地方取得實際的 API Key 值，不要將真實 Key 存放在程式碼中`

export function DevToolsSettings() {
  const [copiedEnv, setCopiedEnv] = useState(false)
  const [copiedVercel, setCopiedVercel] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const copyToClipboard = async (text: string, type: 'env' | 'vercel') => {
    await navigator.clipboard.writeText(text)
    if (type === 'env') {
      setCopiedEnv(true)
      setTimeout(() => setCopiedEnv(false), 2000)
    } else {
      setCopiedVercel(true)
      setTimeout(() => setCopiedVercel(false), 2000)
    }
  }

  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-morandi-gold" />
          <h2 className="text-xl font-semibold">開發者工具</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-morandi-secondary"
        >
          {expanded ? (
            <>
              收起 <ChevronUp className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              展開 <ChevronDown className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {/* 快速設定 - Claude Code */}
        <div className="p-4 border border-border rounded-lg bg-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium mb-1">一鍵設定 .env.local</h3>
              <p className="text-sm text-morandi-secondary">
                複製後貼給 Claude Code，自動建立完整環境設定
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(ENV_SETUP_PROMPT, 'env')}
              className="ml-4"
            >
              {copiedEnv ? (
                <span className="flex items-center gap-1 text-status-success">
                  <Check className="h-4 w-4" />
                  已複製！
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="h-4 w-4" />
                  複製指令
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Vercel 環境變數 */}
        <div className="p-4 border border-border rounded-lg bg-card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Vercel 環境變數清單</h3>
              <p className="text-sm text-morandi-secondary">
                用於設定 Vercel 專案的環境變數
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(VERCEL_ENV_LIST, 'vercel')}
              className="ml-4"
            >
              {copiedVercel ? (
                <span className="flex items-center gap-1 text-status-success">
                  <Check className="h-4 w-4" />
                  已複製！
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="h-4 w-4" />
                  複製清單
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* 展開顯示完整內容 */}
        {expanded && (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-foreground rounded-lg">
              <h4 className="text-sm font-medium text-morandi-muted mb-2">
                .env.local 完整內容預覽：
              </h4>
              <pre className="text-xs text-status-success overflow-x-auto whitespace-pre-wrap">
                {ENV_SETUP_PROMPT}
              </pre>
            </div>

            <div className="p-4 bg-status-info-bg dark:bg-status-info/10 rounded-lg">
              <h4 className="text-sm font-medium text-morandi-primary dark:text-morandi-muted mb-2">
                使用方式：
              </h4>
              <ol className="text-sm text-morandi-secondary dark:text-morandi-muted space-y-1 list-decimal list-inside">
                <li>點擊「複製指令」按鈕</li>
                <li>開啟 Claude Code 終端機</li>
                <li>貼上複製的內容</li>
                <li>Claude Code 會自動建立 .env.local 檔案</li>
                <li>重啟開發伺服器：<code className="bg-morandi-container dark:bg-morandi-container/30 px-1 rounded">npm run dev</code></li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
