"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TourPage from "@/components/TourPage";
import {
  IconBuilding,
  IconToolsKitchen2,
  IconSparkles,
  IconCalendar,
  IconPlane,
  IconMapPin,
} from "@tabler/icons-react";

// Icon mapping
const iconMap: any = {
  IconBuilding,
  IconToolsKitchen2,
  IconSparkles,
  IconCalendar,
  IconPlane,
  IconMapPin,
};

export default function ViewItineraryPage() {
  const params = useParams();
  const id = params.id as string;

  const [tourData, setTourData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入行程資料（使用 API route 來繞過 RLS）
  useEffect(() => {
    const loadItinerary = async () => {
      try {
        setLoading(true);
        setError(null);

        // 使用 API route 來取得行程資料（不需要認證）
        const response = await fetch(`/api/itineraries/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('找不到此行程');
          } else {
            setError('載入行程失敗');
          }
          setTourData(null);
          return;
        }

        const itinerary = await response.json();

        if (itinerary) {
          // Convert icon strings to components
          const processedData = {
            ...itinerary,
            features: itinerary.features?.map((f: any) => ({
              ...f,
              iconComponent: iconMap[f.icon] || IconSparkles,
            })) || [],
          };
          setTourData(processedData);
        } else {
          setError('找不到此行程');
        }
      } catch (error) {
                setError('載入行程時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadItinerary();
    }
  }, [id]);

  // 載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 錯誤或找不到資料
  if (error || !tourData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">{error || '找不到此行程'}</p>
        </div>
      </div>
    );
  }

  return <TourPage data={tourData} viewMode="desktop" />;
}
