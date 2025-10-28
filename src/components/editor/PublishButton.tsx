"use client";

import { useState } from "react";
import { useItineraryStore } from "@/stores";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export function PublishButton({ data }: { data: any }) {
  const [saving, setSaving] = useState(false);
  const { create, update } = useItineraryStore();
  const { _user } = useAuthStore();
  const router = useRouter();

  const saveItinerary = async () => {
    setSaving(true);

    try {

      // 清理資料：移除 React 組件（iconComponent）避免序列化錯誤
      const cleanedData = {
        ...data,
        features: data.features?.map(({ iconComponent, ...rest }: any) => rest),
      };


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
            alert('❌ 儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const isEditMode = !!data.id;

  // 產生分享連結
  const generateShareLink = () => {
    if (!data.id) {
      alert('⚠️ 請先儲存行程表才能產生連結！');
      return;
    }

    // 使用當前網站的網址（會自動適配 localhost / Vercel 等環境）
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/view/${data.id}`;

    // 複製到剪貼簿
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('✅ 分享連結已複製！\n\n' + shareUrl);
    }).catch(err => {
            alert('❌ 複製失敗，請手動複製：\n' + shareUrl);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={saveItinerary}
        disabled={saving}
        className="px-4 py-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {saving ? "儲存中..." : isEditMode ? "💾 更新行程表" : "💾 存檔行程表"}
      </button>

      {isEditMode && (
        <button
          onClick={generateShareLink}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          🔗 產生連結
        </button>
      )}
    </div>
  );
}
