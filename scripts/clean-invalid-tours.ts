/**
 * 清理無效的旅遊團資料
 * 用途：移除 departure_date 無效或空白的旅遊團
 */

import { openDB } from 'idb'

async function cleanInvalidTours() {
  console.log('🔍 開始掃描無效的旅遊團資料...')

  try {
    // 開啟 IndexedDB
    const db = await openDB('VenturoOfflineDB', 2)

    // 讀取所有旅遊團
    const allTours = await db.getAll('tours')

    console.log(`📊 總共找到 ${allTours.length} 筆旅遊團資料`)

    // 找出無效的旅遊團（departure_date 空白或無效）
    const invalidTours = allTours.filter(tour => {
      if (!tour.departure_date) return true // 空白
      const date = new Date(tour.departure_date)
      return isNaN(date.getTime()) // 無效日期
    })

    if (invalidTours.length === 0) {
      console.log('✅ 沒有找到無效的旅遊團資料')
      return
    }

    console.log(`❌ 找到 ${invalidTours.length} 筆無效的旅遊團資料：`)
    invalidTours.forEach(tour => {
      console.log(
        `  - ID: ${tour.id}, 名稱: ${tour.name || '(無名稱)'}, 出發日期: ${tour.departure_date || '(空白)'}`
      )
    })

    // 確認是否要刪除
    const confirmed = confirm(`確定要永久刪除這 ${invalidTours.length} 筆無效資料嗎？`)

    if (!confirmed) {
      console.log('❌ 使用者取消操作')
      return
    }

    // 永久刪除
    console.log('🗑️ 開始刪除...')
    for (const tour of invalidTours) {
      await db.delete('tours', tour.id)
      console.log(`✅ 已刪除: ${tour.id}`)
    }

    console.log(`✅ 成功清除 ${invalidTours.length} 筆無效資料！`)
    console.log('💡 請重新整理頁面以查看結果')
  } catch (error) {
    console.error('❌ 清理失敗:', error)
  }
}

// 執行清理
cleanInvalidTours()
