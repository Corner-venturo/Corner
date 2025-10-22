'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLocalAuthStore } from '@/lib/auth/local-auth-manager';
import { User, Lock, AlertCircle, Eye, EyeOff, LogIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProfileCards, setShowProfileCards] = useState(true);
  const [profileCards, setProfileCards] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const router = useRouter();
  const { validateLogin, switchProfile } = useAuthStore();
  const localAuthStore = useLocalAuthStore();

  // 在 client 端載入角色卡
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cards = localAuthStore.getProfileCards();
      setProfileCards(cards);
    }
  }, [localAuthStore]);
  
  // 取得登入後要跳轉的頁面
  const getRedirectPath = (): string => {
    // 從 localStorage 讀取最後訪問的頁面
    const lastPath = localStorage.getItem('last-visited-path');
    // 排除登入頁面
    if (lastPath && lastPath !== '/login') {
      return lastPath;
    }
    // 預設跳到首頁
    return '/';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await validateLogin(username, password);

      if (result.success) {
        // 登入成功
        console.log('✅ 登入成功');
        const redirectPath = getRedirectPath();
        router.push(redirectPath);
      } else {
        // 登入失敗
        setError(result.message || '帳號或密碼錯誤');
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      setError('系統錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 角色卡點擊 - 直接登入（已經驗證過了）
  const handleProfileCardClick = async (profileId: string) => {
    const profile = localAuthStore.profiles.find(p => p.id === profileId);
    if (!profile) return;

    setError('');
    setIsLoading(true);

    try {
      // 直接切換角色（使用 switchProfile）
      const success = switchProfile(profileId);

      if (success) {
        console.log('✅ 角色卡快速登入成功');
        const redirectPath = getRedirectPath();
        router.push(redirectPath);
      } else {
        setError('切換角色失敗，請使用密碼登入');
        setShowProfileCards(false);
      }
    } catch (error) {
      console.error('快速登入錯誤:', error);
      setError('快速登入失敗，請使用密碼登入');
      setShowProfileCards(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 刪除角色卡
  const handleDeleteProfile = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation(); // 防止觸發登入

    const profile = localAuthStore.profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (confirm(`確定要移除「${profile.display_name}」的角色卡嗎？\n\n移除後需要重新從網路登入。`)) {
      localAuthStore.removeProfile(profileId);
      // 重新載入角色卡列表
      const cards = localAuthStore.getProfileCards();
      setProfileCards(cards);
      console.log('🗑️ 角色卡已刪除:', profile.display_name);
    }
  };


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
        
        {/* 角色卡區域 */}
        {showProfileCards && profileCards.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-morandi-secondary mb-3">選擇角色快速登入：</p>
            <div className="space-y-2">
              {profileCards.map((card) => (
                <div key={card.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleProfileCardClick(card.id)}
                    className="w-full p-3 rounded-lg border border-gray-200 hover:border-morandi-gold hover:bg-morandi-light/20 transition-all flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-morandi-gold/10 flex items-center justify-center group-hover:bg-morandi-gold/20">
                      <User size={20} className="text-morandi-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-morandi-primary">{card.display_name}</div>
                      <div className="text-xs text-morandi-secondary">{card.english_name} · {card.role}</div>
                    </div>
                    <LogIn size={18} className="text-morandi-secondary group-hover:text-morandi-gold" />
                  </button>

                  {/* 刪除按鈕 - 右上角 */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteProfile(e, card.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    title="移除角色卡"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowProfileCards(false)}
                className="text-sm text-morandi-secondary hover:text-morandi-primary"
              >
                使用其他帳號登入 →
              </button>
            </div>
          </div>
        )}


        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-500 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* 登入表單 */}
        {(!showProfileCards || profileCards.length === 0) && (
          <>
            {/* 顯示選中的角色 */}
            {selectedProfile && (
              <div className="mb-6 p-4 rounded-lg bg-morandi-light/30 border border-morandi-gold/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-morandi-gold/20 flex items-center justify-center">
                    <User size={24} className="text-morandi-gold" />
                  </div>
                  <div>
                    <div className="font-semibold text-morandi-primary">{selectedProfile.display_name}</div>
                    <div className="text-sm text-morandi-secondary">{selectedProfile.english_name} · {selectedProfile.role}</div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-2">
                  員工編號
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    placeholder="例：admin 或 john01"
                    required
                    autoComplete="username"
                    autoFocus={!selectedProfile}
                    readOnly={!!selectedProfile}
                  />
                </div>
              </div>
          
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              密碼
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            className="w-full bg-morandi-gold hover:bg-morandi-gold/90"
            disabled={isLoading}
          >
            {isLoading ? '登入中...' : '登入'}
          </Button>
        </form>
          </>
        )}

        {/* 返回角色卡選擇 */}
        {!showProfileCards && profileCards.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setShowProfileCards(true);
                setSelectedProfile(null);
                setUsername('');
                setPassword('');
                setError('');
              }}
              className="text-sm text-morandi-secondary hover:text-morandi-primary"
            >
              ← 返回角色選擇
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
