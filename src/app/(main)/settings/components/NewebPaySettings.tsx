'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Eye, EyeOff, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'

interface NewebPayConfig {
  merchantId: string
  hashKey: string
  hashIV: string
  isProduction: boolean
}

export function NewebPaySettings() {
  const [config, setConfig] = useState<NewebPayConfig>({
    merchantId: '',
    hashKey: '',
    hashIV: '',
    isProduction: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState({
    hashKey: false,
    hashIV: false,
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('settings')
        .eq('category', 'newebpay')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 沒有資料，使用預設值
          return
        }
        throw error
      }

      if (data?.settings) {
        setConfig(data.settings as unknown as NewebPayConfig)
      }
    } catch (error) {
      console.error('載入設定失敗:', error)
      setMessage({ type: 'error', text: '載入設定失敗' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          category: 'newebpay',
          settings: config as unknown as Json,
          description: '藍新金流旅行業代轉發票設定',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'category',
        })

      if (error) throw error

      setMessage({ type: 'success', text: '設定已儲存' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('儲存設定失敗:', error)
      setMessage({ type: 'error', text: '儲存設定失敗' })
    } finally {
      setSaving(false)
    }
  }

  const maskValue = (value: string) => {
    if (!value) return ''
    if (value.length <= 8) return '••••••••'
    return value.slice(0, 4) + '••••••••' + value.slice(-4)
  }

  if (loading) {
    return (
      <section className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-morandi-gold" />
          <h2 className="text-lg font-semibold text-morandi-primary">藍新金流設定</h2>
        </div>
        <div className="text-sm text-morandi-secondary">載入中...</div>
      </section>
    )
  }

  return (
    <section className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-morandi-gold" />
          <h2 className="text-lg font-semibold text-morandi-primary">藍新金流設定</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-morandi-secondary">旅行業代收轉付電子收據</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* 商店代號 */}
        <div className="space-y-2">
          <Label htmlFor="merchantId">商店代號 (MerchantID)</Label>
          <Input
            id="merchantId"
            value={config.merchantId}
            onChange={e => setConfig({ ...config, merchantId: e.target.value })}
            placeholder="輸入藍新商店代號"
          />
          <p className="text-xs text-morandi-secondary">在藍新後台「商店管理」可查看</p>
        </div>

        {/* HashKey */}
        <div className="space-y-2">
          <Label htmlFor="hashKey">HashKey</Label>
          <div className="flex items-center gap-2">
            <Input
              id="hashKey"
              type={showSecrets.hashKey ? 'text' : 'password'}
              value={showSecrets.hashKey ? config.hashKey : maskValue(config.hashKey)}
              onChange={e => setConfig({ ...config, hashKey: e.target.value })}
              placeholder="輸入 32 字元的 HashKey"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setShowSecrets({ ...showSecrets, hashKey: !showSecrets.hashKey })}
            >
              {showSecrets.hashKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
          <p className="text-xs text-morandi-secondary">32 字元，在藍新後台「API 串接資訊」可查看</p>
        </div>

        {/* HashIV */}
        <div className="space-y-2">
          <Label htmlFor="hashIV">HashIV</Label>
          <div className="flex items-center gap-2">
            <Input
              id="hashIV"
              type={showSecrets.hashIV ? 'text' : 'password'}
              value={showSecrets.hashIV ? config.hashIV : maskValue(config.hashIV)}
              onChange={e => setConfig({ ...config, hashIV: e.target.value })}
              placeholder="輸入 16 字元的 HashIV"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setShowSecrets({ ...showSecrets, hashIV: !showSecrets.hashIV })}
            >
              {showSecrets.hashIV ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
          <p className="text-xs text-morandi-secondary">16 字元，在藍新後台「API 串接資訊」可查看</p>
        </div>

        {/* 環境切換 */}
        <div className="flex items-center justify-between p-4 bg-morandi-background rounded-lg border border-morandi-border">
          <div>
            <Label htmlFor="isProduction" className="text-sm font-medium">
              正式環境
            </Label>
            <p className="text-xs text-morandi-secondary mt-1">
              {config.isProduction
                ? '目前使用正式環境 (api.travelinvoice.com.tw)'
                : '目前使用測試環境 (capi.travelinvoice.com.tw)'}
            </p>
          </div>
          <Switch
            id="isProduction"
            checked={config.isProduction}
            onCheckedChange={checked => setConfig({ ...config, isProduction: checked })}
          />
        </div>

        {/* 儲存按鈕與訊息 */}
        <div className="flex items-center justify-between pt-4 border-t border-morandi-border">
          {message && (
            <div
              className={`flex items-center gap-2 text-sm ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {message.text}
            </div>
          )}
          {!message && <div />}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '儲存中...' : '儲存設定'}
          </Button>
        </div>
      </div>

      {/* 說明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">設定說明</h4>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>請先在藍新金流申請「旅行業代收轉付電子收據」服務</li>
          <li>HashKey 和 HashIV 是加密用金鑰，請妥善保管</li>
          <li>測試環境可使用測試商店代號進行開發測試</li>
          <li>正式上線前請切換到正式環境並使用正式商店資訊</li>
        </ul>
      </div>
    </section>
  )
}
