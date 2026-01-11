'use client'

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

interface ApiConfig {
  name: string
  description: string
  envKey: string
  value: string
  docsUrl?: string
  consoleUrl?: string
  usageInfo?: string
  category: 'database' | 'ocr' | 'ai' | 'payment' | 'other'
}

export function ApiSettings() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 從 API 獲取環境變數（安全地只顯示部分）
    const fetchApiConfigs = async () => {
      try {
        const res = await fetch('/api/settings/env')
        if (res.ok) {
          const data = await res.json()
          setApiConfigs(data.configs)
        }
      } catch (error) {
        logger.error('Failed to fetch API configs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchApiConfigs()
  }, [])

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const maskValue = (value: string) => {
    if (!value) return '未設定'
    if (value.length <= 8) return '••••••••'
    return value.slice(0, 4) + '••••••••' + value.slice(-4)
  }

  const categoryLabels: Record<string, string> = {
    database: 'Supabase 資料庫',
    ocr: 'OCR 辨識服務',
    ai: 'AI 服務',
    flight: '航班查詢服務',
    payment: '金流服務',
    other: '其他設定',
  }

  const categoryIcons: Record<string, string> = {
    database: '🗄️',
    ocr: '📷',
    ai: '🤖',
    flight: '✈️',
    payment: '💳',
    other: '⚙️',
  }

  // 按類別分組
  const groupedConfigs = apiConfigs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push(config)
    return acc
  }, {} as Record<string, ApiConfig[]>)

  if (loading) {
    return (
      <section className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="h-5 w-5 text-morandi-gold" />
          <h2 className="text-lg font-semibold text-morandi-primary">API 設定</h2>
        </div>
        <div className="text-sm text-morandi-secondary">載入中...</div>
      </section>
    )
  }

  return (
    <section className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-morandi-gold" />
          <h2 className="text-lg font-semibold text-morandi-primary">API 設定</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-status-warning bg-status-warning-bg px-3 py-1.5 rounded-lg">
          <AlertTriangle size={14} />
          <span>請勿將 API Key 分享給非授權人員</span>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedConfigs).map(([category, configs]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium text-morandi-primary flex items-center gap-2">
              <span>{categoryIcons[category]}</span>
              {categoryLabels[category]}
            </h3>

            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.envKey}
                  className="bg-morandi-background rounded-lg p-4 border border-morandi-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-morandi-primary">
                          {config.name}
                        </span>
                        {!config.value && (
                          <span className="text-xs text-status-danger bg-status-danger-bg px-2 py-0.5 rounded">
                            未設定
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-morandi-secondary mb-2">
                        {config.description}
                      </p>

                      {/* 環境變數名稱 */}
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-morandi-secondary">
                          {config.envKey}
                        </code>
                      </div>

                      {/* API Key 值 */}
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-morandi-primary bg-card px-2 py-1 rounded border flex-1 overflow-hidden">
                          {showKeys[config.envKey] ? config.value : maskValue(config.value)}
                        </code>

                        {config.value && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => toggleShowKey(config.envKey)}
                              title={showKeys[config.envKey] ? '隱藏' : '顯示'}
                            >
                              {showKeys[config.envKey] ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => copyToClipboard(config.value, config.envKey)}
                              title="複製"
                            >
                              {copiedKey === config.envKey ? (
                                <Check size={14} className="text-status-success" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </Button>
                          </>
                        )}
                      </div>

                      {/* 使用量資訊 */}
                      {config.usageInfo && (
                        <p className="text-xs text-status-info mt-2">
                          {config.usageInfo}
                        </p>
                      )}
                    </div>

                    {/* 外部連結 */}
                    <div className="flex flex-col gap-1">
                      {config.consoleUrl && (
                        <a
                          href={config.consoleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-morandi-gold hover:underline flex items-center gap-1"
                        >
                          管理後台 <ExternalLink size={10} />
                        </a>
                      )}
                      {config.docsUrl && (
                        <a
                          href={config.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-morandi-secondary hover:underline flex items-center gap-1"
                        >
                          文件 <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* .env.local 說明 */}
      <div className="mt-6 p-4 bg-status-info-bg rounded-lg border border-status-info/30">
        <h4 className="text-sm font-medium text-morandi-primary mb-2">設定方式</h4>
        <p className="text-xs text-morandi-secondary mb-2">
          在專案根目錄建立或編輯 <code className="bg-morandi-container px-1 rounded">.env.local</code> 檔案：
        </p>
        <pre className="text-xs bg-morandi-container p-3 rounded overflow-x-auto">
{`# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OCR
OCR_SPACE_API_KEY=K85xxx...
GOOGLE_VISION_API_KEY=AIzaSyxxx...

# AI
GEMINI_API_KEY=AIzaSyxxx...`}
        </pre>
      </div>
    </section>
  )
}
