'use client';

import { useEffect } from 'react';

export function ErrorLogger() {
  useEffect(() => {
    // 捕獲未處理的錯誤
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      const errorData = {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error?.toString(),
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      
      // 將錯誤寫入文件系統
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(console.error);
    };

    // 捕獲未處理的 Promise rejection
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      const errorData = {
        message: 'Unhandled Promise Rejection',
        error: event.reason?.stack || event.reason?.toString() || String(event.reason),
        timestamp: new Date().toISOString(),
        type: 'unhandledRejection'
      };
      
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(console.error);
    };

    // 捕獲 React Hydration 錯誤
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      
      const errorString = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (errorString.includes('Hydration') || 
          errorString.includes('Text content does not match') ||
          errorString.includes('did not match')) {
        const errorData = {
          message: 'Hydration Error',
          error: errorString,
          timestamp: new Date().toISOString(),
          type: 'hydration'
        };
        
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        }).catch(console.error);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}