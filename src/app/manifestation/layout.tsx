import { ReactNode } from 'react';

export default function ManifestationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
