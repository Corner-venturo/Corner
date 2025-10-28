interface TourGalleryOverlayProps {
  showGallery: boolean;
  focusCards: any[];
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  onClose: () => void;
}

export function TourGalleryOverlay({
  showGallery,
  focusCards,
  currentImageIndex,
  setCurrentImageIndex,
  onClose,
}: TourGalleryOverlayProps) {
  if (!showGallery) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100] animate-fadeIn flex flex-col">
      {/* 頂部關閉按鈕 */}
      <div className="flex-shrink-0 p-4 pt-safe">
        <button
          onClick={onClose}
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
  );
}
