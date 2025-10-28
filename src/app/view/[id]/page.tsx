"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TourPage from "@/components/TourPage";
import { useItineraryStore } from "@/stores";
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
  const { fetchById } = useItineraryStore();

  const [tourData, setTourData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  // 載入行程資料
  useEffect(() => {
    const loadItinerary = async () => {
      try {
        const itinerary = await fetchById(id);
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
          console.error('找不到此行程');
        }
      } catch (error) {
        console.error('載入行程失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItinerary();
  }, [id, fetchById]);

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

  // 找不到資料
  if (!tourData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">找不到此行程</p>
        </div>
      </div>
    );
  }

  return <TourPage data={tourData} viewMode="desktop" />;
}
