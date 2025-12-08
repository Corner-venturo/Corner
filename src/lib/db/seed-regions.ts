/**
 * 地區資料初始化腳本
 * 將 region-hierarchy.ts 的資料匯入到 Supabase
 */

import { logger } from '@/lib/utils/logger'
import { COUNTRIES } from '@/data/region-hierarchy'
import { supabase } from '@/lib/supabase/client'
import type { Country, Region, City } from '@/stores/region-store'

// 全域 flag 防止重複初始化
let isSeeding = false
let hasSeeded = false

/**
 * 初始化地區資料
 * 將 region-hierarchy.ts 的資料轉換並匯入到 Supabase
 */
export async function seedRegions(): Promise<void> {
  // 如果正在初始化或已完成，直接返回
  if (isSeeding || hasSeeded) {
    return
  }

  isSeeding = true
  logger.log('🌍 [Seed] 開始初始化地區資料...')

  try {
    // 檢查是否已有資料
    const { data: existingCountries } = await supabase
      .from('countries')
      .select('id')
      .limit(1)

    if (existingCountries && existingCountries.length > 0) {
      logger.log('✓ [Seed] 地區資料已存在，跳過初始化')
      hasSeeded = true
      isSeeding = false
      return
    }

    const now = new Date().toISOString()
    let countryOrder = 1
    let regionOrder = 1
    let cityOrder = 1

    // 遍歷所有國家
    for (const [countryId, countryData] of Object.entries(COUNTRIES)) {
      // 1. 建立國家
      const country: Omit<Country, 'created_at' | 'updated_at'> & { created_at: string; updated_at: string } = {
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

      const { error: countryError } = await supabase.from('countries').insert(country)
      if (countryError) {
        logger.error(`❌ [Seed] 建立國家失敗: ${country.name}`, countryError)
        continue
      }
      logger.log(`✓ [Seed] 建立國家: ${country.name}`)

      // 2. 建立地區（如果有）
      if (countryData.regions) {
        for (const regionData of countryData.regions) {
          const region: Omit<Region, 'created_at' | 'updated_at'> & { created_at: string; updated_at: string } = {
            id: crypto.randomUUID(),
            country_id: country.id,
            name: regionData.name,
            name_en: regionData.nameEn,
            display_order: regionOrder++,
            is_active: true,
            created_at: now,
            updated_at: now,
          }

          const { error: regionError } = await supabase.from('regions').insert(region)
          if (regionError) {
            logger.error(`❌ [Seed] 建立地區失敗: ${region.name}`, regionError)
            continue
          }
          logger.log(`  ✓ [Seed] 建立地區: ${region.name}`)

          // 3. 建立城市
          const cities: Array<Omit<City, 'created_at' | 'updated_at'> & { created_at: string; updated_at: string }> = []
          for (const cityData of regionData.cities) {
            cities.push({
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
            })
          }

          if (cities.length > 0) {
            const { error: citiesError } = await supabase.from('cities').insert(cities)
            if (citiesError) {
              logger.error(`❌ [Seed] 批次建立城市失敗`, citiesError)
            }
          }
        }
      }

      // 4. 建立城市（無地區分類的國家）
      if (countryData.cities) {
        const cities: Array<Omit<City, 'created_at' | 'updated_at'> & { created_at: string; updated_at: string }> = []
        for (const cityData of countryData.cities) {
          cities.push({
            id: crypto.randomUUID(),
            country_id: country.id,
            name: cityData.name,
            name_en: cityData.nameEn,
            airport_code: cityData.id.toUpperCase(),
            display_order: cityOrder++,
            is_active: true,
            created_at: now,
            updated_at: now,
          })
        }

        if (cities.length > 0) {
          const { error: citiesError } = await supabase.from('cities').insert(cities)
          if (citiesError) {
            logger.error(`❌ [Seed] 批次建立城市失敗`, citiesError)
          }
        }
      }
    }

    // 統計
    const { count: countryCount } = await supabase.from('countries').select('*', { count: 'exact', head: true })
    const { count: regionCount } = await supabase.from('regions').select('*', { count: 'exact', head: true })
    const { count: cityCount } = await supabase.from('cities').select('*', { count: 'exact', head: true })

    logger.log('✅ [Seed] 地區資料初始化完成')
    logger.log(`   📊 國家: ${countryCount} 筆`)
    logger.log(`   📊 地區: ${regionCount} 筆`)
    logger.log(`   📊 城市: ${cityCount} 筆`)

    hasSeeded = true
  } catch (error) {
    logger.error('❌ [Seed] 初始化失敗:', error)
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

  // 順序很重要：先刪子表再刪父表
  await supabase.from('cities').delete().neq('id', '')
  await supabase.from('regions').delete().neq('id', '')
  await supabase.from('countries').delete().neq('id', '')

  // 重置 flag
  hasSeeded = false

  await seedRegions()
}
