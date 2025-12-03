'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

// 環境設定指令 - 給 Claude Code 用
const ENV_SETUP_PROMPT = `請幫我在 .env.local 設定以下環境變數：

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pfqvdacxowpgfamuvnsn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyNzg0MTksImV4cCI6MjA0NTg1NDQxOX0.2rrwNVNMjpKIvjObDqG6psWAMDKmEFCUpX4ze0K4KZ0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDI3ODQxOSwiZXhwIjoyMDQ1ODU0NDE5fQ.VKlPLCbJqNfHqOj0F9dIbfvNDzUQdZqLbJvqF9PMQGI

# OCR
OCR_SPACE_API_KEY=K85217444288957
GOOGLE_VISION_API_KEY=AIzaSyAfPvuMgQ-0pJJbhxPxfO4qvWMIPkKCj9I

# AI
GEMINI_API_KEY=AIzaSyB63zZ390rlAlOatnP8h1Yu6fe2erfqfKc

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Venturo
NEXT_PUBLIC_ENABLE_SUPABASE=true
NEXT_PUBLIC_DEBUG_MODE=false

請確認檔案建立在專案根目錄 /Users/william/Projects/venturo-new/.env.local`

// Vercel 環境變數清單
const VERCEL_ENV_LIST = `Vercel 環境變數設定：

1. NEXT_PUBLIC_SUPABASE_URL = https://pfqvdacxowpgfamuvnsn.supabase.co
2. NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyNzg0MTksImV4cCI6MjA0NTg1NDQxOX0.2rrwNVNMjpKIvjObDqG6psWAMDKmEFCUpX4ze0K4KZ0
3. SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDI3ODQxOSwiZXhwIjoyMDQ1ODU0NDE5fQ.VKlPLCbJqNfHqOj0F9dIbfvNDzUQdZqLbJvqF9PMQGI
4. OCR_SPACE_API_KEY = K85217444288957
5. GOOGLE_VISION_API_KEY = AIzaSyAfPvuMgQ-0pJJbhxPxfO4qvWMIPkKCj9I
6. GEMINI_API_KEY = AIzaSyB63zZ390rlAlOatnP8h1Yu6fe2erfqfKc
7. NEXT_PUBLIC_APP_URL = https://venturo.vercel.app (改成你的 Vercel 網址)
8. NEXT_PUBLIC_APP_NAME = Venturo
9. NEXT_PUBLIC_ENABLE_SUPABASE = true`

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
                <span className="flex items-center gap-1 text-green-600">
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
                <span className="flex items-center gap-1 text-green-600">
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
            <div className="p-4 bg-gray-900 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                .env.local 完整內容預覽：
              </h4>
              <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                {ENV_SETUP_PROMPT}
              </pre>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                使用方式：
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>點擊「複製指令」按鈕</li>
                <li>開啟 Claude Code 終端機</li>
                <li>貼上複製的內容</li>
                <li>Claude Code 會自動建立 .env.local 檔案</li>
                <li>重啟開發伺服器：<code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">npm run dev</code></li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
