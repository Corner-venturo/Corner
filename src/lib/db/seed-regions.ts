/**
 * 地區資料初始化腳本
 * 將 region-hierarchy.ts 的資料匯入到 IndexedDB
 */

import { COUNTRIES } from '@/data/region-hierarchy'
import { localDB } from '@/lib/db'
import type { Country, Region, City } from '@/stores/region-store'

// 全域 flag 防止重複初始化
let isSeeding = false
let hasSeeded = false

/**
 * 初始化地區資料
 * 將 region-hierarchy.ts 的資料轉換並匯入到資料庫
 */
export async function seedRegions(): Promise<void> {
  // 如果正在初始化或已完成，直接返回
  if (isSeeding || hasSeeded) {
    return
  }

  isSeeding = true
  console.log('🌍 [Seed] 開始初始化地區資料...')

  try {
    // 檢查是否已有資料
    const existingCountries = await localDB.getAll<Country>('countries')
    if (existingCountries.length > 0) {
      console.log('✓ [Seed] 地區資料已存在，跳過初始化')
      hasSeeded = true
      isSeeding = false
      return
    }

    // 初始化資料庫
    await localDB.init()

    const now = new Date().toISOString()
    let countryOrder = 1
    let regionOrder = 1
    let cityOrder = 1

    // 遍歷所有國家
    for (const [countryId, countryData] of Object.entries(COUNTRIES)) {
      // 1. 建立國家
      const country: Country = {
        id: crypto.randomUUID(),
        name: countryData.name,
        name_en: countryData.nameEn,
        emoji: countryData.emoji,
        code: countryId,
        has_regions: !!countryData.regions,
        display_order: countryOrder++,
        is_active: true,
        created_at: now,
        updated_at: now,
      }

      await localDB.create('countries', country)
      console.log(`✓ [Seed] 建立國家: ${country.name}`)

      // 2. 建立地區（如果有）
      if (countryData.regions) {
        for (const regionData of countryData.regions) {
          const region: Region = {
            id: crypto.randomUUID(),
            country_id: country.id,
            name: regionData.name,
            name_en: regionData.nameEn,
            display_order: regionOrder++,
            is_active: true,
            created_at: now,
            updated_at: now,
          }

          await localDB.create('regions', region)
          console.log(`  ✓ [Seed] 建立地區: ${region.name}`)

          // 3. 建立城市
          for (const cityData of regionData.cities) {
            const city: City = {
              id: crypto.randomUUID(),
              country_id: country.id,
              region_id: region.id,
              name: cityData.name,
              name_en: cityData.nameEn,
              airport_code: cityData.id.toUpperCase(),
              display_order: cityOrder++,
              is_active: true,
              created_at: now,
              updated_at: now,
            }

            await localDB.create('cities', city)
          }
        }
      }

      // 4. 建立城市（無地區分類的國家）
      if (countryData.cities) {
        for (const cityData of countryData.cities) {
          const city: City = {
            id: crypto.randomUUID(),
            country_id: country.id,
            name: cityData.name,
            name_en: cityData.nameEn,
            airport_code: cityData.id.toUpperCase(),
            display_order: cityOrder++,
            is_active: true,
            created_at: now,
            updated_at: now,
          }

          await localDB.create('cities', city)
        }
      }
    }

    // 統計
    const finalCountries = await localDB.getAll<Country>('countries')
    const finalRegions = await localDB.getAll<Region>('regions')
    const finalCities = await localDB.getAll<City>('cities')

    console.log('✅ [Seed] 地區資料初始化完成')
    console.log(`   📊 國家: ${finalCountries.length} 筆`)
    console.log(`   📊 地區: ${finalRegions.length} 筆`)
    console.log(`   📊 城市: ${finalCities.length} 筆`)

    hasSeeded = true
  } catch (error) {
    console.error('❌ [Seed] 初始化失敗:', error)
    throw error
  } finally {
    isSeeding = false
  }
}

/**
 * 清空並重新初始化地區資料（危險操作！）
 */
export async function reseedRegions(): Promise<void> {
  // WARNING: This will clear all existing region data

  await localDB.init()
  await localDB.clear('countries')
  await localDB.clear('regions')
  await localDB.clear('cities')

  await seedRegions()
}
