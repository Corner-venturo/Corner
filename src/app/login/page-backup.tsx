'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLocalAuthStore, LocalProfile } from '@/lib/auth/local-auth-manager';
import { OfflineAuthService } from '@/services/offline-auth.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Users, X } from 'lucide-react';

type LoginMode = 'card' | 'switch' | 'form';

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('card');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { validateLogin } = useAuthStore();
  const { profiles, getProfileCards, setCurrentProfile, removeProfile } = useLocalAuthStore();
  const router = useRouter();

  // 處理刪除角色卡
  const handleDeleteProfile = (e: React.MouseEvent, profileId: string, chineseName: string) => {
    e.stopPropagation(); // 防止觸發卡片點擊
    if (confirm(`確定要刪除 ${chineseName} 的角色卡嗎？\n\n刪除後需要重新登入才能建立新卡片。`)) {
      removeProfile(profileId);
      // 如果刪除後沒有卡片了，切換到登入表單
      if (profiles.length === 1) {
        setMode('form');
      }
    }
  };

  // 檢查是否有已儲存的 Profile
  useEffect(() => {
    if (profiles.length === 0) {
      // 沒有任何卡片，顯示登入表單
      setMode('form');
    } else if (profiles.length === 1) {
      // 只有一張卡片，顯示單卡模式
      setMode('card');
    } else {
      // 多張卡片，顯示單卡模式（預設第一張）
      setMode('card');
    }
  }, [profiles]);

  // 處理卡片登入（直接登入，不需要密碼）
  const handleCardLogin = async (profile: LocalProfile) => {
    setLoading(true);
    setError('');

    try {
      // 從資料庫重新載入最新的用戶資料
      const { supabase } = await import('@/lib/supabase/client');
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (fetchError || !userData) {
        console.error('載入用戶資料失敗:', fetchError);
        // 如果載入失敗，使用本地資料
        const user = {
          id: profile.id,
          employeeNumber: profile.employeeNumber,
          englishName: profile.englishName,
          chineseName: profile.chineseName,
          personalInfo: profile.personalInfo || {},
          jobInfo: profile.jobInfo || {},
          salaryInfo: profile.salaryInfo || {},
          permissions: profile.permissions || [],
          attendance: profile.attendance || { leaveRecords: [], overtimeRecords: [] },
          contracts: profile.contracts || [],
          status: profile.status
        };

        setCurrentProfile(profile);
        useAuthStore.getState().login(user);
      } else {
        // 使用資料庫最新資料
        const user = {
          id: userData.id,
          employeeNumber: userData.employee_number,
          englishName: userData.english_name,
          chineseName: userData.chinese_name,
          personalInfo: userData.personal_info || {},
          jobInfo: userData.job_info || {},
          salaryInfo: userData.salary_info || {},
          permissions: userData.permissions || [],
          attendance: userData.attendance || { leaveRecords: [], overtimeRecords: [] },
          contracts: userData.contracts || [],
          status: userData.status,
          avatar: userData.avatar
        };

        // 更新本地 profile 快取
        const updatedProfile = {
          ...profile,
          permissions: userData.permissions || [],
          personalInfo: userData.personal_info || {},
          jobInfo: userData.job_info || {},
          salaryInfo: userData.salary_info || {},
          lastLoginAt: new Date().toISOString()
        };

        setCurrentProfile(updatedProfile);
        useAuthStore.getState().login(user);
      }

      // 使用 setTimeout 給 persist 一點時間寫入
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (error) {
      console.error('卡片登入錯誤:', error);
      setError('登入失敗，請稍後再試');
      setLoading(false);
    }
  };

  // 處理表單登入（初次登入）
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await validateLogin(username, password);

      if (result.success) {
        window.location.href = '/';
      } else {
        setError(result.message || '登入失敗');
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      setError('系統錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 格式化最後登入時間
  const formatLastLogin = (lastLoginAt: string) => {
    const diff = Date.now() - new Date(lastLoginAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    return `${days} 天前`;
  };

  // ========== 單卡模式 ==========
  if (mode === 'card' && profiles.length > 0) {
    const currentCard = profiles[0]; // 預設顯示第一張卡片

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F6F4F1 0%, #E8E5E0 50%, #D4C4B0 100%)' }}>
        <div className="w-full max-w-md space-y-6">
          {/* Logo 區域 */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white/95 font-semibold text-2xl">V</span>
            </div>
            <h1 className="text-3xl font-bold text-morandi-primary">Venturo</h1>
            <p className="text-morandi-secondary font-medium">旅行社管理系統</p>
          </div>

          {/* 角色卡片 */}
          <Card className="p-6 space-y-4 morandi-card bg-card border-morandi-gold shadow-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {currentCard.chineseName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-morandi-primary">{currentCard.chineseName}</h2>
                  <p className="text-sm text-morandi-secondary">{currentCard.englishName}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-morandi-container space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-morandi-secondary">員工編號</span>
                  <span className="font-medium text-morandi-primary">{currentCard.employeeNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-morandi-secondary">上次登入</span>
                  <span className="font-medium text-morandi-primary">{formatLastLogin(currentCard.lastLoginAt)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleCardLogin(currentCard)}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] hover:from-[#c9b896] hover:via-[#bfad87] hover:to-[#b5a378] text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border-0 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  登入中...
                </div>
              ) : (
                '登入'
              )}
            </Button>

            {error && (
              <div className="bg-morandi-container border border-red-400 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
          </Card>

          {/* 切換使用者按鈕 */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setMode('switch')}
              className="text-morandi-secondary hover:text-morandi-primary hover:bg-white/80 transition-all"
            >
              <Users size={16} className="mr-2" />
              切換使用者
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ========== 切換模式（顯示所有卡片） ==========
  if (mode === 'switch') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F6F4F1 0%, #E8E5E0 50%, #D4C4B0 100%)' }}>
        <div className="w-full max-w-2xl space-y-6 p-6">
          {/* Logo 區域 */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] rounded-lg flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white/95 font-semibold text-2xl">V</span>
            </div>
            <h1 className="text-3xl font-bold text-morandi-primary">選擇使用者</h1>
          </div>

          {/* 所有卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                className="p-4 morandi-card bg-card border-morandi-gold shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:scale-105 relative"
                onClick={() => handleCardLogin(profile)}
              >
                {/* 刪除按鈕 */}
                <button
                  onClick={(e) => handleDeleteProfile(e, profile.id, profile.chineseName)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                  title="刪除角色卡"
                >
                  <X size={14} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] flex items-center justify-center text-white text-lg font-bold shadow-md">
                    {profile.chineseName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-morandi-primary">{profile.chineseName}</h3>
                    <p className="text-xs text-morandi-secondary">{profile.employeeNumber}</p>
                  </div>
                </div>
              </Card>
            ))}

            {/* 新增帳號卡片 */}
            <Card
              className="p-4 morandi-card bg-card border-2 border-dashed border-morandi-gold shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:scale-105"
              onClick={() => setMode('form')}
            >
              <div className="flex items-center justify-center gap-3 h-full">
                <div className="w-12 h-12 rounded-full border-2 border-morandi-gold flex items-center justify-center text-morandi-gold text-2xl font-bold">
                  +
                </div>
                <span className="font-medium text-morandi-secondary">新增其他帳號</span>
              </div>
            </Card>
          </div>

          {/* 返回按鈕 */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setMode('card')}
              className="text-morandi-secondary hover:text-morandi-primary hover:bg-white/80 transition-all"
            >
              ← 返回
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ========== 表單模式（初次登入或新增帳號） ==========
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F6F4F1 0%, #E8E5E0 50%, #D4C4B0 100%)' }}>
      <Card className="w-full max-w-md p-8 space-y-6 morandi-card bg-card border-morandi-gold shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] rounded-lg flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white/95 font-semibold text-2xl">V</span>
          </div>
          <h1 className="text-3xl font-bold text-morandi-primary">Venturo</h1>
          <p className="text-morandi-secondary font-medium">旅行社管理系統</p>
        </div>

        <form onSubmit={handleFormLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-morandi-primary mb-2">
                使用者名稱
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入使用者名稱"
                className="h-12 border-morandi-container focus:border-morandi-gold focus:ring-morandi-gold bg-background"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-morandi-primary mb-2">
                密碼
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="h-12 border-morandi-container focus:border-morandi-gold focus:ring-morandi-gold bg-background"
                disabled={loading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-morandi-container border border-red-400 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] hover:from-[#c9b896] hover:via-[#bfad87] hover:to-[#b5a378] text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                登入中...
              </div>
            ) : (
              '登入系統'
            )}
          </Button>
        </form>

        {/* 如果有其他卡片，顯示返回按鈕 */}
        {profiles.length > 0 && (
          <div className="text-center pt-4 border-t border-morandi-container">
            <Button
              variant="ghost"
              onClick={() => setMode('card')}
              className="text-morandi-secondary hover:text-morandi-primary hover:bg-white/80 transition-all"
            >
              ← 返回
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
