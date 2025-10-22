"use client";

import { useState } from "react";
import { useItineraryStore } from "@/stores";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export function PublishButton({ data }: { data: any }) {
  const [saving, setSaving] = useState(false);
  const { create, update } = useItineraryStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const saveItinerary = async () => {
    setSaving(true);

    try {
      console.log('🔍 準備存檔的原始資料:', data);

      // 清理資料：移除 React 組件（iconComponent）避免序列化錯誤
      const cleanedData = {
        ...data,
        features: data.features?.map(({ iconComponent, ...rest }: any) => rest),
      };

      console.log('🧹 清理後的資料:', cleanedData);

      // 如果有 ID 就更新，沒有就新增
      if (data.id) {
        await update(data.id, cleanedData);
        alert('✅ 更新行程表成功！');
      } else {
        const newItinerary = await create(cleanedData);
        alert('✅ 儲存行程表成功！');
        // 新增後跳轉到編輯頁面
        if (newItinerary && newItinerary.id) {
          router.replace(`/itinerary/${newItinerary.id}`);
        }
      }
    } catch (error) {
      console.error('儲存失敗:', error);
      alert('❌ 儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const isEditMode = !!data.id;

  return (
    <button
      onClick={saveItinerary}
      disabled={saving}
      className="px-4 py-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
    >
      {saving ? "儲存中..." : isEditMode ? "💾 更新行程表" : "💾 存檔行程表"}
    </button>
  );
}
