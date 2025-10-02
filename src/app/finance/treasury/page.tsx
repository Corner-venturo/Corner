'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TreasuryPage() {
  const router = useRouter();

  useEffect(() => {
    // 直接導向出納單管理頁面
    router.replace('/finance/treasury/disbursement');
  }, [router]);

  return null;
}