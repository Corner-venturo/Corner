'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { User, Lock, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logger } from '@/lib/utils/logger'

// localStorage keys
const LAST_CODE_KEY = 'venturo-last-code'
const LAST_USERNAME_KEY = 'venturo-last-username'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { validateLogin } = useAuthStore()

  // 從 localStorage 讀取上次輸入的代號和帳號
  useEffect(() => {
    const lastCode = localStorage.getItem(LAST_CODE_KEY)
    const lastUsername = localStorage.getItem(LAST_USERNAME_KEY)
    if (lastCode) setCode(lastCode)
    if (lastUsername) setUsername(lastUsername)
  }, [])

  // 取得登入後要跳轉的頁面
  const getRedirectPath = (): string => {
    const redirectParam = searchParams.get('redirect')
    if (redirectParam && redirectParam !== '/login') {
      return redirectParam
    }
    const lastPath = localStorage.getItem('last-visited-path')
    if (lastPath && lastPath !== '/login') {
      return lastPath
    }
    return '/'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) {
      setError('請輸入辦公室或廠商代號')
      return
    }

    if (!username.trim()) {
      setError('請輸入帳號')
      return
    }

    setIsLoading(true)

    try {
      // 記住輸入的代號和帳號
      localStorage.setItem(LAST_CODE_KEY, trimmedCode)
      localStorage.setItem(LAST_USERNAME_KEY, username.trim())

      const result = await validateLogin(username.trim(), password, trimmedCode, rememberMe)

      logger.log('🔐 Login result:', result)

      if (result.success) {
        // 如果需要首次設定（修改密碼或上傳頭像），導向設定頁
        if (result.needsSetup) {
          logger.log('➡️ Redirecting to /settings?setup=true')
          router.push('/settings?setup=true')
        } else {
          const redirectPath = getRedirectPath()
          logger.log('➡️ Redirecting to:', redirectPath)
          router.push(redirectPath)
        }
      } else {
        logger.log('❌ Login failed:', result.message)
        setError(result.message || '帳號或密碼錯誤')
      }
    } catch (error) {
      logger.error('Login error:', error)
      setError('系統錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // 判斷代號類型（用於顯示提示）
  const getCodeHint = () => {
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) return null
    if (trimmedCode === 'TP' || trimmedCode === 'TC') {
      return { type: 'workspace', label: trimmedCode === 'TP' ? '台北辦公室' : '台中辦公室' }
    }
    if (trimmedCode.length >= 3) {
      return { type: 'supplier', label: '廠商登入' }
    }
    return null
  }

  const codeHint = getCodeHint()

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-morandi-light via-white to-morandi-container/20">
      <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full">
        {/* Logo 區域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-morandi-gold rounded-full mb-4">
            <User size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-morandi-primary">Venturo 系統登入</h2>
          <p className="text-sm text-morandi-secondary mt-2">請輸入代號和帳號密碼</p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 p-3 bg-status-danger-bg border border-status-danger/30 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-status-danger mt-0.5" />
            <span className="text-sm text-status-danger">{error}</span>
          </div>
        )}

        {/* 登入表單 */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 代號輸入 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              辦公室/廠商代號
            </label>
            <div className="relative">
              <Building2
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary"
              />
              <Input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="pl-10 uppercase"
                placeholder="例：TP、TC、HTL01"
                required
                autoComplete="organization"
                autoFocus
              />
            </div>
            {codeHint && (
              <p className="mt-1 text-xs text-morandi-secondary">
                {codeHint.type === 'workspace' ? '🏢' : '🏭'} {codeHint.label}
              </p>
            )}
          </div>

          {/* 帳號 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              帳號
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary"
              />
              <Input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="pl-10"
                placeholder="例：E001"
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* 密碼 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">密碼</label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary"
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="輸入密碼"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 記住我 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border text-morandi-gold focus:ring-morandi-gold cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-morandi-primary cursor-pointer select-none">
              記住我（30 天內免重新登入）
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-morandi-gold hover:bg-morandi-gold-hover"
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? '登入中...' : '登入'}
          </Button>
        </form>

        {/* 提示 */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-xs text-morandi-secondary text-center">
            員工請輸入辦公室代號（TP/TC）+ 員工編號<br />
            廠商請輸入廠商代號 + 帳號
          </p>
        </div>
      </div>
    </div>
  )
}
