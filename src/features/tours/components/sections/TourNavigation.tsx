import { IconHome } from "@tabler/icons-react";
import { FloatingDock } from "@/components/ui/floating-dock";

interface TourNavigationProps {
  data: any;
  scrollOpacity: number;
  isPreview: boolean;
  viewMode: 'desktop' | 'mobile';
}

export function TourNavigation({ data, scrollOpacity, isPreview, viewMode }: TourNavigationProps) {
  const navLinks = data.navLinks || [
    { title: "首頁", icon: IconHome, href: "#top" },
  ];

  return (
    <>
      {/* 置頂導航列 - 桌面版或非預覽模式才顯示 */}
      {(!isPreview || viewMode === 'desktop') && (
        <nav
          className="fixed left-0 right-0 z-40 transition-all duration-300 hidden md:block"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${scrollOpacity * 0.9})`,
            backdropFilter: scrollOpacity > 0.1 ? 'blur(12px)' : 'none',
            boxShadow: scrollOpacity > 0.5 ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div
                className="text-xl font-bold transition-colors duration-300"
                style={{
                  color: scrollOpacity > 0.5 ? 'rgb(var(--morandi-primary))' : 'white'
                }}
              >
                Corner Travel
              </div>
              <div className="flex items-center gap-8">
                {navLinks.map((link: any) => {
                  const IconComponent = link.icon || IconHome;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 transition-colors"
                      style={{
                        color: scrollOpacity > 0.5
                          ? 'rgb(var(--morandi-secondary))'
                          : 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{link.title}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* 手機版底部導航 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <FloatingDock
          items={navLinks.map((link: any) => ({
            title: link.title,
            icon: <link.icon className="w-5 h-5" />,
            href: link.href,
          }))}
          mobileClassName="block md:hidden"
        />
      </div>
    </>
  );
}
