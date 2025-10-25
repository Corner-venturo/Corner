import React from "react";
import { useRegionStore } from "@/stores";
import { CityOption } from "../types";

export function useRegionData(data: { country?: string }) {
  const [selectedCountry, setSelectedCountry] = React.useState<string>(data.country || "");
  const [selectedCountryCode, setSelectedCountryCode] = React.useState<string>("");
  const { items: regions, fetchAll } = useRegionStore();

  // 懶載入：進入表單時載入 regions
  React.useEffect(() => {
    if (regions.length === 0) {
      fetchAll();
    }
  }, [regions.length, fetchAll]);

  // 從 regions 取得所有國家列表
  const allDestinations = React.useMemo(() => {
    return regions
      .filter(r => r.type === 'country' && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  // 建立國家名稱到代碼的對照
  const countryNameToCode = React.useMemo(() => {
    const map: Record<string, string> = {};
    allDestinations.forEach(dest => {
      map[dest.name] = dest.code;
    });
    return map;
  }, [allDestinations]);

  // 根據選中的國家代碼取得城市列表
  const availableCities = React.useMemo<CityOption[]>(() => {
    if (!selectedCountryCode) return [];
    return regions
      .filter(r => r.type === 'city' && r.country_code === selectedCountryCode && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [selectedCountryCode, regions]);

  // 只在 data.country 從外部改變時同步（不要包含 selectedCountry 依賴！）
  React.useEffect(() => {
    if (data.country && data.country !== selectedCountry) {
      setSelectedCountry(data.country);
      // 同時更新 country code
      const code = countryNameToCode[data.country];
      if (code) {
        setSelectedCountryCode(code);
      }
    }
  }, [data.country, countryNameToCode, selectedCountry]);

  return {
    selectedCountry,
    setSelectedCountry,
    selectedCountryCode,
    setSelectedCountryCode,
    allDestinations,
    availableCities,
    countryNameToCode,
  };
}
