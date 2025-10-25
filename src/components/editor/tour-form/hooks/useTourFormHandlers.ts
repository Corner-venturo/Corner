import { TourFormData, Activity } from "../types";
import { cityImages, timezoneOffset } from "../constants";
import { calculateFlightDuration } from "../utils";

export function useTourFormHandlers(
  data: TourFormData,
  onChange: (data: TourFormData) => void,
  selectedCountry: string
) {
  const updateField = (field: string, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  // 更新城市時自動設定封面圖片
  const updateCity = (city: string) => {
    onChange({
      ...data,
      city,
      coverImage: cityImages[city] || data.coverImage
    });
  };

  const updateNestedField = (parent: string, field: string, value: unknown) => {
    onChange({
      ...data,
      [parent]: { ...data[parent], [field]: value }
    });
  };

  // 航班資訊更新（自動計算飛行時間）
  const updateFlightField = (flightType: 'outboundFlight' | 'returnFlight', field: string, value: string) => {
    const updatedFlight = { ...data[flightType], [field]: value };

    // 自動計算飛行時間
    const timeDiff = timezoneOffset[selectedCountry] || 0;
    if (field === 'departureTime' || field === 'arrivalTime') {
      const depTime = field === 'departureTime' ? value : updatedFlight.departureTime;
      const arrTime = field === 'arrivalTime' ? value : updatedFlight.arrivalTime;
      updatedFlight.duration = calculateFlightDuration(depTime, arrTime, timeDiff);
    }

    onChange({
      ...data,
      [flightType]: updatedFlight
    });
  };

  // 特色管理
  const addFeature = () => {
    onChange({
      ...data,
      features: [...(data.features || []), { icon: "IconSparkles", title: "", description: "" }]
    });
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const newFeatures = [...data.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    onChange({ ...data, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = data.features.filter((_: unknown, i: number) => i !== index);
    onChange({ ...data, features: newFeatures });
  };

  // 景點管理
  const addFocusCard = () => {
    onChange({
      ...data,
      focusCards: [...(data.focusCards || []), { title: "", src: "" }]
    });
  };

  const updateFocusCard = (index: number, field: string, value: string) => {
    const newCards = [...data.focusCards];
    newCards[index] = { ...newCards[index], [field]: value };
    onChange({ ...data, focusCards: newCards });
  };

  const removeFocusCard = (index: number) => {
    const newCards = data.focusCards.filter((_: unknown, i: number) => i !== index);
    onChange({ ...data, focusCards: newCards });
  };

  // 逐日行程管理
  const addDailyItinerary = () => {
    onChange({
      ...data,
      dailyItinerary: [...(data.dailyItinerary || []), {
        dayLabel: `Day ${(data.dailyItinerary?.length || 0) + 1}`,
        date: "",
        title: "",
        highlight: "",
        description: "",
        activities: [],
        recommendations: [],
        meals: { breakfast: "", lunch: "", dinner: "" },
        accommodation: ""
      }]
    });
  };

  const updateDailyItinerary = (index: number, field: string, value: unknown) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const removeDailyItinerary = (index: number) => {
    const newItinerary = data.dailyItinerary
      .filter((_: unknown, i: number) => i !== index)
      .map((day: unknown, i: number) => ({
        ...day,
        dayLabel: `Day ${i + 1}` // 自動更新 dayLabel
      }));
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  // 活動管理
  const addActivity = (dayIndex: number) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].activities = [
      ...(newItinerary[dayIndex].activities || []),
      { icon: "🌋", title: "", description: "" }
    ];
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const updateActivity = (dayIndex: number, actIndex: number, field: string, value: string) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].activities[actIndex] = {
      ...newItinerary[dayIndex].activities[actIndex],
      [field]: value
    };
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter(
      (_: Activity, i: number) => i !== actIndex
    );
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  // 推薦行程管理
  const addRecommendation = (dayIndex: number) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].recommendations = [
      ...(newItinerary[dayIndex].recommendations || []),
      ""
    ];
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const updateRecommendation = (dayIndex: number, recIndex: number, value: string) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].recommendations[recIndex] = value;
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  const removeRecommendation = (dayIndex: number, recIndex: number) => {
    const newItinerary = [...data.dailyItinerary];
    newItinerary[dayIndex].recommendations = newItinerary[dayIndex].recommendations.filter(
      (_: string, i: number) => i !== recIndex
    );
    onChange({ ...data, dailyItinerary: newItinerary });
  };

  return {
    updateField,
    updateCity,
    updateNestedField,
    updateFlightField,
    addFeature,
    updateFeature,
    removeFeature,
    addFocusCard,
    updateFocusCard,
    removeFocusCard,
    addDailyItinerary,
    updateDailyItinerary,
    removeDailyItinerary,
    addActivity,
    updateActivity,
    removeActivity,
    addRecommendation,
    updateRecommendation,
    removeRecommendation,
  };
}
