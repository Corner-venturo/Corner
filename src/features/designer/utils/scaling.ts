/**
 * 畫布縮放工具函數
 * 用於處理不同尺寸文件的縮放轉換
 */

// 標準 A5 尺寸（300 DPI，含出血）
export const NEW_A5_WIDTH = 1819
export const NEW_A5_HEIGHT = 2551

/**
 * 檢測是否需要縮放（不是標準 300 DPI A5 尺寸）
 * 允許 5% 的誤差範圍
 */
export function needsScaling(width: number, height: number): boolean {
  const tolerance = 0.05 // 5% 誤差
  const widthMatch = Math.abs(width - NEW_A5_WIDTH) / NEW_A5_WIDTH < tolerance
  const heightMatch = Math.abs(height - NEW_A5_HEIGHT) / NEW_A5_HEIGHT < tolerance
  return !(widthMatch && heightMatch)
}

/**
 * 計算縮放因子（基於寬度）
 */
export function calculateScaleFactor(width: number): number {
  return NEW_A5_WIDTH / width
}

/**
 * 縮放 fabricData 中的所有物件
 */
export function scaleFabricData(
  fabricData: Record<string, unknown>,
  scaleFactor: number
): Record<string, unknown> {
  if (!fabricData || typeof fabricData !== 'object') return fabricData

  const scaled = { ...fabricData }

  // 縮放物件陣列
  if (Array.isArray(fabricData.objects)) {
    scaled.objects = fabricData.objects.map((obj: Record<string, unknown>) => {
      const scaledObj = { ...obj }

      // 縮放位置和尺寸
      if (typeof obj.left === 'number') scaledObj.left = obj.left * scaleFactor
      if (typeof obj.top === 'number') scaledObj.top = obj.top * scaleFactor
      if (typeof obj.width === 'number') scaledObj.width = obj.width * scaleFactor
      if (typeof obj.height === 'number') scaledObj.height = obj.height * scaleFactor
      if (typeof obj.scaleX === 'number') scaledObj.scaleX = obj.scaleX * scaleFactor
      if (typeof obj.scaleY === 'number') scaledObj.scaleY = obj.scaleY * scaleFactor

      // 縮放字體大小
      if (typeof obj.fontSize === 'number') scaledObj.fontSize = obj.fontSize * scaleFactor

      // 縮放邊框寬度
      if (typeof obj.strokeWidth === 'number') scaledObj.strokeWidth = obj.strokeWidth * scaleFactor

      // 縮放圓角
      if (typeof obj.rx === 'number') scaledObj.rx = obj.rx * scaleFactor
      if (typeof obj.ry === 'number') scaledObj.ry = obj.ry * scaleFactor

      // 縮放線條起點終點
      if (typeof obj.x1 === 'number') scaledObj.x1 = obj.x1 * scaleFactor
      if (typeof obj.y1 === 'number') scaledObj.y1 = obj.y1 * scaleFactor
      if (typeof obj.x2 === 'number') scaledObj.x2 = obj.x2 * scaleFactor
      if (typeof obj.y2 === 'number') scaledObj.y2 = obj.y2 * scaleFactor

      // 縮放路徑（clipPath 等）
      if (obj.clipPath && typeof obj.clipPath === 'object') {
        scaledObj.clipPath = scaleFabricData(obj.clipPath as Record<string, unknown>, scaleFactor)
      }

      return scaledObj
    })
  }

  return scaled
}
