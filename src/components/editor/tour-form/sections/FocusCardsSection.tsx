import React from "react";
import { TourFormData, FocusCard } from "../types";

interface FocusCardsSectionProps {
  data: TourFormData;
  addFocusCard: () => void;
  updateFocusCard: (index: number, field: string, value: string) => void;
  removeFocusCard: (index: number) => void;
}

export function FocusCardsSection({
  data,
  addFocusCard,
  updateFocusCard,
  removeFocusCard
}: FocusCardsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b-2 border-green-500 pb-2">
        <h2 className="text-lg font-bold text-gray-800">📍 精選景點</h2>
        <button
          onClick={addFocusCard}
          className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
        >
          + 新增景點
        </button>
      </div>

      {data.focusCards?.map((card: FocusCard, index: number) => (
        <div key={index} className="p-4 border-2 border-green-200 rounded-lg space-y-3 bg-green-50">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-green-700">景點 {index + 1}</span>
            <button
              onClick={() => removeFocusCard(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              刪除
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">景點名稱</label>
            <input
              type="text"
              value={card.title}
              onChange={(e) => updateFocusCard(index, "title", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="由布院溫泉街"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">圖片網址</label>
            <input
              type="text"
              value={card.src}
              onChange={(e) => updateFocusCard(index, "src", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="https://images.unsplash.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">建議使用 16:9 高解析度圖片，營造一致的 Morandi 色調。</p>
          </div>
        </div>
      ))}
    </div>
  );
}
