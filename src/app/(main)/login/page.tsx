'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { User, Lock, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// localStorage key for remembering workspace selection
const LAST_WORKSPACE_KEY = 'venturo-last-workspace'

interface Workspace {
  id: string
  name: string
  code: string
}

export default function LoginPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true) // 預設勾選記住我
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { validateLogin } = useAuthStore()

  // 載入 workspaces 列表
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data, error } = await supabase
          .from('workspaces')
          .select('id, name, code')
          .order('name')

        if (error) throw error

        setWorkspaces(data || [])

        // 讀取上次選擇的 workspace
        const lastWorkspace = localStorage.getItem(LAST_WORKSPACE_KEY)
        if (lastWorkspace && data?.some(w => w.id === lastWorkspace)) {
          setSelectedWorkspace(lastWorkspace)
        } else if (data && data.length > 0) {
          // 預設選第一個
          setSelectedWorkspace(data[0].id)
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err)
      } finally {
        setIsLoadingWorkspaces(false)
      }
    }

    loadWorkspaces()
  }, [])

  // 當選擇改變時，儲存到 localStorage
  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId)
    localStorage.setItem(LAST_WORKSPACE_KEY, workspaceId)
  }

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

    if (!selectedWorkspace) {
      setError('請選擇辦公室')
      return
    }

    setIsLoading(true)

    try {
      const result = await validateLogin(username, password, selectedWorkspace, rememberMe)

      if (result.success) {
        // 登入成功，記住選擇的 workspace
        localStorage.setItem(LAST_WORKSPACE_KEY, selectedWorkspace)
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

  const selectedWorkspaceName = workspaces.find(w => w.id === selectedWorkspace)?.name || ''

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-morandi-light via-white to-morandi-container/20">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        {/* Logo 區域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-morandi-gold rounded-full mb-4">
            <User size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-morandi-primary">Venturo 系統登入</h2>
          <p className="text-sm text-morandi-secondary mt-2">請選擇辦公室並輸入員工帳號</p>
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
          {/* 辦公室選擇 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              辦公室
            </label>
            <Select
              value={selectedWorkspace}
              onValueChange={handleWorkspaceChange}
              disabled={isLoadingWorkspaces}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-morandi-secondary" />
                  <SelectValue placeholder={isLoadingWorkspaces ? '載入中...' : '選擇辦公室'} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {workspaces.map(workspace => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 員工編號 */}
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
                placeholder="例：E001"
                required
                autoComplete="username"
                autoFocus
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
              className="w-4 h-4 rounded border-gray-300 text-morandi-gold focus:ring-morandi-gold cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-morandi-secondary cursor-pointer select-none">
              記住我（30 天內免重新登入）
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-morandi-gold hover:bg-morandi-gold-hover"
            disabled={isLoading || isLoadingWorkspaces || !selectedWorkspace}
          >
            {isLoading ? '登入中...' : '登入'}
          </Button>
        </form>
      </div>
    </div>
  )
}
