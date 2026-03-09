/**
 * 轉機分析器
 */

import type { FlightSegment } from '../types'

export interface ConnectionInfo {
  fromSegmentIndex: number
  toSegmentIndex: number
  airport: string
  airportName: string
  connectionTimeMinutes: number
  mct: number
  isSufficient: boolean
  warning?: string
  suggestion?: string
}

// 機場最短轉機時間（MCT）對照表（單位：分鐘）
const AIRPORT_MCT: Record<string, { international: number; name: string }> = {
  TPE: { international: 90, name: '桃園國際機場' },
  NRT: { international: 120, name: '東京成田機場' },
  HND: { international: 90, name: '東京羽田機場' },
  KIX: { international: 90, name: '大阪關西機場' },
  ICN: { international: 90, name: '首爾仁川機場' },
  BKK: { international: 90, name: '曼谷蘇凡納布機場' },
  SIN: { international: 90, name: '新加坡樟宜機場' },
  HKG: { international: 90, name: '香港國際機場' },
  DEFAULT: { international: 120, name: '預設' },
}

function getMCT(airportCode: string): number {
  return (AIRPORT_MCT[airportCode] || AIRPORT_MCT['DEFAULT']).international
}

function getAirportName(airportCode: string): string {
  return (AIRPORT_MCT[airportCode] || AIRPORT_MCT['DEFAULT']).name
}

/**
 * 分析所有轉機
 */
export function analyzeAllConnections(segments: FlightSegment[]): ConnectionInfo[] {
  const connections: ConnectionInfo[] = []

  for (let i = 0; i < segments.length - 1; i++) {
    const current = segments[i]
    const next = segments[i + 1]

    // 檢查是否為轉機
    if (current.destination !== next.origin) continue

    // 簡化計算：假設同天轉機
    if (!current.arrivalTime || !next.departureTime) continue

    const arrHH = parseInt(current.arrivalTime.substring(0, 2))
    const arrMM = parseInt(current.arrivalTime.substring(2, 4))
    const depHH = parseInt(next.departureTime.substring(0, 2))
    const depMM = parseInt(next.departureTime.substring(2, 4))

    let connectionMinutes = depHH * 60 + depMM - (arrHH * 60 + arrMM)
    if (connectionMinutes < 0) connectionMinutes += 24 * 60 // 跨日

    const airport = current.destination
    const mct = getMCT(airport)
    const isSufficient = connectionMinutes >= mct

    let warning: string | undefined
    let suggestion: string | undefined

    if (!isSufficient) {
      warning = `🚨 轉機時間不足！只有 ${connectionMinutes} 分鐘（需 ${mct} 分鐘）`
      suggestion = '建議選擇轉機時間更長的航班'
    } else if (connectionMinutes < mct + 30) {
      warning = `⚠️ 轉機時間緊迫：${connectionMinutes} 分鐘`
    }

    connections.push({
      fromSegmentIndex: i,
      toSegmentIndex: i + 1,
      airport,
      airportName: getAirportName(airport),
      connectionTimeMinutes: connectionMinutes,
      mct,
      isSufficient,
      warning,
      suggestion,
    })
  }

  return connections
}
