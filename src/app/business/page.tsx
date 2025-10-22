'use client';

import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Briefcase } from 'lucide-react';

export default function BusinessPage() {
  return (
    <div className="flex flex-col h-screen">
      <ResponsiveHeader title="業務專區" />
      <ContentContainer>
        <div className="flex flex-col items-center justify-center h-full">
          <Briefcase size={48} className="text-morandi-secondary mb-4" />
          <h2 className="text-2xl font-bold text-morandi-primary mb-2">業務專區</h2>
          <p className="text-morandi-secondary">這裡是業務專區，可以放置業務相關的功能</p>
        </div>
      </ContentContainer>
    </div>
  );
}
