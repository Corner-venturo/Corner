'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { validateLogin } = useAuthStore()

  // 取得登入後要跳轉的頁面
  const getRedirectPath = (): string => {
    // 1. 優先從 URL 參數讀取（middleware 設定的）
    const redirectParam = searchParams.get('redirect')
    if (redirectParam && redirectParam !== '/login') {
      return redirectParam
    }
    // 2. 從 localStorage 讀取最後訪問的頁面
    const lastPath = localStorage.getItem('last-visited-path')
    if (lastPath && lastPath !== '/login') {
      return lastPath
    }
    // 3. 預設跳到首頁
    return '/'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await validateLogin(username, password)

      if (result.success) {
        // 登入成功
        const redirectPath = getRedirectPath()
        router.push(redirectPath)
      } else {
        // 登入失敗
        setError(result.message || '帳號或密碼錯誤')
      }
    } catch (error) {
      setError('系統錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-morandi-light via-white to-morandi-container/20">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        {/* Logo 區域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-morandi-gold rounded-full mb-4">
            <User size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-morandi-primary">Venturo 系統登入</h2>
          <p className="text-sm text-morandi-secondary mt-2">請輸入您的員工帳號</p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-500 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* 登入表單 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              員工編號
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
                placeholder="例：admin 或 john01"
                required
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

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

          <Button
            type="submit"
            className="w-full bg-morandi-gold hover:bg-morandi-gold-hover"
            disabled={isLoading}
          >
            {isLoading ? '登入中...' : '登入'}
          </Button>
        </form>
      </div>
    </div>
  )
}
