"use client";

import { useState, useEffect, useRef } from "react";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { FocusCards } from "@/components/ui/focus-cards";
import { FloatingDock } from "@/components/ui/floating-dock";
import { motion } from "framer-motion";
import {
  IconHome,
  IconCalendar,
  IconMapPin,
  IconPhone,
  IconPlane,
  IconSparkles,
} from "@tabler/icons-react";

export default function TourPage({ data, isPreview = false, viewMode = 'desktop' }: { data: unknown; isPreview?: boolean; viewMode?: 'desktop' | 'mobile' }) {
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const [attractionsProgress, setAttractionsProgress] = useState(0); // 0-1 之間的進度值
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const galleryRef = useRef<HTMLElement>(null);

  // 監聽父容器的滾動事件
  useEffect(() => {
    let scrollContainer: HTMLElement | null = null;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;

      // 在 0-150px 之間平滑過渡，0 = 完全透明，150 = 完全不透明
      const opacity = Math.min(scrollTop / 150, 1);
      setScrollOpacity(opacity);
    };

    // 找到最近的可滾動父元素
    const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null;

      const parent = element.parentElement;
      if (!parent) return null;

      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }

      return findScrollableParent(parent);
    };

    // 延遲一下確保 DOM 已經渲染
    const timer = setTimeout(() => {
      const topElement = document.getElementById('top');
      if (topElement) {
        scrollContainer = findScrollableParent(topElement);
        if (scrollContainer) {
          scrollContainer.addEventListener('scroll', handleScroll);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // 監聽精選景點區塊的滾動進度（手機版）
  useEffect(() => {
    if (viewMode !== 'mobile') return;

    // 預覽模式：自動漸進到 1
    if (isPreview) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.02; // 每次增加 2%
        if (progress >= 1) {
          progress = 1;
          clearInterval(interval);
        }
        setAttractionsProgress(progress);
      }, 50); // 每 50ms 更新一次，總共約 2.5 秒完成

      return () => clearInterval(interval);
    }

    // 實際頁面：基於滾動位置計算進度
    let scrollContainer: HTMLElement | null = null;

    const handleScroll = () => {
      const attractionsElement = document.getElementById('attractions');
      if (!attractionsElement || !scrollContainer) return;

      const rect = attractionsElement.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();

      // 計算區塊頂部相對於視窗頂部的位置
      const elementTop = rect.top - containerRect.top;
      const viewportHeight = containerRect.height;

      // 定義動畫觸發範圍：
      // startPoint: 區塊頂部在視窗底部 80% 位置（還沒完全進入）
      // endPoint: 區塊頂部在視窗頂部 20% 位置（已經進入並佔據大部分畫面）
      const startPoint = viewportHeight * 0.8; // 在視窗底部 80% 處開始
      const endPoint = viewportHeight * 0.2;    // 在視窗頂部 20% 處結束

      // 計算進度（0 到 1）
      // 當 elementTop > startPoint 時，progress = 0（區塊還在下方，保持白色）
      // 當 elementTop < endPoint 時，progress = 1（區塊已經上來，完全黑色）
      const rawProgress = (startPoint - elementTop) / (startPoint - endPoint);
      const progress = Math.max(0, Math.min(1, rawProgress));

      setAttractionsProgress(progress);
    };

    // 找到滾動容器
    const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null;
      const parent = element.parentElement;
      if (!parent) return null;
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      return findScrollableParent(parent);
    };

    const timer = setTimeout(() => {
      const attractionsElement = document.getElementById('attractions');
      if (attractionsElement) {
        scrollContainer = findScrollableParent(attractionsElement);
        if (scrollContainer) {
          scrollContainer.addEventListener('scroll', handleScroll);
          handleScroll(); // 初始計算一次
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [viewMode, isPreview]);

  // 檢測精選景點區塊是否進入視窗（觸發全屏相簿）
  useEffect(() => {
    if (viewMode !== 'mobile') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            setShowGallery(true);
            document.body.style.overflow = 'hidden';
          }
        });
      },
      { threshold: 0.7 }
    );

    if (galleryRef.current) {
      observer.observe(galleryRef.current);
    }

    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, [viewMode]);

  // 導航項目
  const navLinks = data.navLinks || [
    { title: "首頁", icon: IconHome, href: "#top" },
    { title: "航班", icon: IconPlane, href: "#flight" },
    { title: "景點", icon: IconMapPin, href: "#attractions" },
    { title: "行程", icon: IconCalendar, href: "#itinerary" },
    { title: "聯絡", icon: IconPhone, href: "#contact" },
  ];

  // 精選景點資料
  const focusCards = data.focusCards || [];

  // 行程特色資料
  const features = data.features || [];

  return (
    <div className={viewMode === 'mobile' ? 'min-h-screen bg-gray-50' : 'min-h-screen bg-white'}>
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

      {/* 全螢幕美化封面 */}
      <section id="top" className="relative h-screen overflow-hidden bg-slate-900">
        {/* 動態背景 */}
        <div className="absolute inset-0">
          <img
            src={data.coverImage || "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=75&auto=format&fit=crop"}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{
              filter: "brightness(0.7)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />
        </div>

        {/* 主要內容 */}
        <div className={viewMode === 'mobile' ? 'relative z-10 h-full flex flex-col items-center justify-center px-4' : 'relative z-10 h-full flex flex-col items-center justify-center px-4'}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className={viewMode === 'mobile' ? 'text-center mb-40' : 'text-center mb-16'}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={viewMode === 'mobile' ? 'inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs font-medium mb-8' : 'inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs sm:text-sm font-medium mb-4'}
            >
              {data.tagline || "Venturo Travel 2025 秋季精選"}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className={viewMode === 'mobile' ? 'text-2xl font-bold text-white mb-4' : 'text-4xl md:text-6xl lg:text-8xl font-bold text-white mb-4'}
            >
              {data.title}
              <br />
              <span className={viewMode === 'mobile' ? 'text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500' : 'text-2xl md:text-4xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500'}>
                {data.subtitle}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={viewMode === 'mobile' ? 'text-xs text-white/80 max-w-3xl mx-auto mb-8 px-4' : 'text-base md:text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto mb-8 px-4'}
            >
              {data.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap justify-center gap-4 sm:gap-6 px-4"
            >
              <div className={viewMode === 'mobile' ? 'bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-center' : 'bg-white/10 backdrop-blur-md border border-white/20 px-6 sm:px-8 py-4 rounded-full text-center'}>
                <div className={viewMode === 'mobile' ? 'text-xs text-white/70' : 'text-xs sm:text-sm text-white/70'}>出發日期</div>
                <div className={viewMode === 'mobile' ? 'font-bold text-sm text-white' : 'font-bold text-base sm:text-xl text-white'}>{data.departureDate}</div>
              </div>
              <div className={viewMode === 'mobile' ? 'bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-center' : 'bg-white/10 backdrop-blur-md border border-white/20 px-6 sm:px-8 py-4 rounded-full text-center'}>
                <div className={viewMode === 'mobile' ? 'text-xs text-white/70' : 'text-xs sm:text-sm text-white/70'}>行程代碼</div>
                <div className={viewMode === 'mobile' ? 'font-bold text-sm text-white' : 'font-bold text-base sm:text-xl text-white'}>{data.tourCode}</div>
              </div>
            </motion.div>
          </motion.div>

          {/* 滾動提示 */}
          <motion.div
            className="text-white/80 text-center"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className={viewMode === 'mobile' ? 'text-sm mb-2 font-medium' : 'text-sm mb-2'}>探索行程</p>
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* 分隔線 */}
      <div className="border-t border-border"></div>

      {/* 航班資訊 */}
      <section id="flight" className={viewMode === 'mobile' ? 'pt-4 pb-8 bg-white' : 'pt-8 pb-16 bg-white'}>
        <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <div className={viewMode === 'mobile' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'}>
            {/* 去程航班 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-6 border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <IconPlane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-morandi-secondary">去程航班</div>
                  <div className="text-xl font-bold text-morandi-primary">
                    {data.outboundFlight?.airline || "中華航空"} {data.outboundFlight?.flightNumber || "CI110"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-morandi-secondary mb-1">出發</div>
                    <div className="text-2xl font-bold text-morandi-primary">
                      {data.outboundFlight?.departureAirport || "TPE"}
                    </div>
                    <div className="text-base text-blue-600 font-semibold">
                      {data.outboundFlight?.departureTime || "06:50"}
                    </div>
                    <div className="text-xs text-morandi-secondary mt-0.5">
                      {data.outboundFlight?.departureDate || "10/21"}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center px-3">
                    <div className="text-xs text-morandi-secondary mb-3">飛行時間</div>
                    <div className="w-full border-t-2 border-dashed border-border relative my-2">
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-blue-100 px-1.5 py-0.5 rounded-full">
                        <IconPlane className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-morandi-primary mt-3">
                      {data.outboundFlight?.duration || "2小時5分"}
                    </div>
                  </div>

                  <div className="flex-1 text-right">
                    <div className="text-xs text-morandi-secondary mb-1">抵達</div>
                    <div className="text-2xl font-bold text-morandi-primary">
                      {data.outboundFlight?.arrivalAirport || "FUK"}
                    </div>
                    <div className="text-base text-blue-600 font-semibold">
                      {data.outboundFlight?.arrivalTime || "09:55"}
                    </div>
                    <div className="text-xs text-morandi-secondary mt-0.5">
                      當地時間
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 回程航班 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6 border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <IconPlane className="w-6 h-6 text-white rotate-180" />
                </div>
                <div>
                  <div className="text-xs text-morandi-secondary">回程航班</div>
                  <div className="text-xl font-bold text-morandi-primary">
                    {data.returnFlight?.airline || "中華航空"} {data.returnFlight?.flightNumber || "CI111"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-morandi-secondary mb-1">出發</div>
                    <div className="text-2xl font-bold text-morandi-primary">
                      {data.returnFlight?.departureAirport || "FUK"}
                    </div>
                    <div className="text-base text-indigo-600 font-semibold">
                      {data.returnFlight?.departureTime || "11:00"}
                    </div>
                    <div className="text-xs text-morandi-secondary mt-0.5">
                      {data.returnFlight?.departureDate || "10/25"}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center px-3">
                    <div className="text-xs text-morandi-secondary mb-3">飛行時間</div>
                    <div className="w-full border-t-2 border-dashed border-border relative my-2">
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                        <IconPlane className="w-3 h-3 text-indigo-600 rotate-180" />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-morandi-primary mt-3">
                      {data.returnFlight?.duration || "2小時30分"}
                    </div>
                  </div>

                  <div className="flex-1 text-right">
                    <div className="text-xs text-morandi-secondary mb-1">抵達</div>
                    <div className="text-2xl font-bold text-morandi-primary">
                      {data.returnFlight?.arrivalAirport || "TPE"}
                    </div>
                    <div className="text-base text-indigo-600 font-semibold">
                      {data.returnFlight?.arrivalTime || "12:30"}
                    </div>
                    <div className="text-xs text-morandi-secondary mt-0.5">
                      台灣時間
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 分隔線 */}
      <div className="border-t border-border"></div>

      {/* 行程特色 */}
      <section className={viewMode === 'mobile' ? 'pt-4 pb-8 bg-white' : 'pt-8 pb-16 bg-white'}>
        <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={viewMode === 'mobile' ? 'text-center mb-6' : 'text-center mb-8'}
          >
            <h2 className={viewMode === 'mobile' ? 'text-2xl font-bold text-morandi-primary' : 'text-4xl font-bold text-morandi-primary'}>
              行程特色
            </h2>
          </motion.div>

          {/* 優化版特色卡片 */}
          <div className={viewMode === 'mobile' ? 'space-y-4' : 'grid grid-cols-2 md:grid-cols-3 gap-6'}>
            {features.map((feature: any, index: number) => {
              const FeatureIcon = feature.iconComponent || IconSparkles;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative"
                >
                  {/* 背景光暈效果 */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />

                  {/* 卡片內容 */}
                  <div className={viewMode === 'mobile' ? 'relative bg-white rounded-2xl p-4 h-full flex items-center gap-4' : 'relative bg-white rounded-2xl p-6 h-full'}>
                    {/* 圖標 */}
                    <div className={viewMode === 'mobile' ? 'w-12 h-12 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0' : 'w-14 h-14 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl flex items-center justify-center mb-4'}>
                      <FeatureIcon className={viewMode === 'mobile' ? 'w-6 h-6 text-amber-600' : 'w-7 h-7 text-amber-600'} />
                    </div>

                    {/* 文字 */}
                    <div className={viewMode === 'mobile' ? 'flex-1 min-w-0' : ''}>
                      <h3 className={viewMode === 'mobile' ? 'font-bold text-base mb-1 text-morandi-primary' : 'font-bold text-lg mb-2 text-morandi-primary'}>{feature.title}</h3>
                      <p className="text-sm text-morandi-secondary">
                        {feature.description}
                      </p>
                    </div>

                    {/* Hover 時顯示的裝飾 */}
                    {viewMode !== 'mobile' && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                        <IconSparkles className="w-4 h-4 text-amber-500" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 分隔線 */}
      {viewMode !== 'mobile' && <div className="border-t border-border"></div>}

      {/* 精選景點展示 */}
      <section
        ref={galleryRef}
        id="attractions"
        className={viewMode === 'mobile'
          ? 'min-h-screen flex flex-col items-center justify-center py-12'
          : 'pt-8 pb-16 bg-white'}
        style={viewMode === 'mobile' ? {
          backgroundColor: `rgb(${Math.round(255 * (1 - attractionsProgress))}, ${Math.round(255 * (1 - attractionsProgress))}, ${Math.round(255 * (1 - attractionsProgress))})`,
          transition: 'background-color 0.3s ease-out',
        } : {}}
      >
        <div className={viewMode === 'mobile' ? 'px-4 w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={viewMode === 'mobile' ? 'text-center mb-8' : 'text-center mb-8'}
            style={viewMode === 'mobile' ? {
              color: `rgb(${Math.round(255 * attractionsProgress)}, ${Math.round(255 * attractionsProgress)}, ${Math.round(255 * attractionsProgress)})`,
              transition: 'color 0.3s ease-out',
            } : {}}
          >
            <h2 className={viewMode === 'mobile' ? 'text-2xl font-bold' : 'text-4xl font-bold text-morandi-primary'}>
              精選景點
            </h2>
          </motion.div>
          <motion.div
            initial={viewMode === 'mobile' ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            style={viewMode === 'mobile' ? {
              transform: `scale(${0.8 + 0.2 * attractionsProgress})`,
              transition: 'transform 0.3s ease-out',
            } : {}}
          >
            <FocusCards cards={focusCards} viewMode={viewMode} />
          </motion.div>
        </div>
      </section>

      {/* 分隔線 */}
      {viewMode !== 'mobile' && <div className="border-t border-border"></div>}

      {/* Itinerary Section */}
      <section id="itinerary" className={viewMode === 'mobile' ? 'bg-white pt-4 pb-8' : 'bg-white pt-8 pb-16'}>
        <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={viewMode === 'mobile' ? 'text-2xl font-bold text-morandi-primary mb-4' : 'text-4xl font-bold text-morandi-primary mb-4'}>
              詳細行程
            </h2>
            <p className="text-xl text-morandi-secondary">
              {data.itinerarySubtitle || "精彩旅程規劃"}
            </p>
          </motion.div>

          {/* Main Timeline */}
          <div className="max-w-4xl mx-auto">
            <TracingBeam>
              <div className="space-y-8">
                {data.dailyItinerary?.map((day: any, index: number) => (
                    <div key={index} className="bg-white rounded-2xl shadow-lg p-8 border border-border">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                          {day.dayLabel}
                        </span>
                        <span className="text-morandi-secondary">{day.date}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-morandi-primary mb-4">
                        {day.title}
                      </h3>

                      {day.highlight && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-blue-800 font-medium">
                            {day.highlight}
                          </p>
                        </div>
                      )}

                      {day.description && (
                        <p className="text-morandi-secondary mb-6">
                          {day.description}
                        </p>
                      )}

                      {day.activities && day.activities.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {day.activities.map((activity: any, actIndex: number) => (
                            <div key={actIndex} className="border border-border rounded-lg p-4">
                              <h4 className="font-bold text-morandi-primary mb-2">{activity.icon} {activity.title}</h4>
                              <p className="text-sm text-morandi-secondary">{activity.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {day.recommendations && day.recommendations.length > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
                          <h4 className="font-bold text-green-900 mb-3">
                            🎉 推薦行程
                          </h4>
                          <ul className="space-y-2 text-green-800">
                            {day.recommendations.map((rec: string, recIndex: number) => (
                              <li key={recIndex} className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-morandi-container/20 rounded-lg p-4">
                          <p className="text-sm text-morandi-secondary mb-1">早餐</p>
                          <p className="font-medium text-morandi-primary">{day.meals?.breakfast || "敬請自理"}</p>
                        </div>
                        <div className="bg-morandi-container/20 rounded-lg p-4">
                          <p className="text-sm text-morandi-secondary mb-1">午餐</p>
                          <p className="font-medium text-morandi-primary">{day.meals?.lunch || "敬請自理"}</p>
                        </div>
                        <div className="bg-morandi-container/20 rounded-lg p-4">
                          <p className="text-sm text-morandi-secondary mb-1">晚餐</p>
                          <p className="font-medium text-morandi-primary">{day.meals?.dinner || "敬請自理"}</p>
                        </div>
                      </div>

                      {day.accommodation && (
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <p className="text-sm text-amber-800">
                            🏨 住宿：{day.accommodation}
                          </p>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </TracingBeam>
          </div>
        </div>
      </section>

      {/* 分隔線 */}
      <div className="border-t border-border"></div>

      {/* 領隊與集合資訊 */}
      <section className="bg-white pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={viewMode === 'mobile' ? 'text-2xl font-bold text-morandi-primary mb-4' : 'text-4xl font-bold text-morandi-primary mb-4'}>
              領隊與集合資訊
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 領隊資訊 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8 border border-border"
            >
              <h3 className="text-2xl font-bold text-morandi-primary mb-6 flex items-center gap-3">
                <span className="text-3xl">👤</span>
                領隊資訊
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">領隊姓名</p>
                  <p className="text-lg font-semibold text-morandi-primary">{data.leader?.name || "待定"}</p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">國內電話</p>
                  <p className="text-lg font-semibold text-morandi-primary">{data.leader?.domesticPhone || "待定"}</p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">國外電話</p>
                  <p className="text-lg font-semibold text-morandi-primary">{data.leader?.overseasPhone || "待定"}</p>
                </div>
              </div>
            </motion.div>

            {/* 集合資訊 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8 border border-border"
            >
              <h3 className="text-2xl font-bold text-morandi-primary mb-6 flex items-center gap-3">
                <span className="text-3xl">📍</span>
                集合資訊
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">集合時間</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {data.meetingInfo?.time || "待定"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">集合地點</p>
                  <p className="text-lg font-semibold text-morandi-primary">
                    {data.meetingInfo?.location || "待定"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 分隔線 */}
      <div className="border-t border-border"></div>

      {/* Contact Section */}
      <section id="contact" className={viewMode === 'mobile' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 py-12' : 'bg-gradient-to-br from-blue-600 to-indigo-600 py-20'}>
        <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={viewMode === 'mobile' ? 'text-2xl font-bold text-white mb-4' : 'text-4xl font-bold text-white mb-4'}>
              聯絡我們
            </h2>
            <p className="text-xl text-blue-100">
              有任何問題歡迎隨時聯繫
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
            >
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold text-white mb-2">領隊</h3>
              <p className="text-blue-100">{data.leader?.name || "待定"}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
            >
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-white mb-2">國內電話</h3>
              <p className="text-blue-100">{data.leader?.domesticPhone || "待定"}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
            >
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-xl font-bold text-white mb-2">國外電話</h3>
              <p className="text-blue-100">{data.leader?.overseasPhone || "待定"}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Corner Travel</h3>
            <p className="text-slate-300 mb-8">探索世界，創造回憶</p>
            <p className="text-slate-400 text-sm">
              © 2025 Corner Travel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

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

      {/* 全屏相簿覆蓋層 */}
      {showGallery && viewMode === 'mobile' && (
        <div className="fixed inset-0 bg-black z-[100] animate-fadeIn flex flex-col">
          {/* 頂部關閉按鈕 */}
          <div className="flex-shrink-0 p-4 pt-safe">
            <button
              onClick={() => {
                setShowGallery(false);
                document.body.style.overflow = '';
              }}
              className="text-white/80 text-lg font-medium hover:text-white transition-colors"
            >
              ✕ 關閉
            </button>
          </div>

          {/* 圖片容器 - 佔據剩餘空間 */}
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-4 pb-16">
            <div
              className="w-full h-full overflow-x-auto snap-x snap-mandatory flex hide-scrollbar"
              style={{ scrollSnapType: 'x mandatory' }}
              onScroll={(e) => {
                const container = e.currentTarget;
                const scrollLeft = container.scrollLeft;
                const cardWidth = container.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);
                setCurrentImageIndex(index);
              }}
            >
              {focusCards.map((card: any, index: number) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 snap-center flex flex-col items-center justify-center gap-4 px-2"
                >
                  <img
                    src={card.src}
                    alt={card.title}
                    className="max-w-full max-h-[50vh] object-contain rounded-xl"
                  />
                  <h3 className="text-white text-center text-xl font-medium">
                    {card.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>

          {/* 底部指示器 - 固定在底部 */}
          <div className="flex-shrink-0 pb-8 pb-safe">
            <div className="flex justify-center gap-2">
              {focusCards.map((_: any, index: number) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentImageIndex === index
                      ? 'bg-white w-8'
                      : 'bg-white/40 w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
