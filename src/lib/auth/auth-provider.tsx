'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // 檢查是否有已登入的 session
    const savedAuth = localStorage.getItem('auth-token');
    if (savedAuth) {
      // 驗證 token
      validateToken(savedAuth);
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('auth-token', data.token);
      } else {
        throw new Error('登入失敗');
      }
    } catch (error) {
      logger.error('Login error', error);
      throw error;
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-token');
    router.push('/login');
  };
  
  const validateToken = async (token: string) => {
    // 驗證 token 的邏輯
    try {
      // 這裡可以加入 JWT 驗證或 API 呼叫
      // 暫時簡單處理
      setIsLoading(false);
    } catch (error) {
      logger.error('Token validation error', error);
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// 保護路由的 HOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      // 真實驗證 - 沒有登入就導向登入頁
      if (!isLoading && !user) {
        router.push('/login');
      }
      
      if (user && requiredRole && user.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }, [user, isLoading, router]);
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    // 只有已登入才顯示組件
    if (user) {
      return <Component {...props} />;
    }
    
    return null;
  };
}
