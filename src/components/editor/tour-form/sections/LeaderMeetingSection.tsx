import React from "react";
import { TourFormData } from "../types";

interface LeaderMeetingSectionProps {
  data: TourFormData;
  updateNestedField: (parent: string, field: string, value: unknown) => void;
}

export function LeaderMeetingSection({ data, updateNestedField }: LeaderMeetingSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-purple-500 pb-2">👤 領隊與集合資訊</h2>

      <div className="bg-purple-50 p-4 rounded-lg space-y-3">
        <h3 className="font-bold text-purple-900">領隊資訊</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">領隊姓名</label>
          <input
            type="text"
            value={data.leader?.name || ""}
            onChange={(e) => updateNestedField("leader", "name", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="鍾惠如 小姐"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">國內電話</label>
            <input
              type="text"
              value={data.leader?.domesticPhone || ""}
              onChange={(e) => updateNestedField("leader", "domesticPhone", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="+886 0928402897"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">國外電話</label>
            <input
              type="text"
              value={data.leader?.overseasPhone || ""}
              onChange={(e) => updateNestedField("leader", "overseasPhone", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="+81 08074371189"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
        <h3 className="font-bold text-blue-900">集合資訊</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">集合時間</label>
          <input
            type="text"
            value={data.meetingInfo?.time || ""}
            onChange={(e) => updateNestedField("meetingInfo", "time", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="2025/10/21 04:50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">集合地點</label>
          <input
            type="text"
            value={data.meetingInfo?.location || ""}
            onChange={(e) => updateNestedField("meetingInfo", "location", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="桃園機場華航第二航廈 7號櫃台"
          />
        </div>
      </div>
    </div>
  );
}
