'use client'

import { useState } from 'react'
import { logger } from '@/lib/utils/logger'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { MemberFieldValue } from '../types'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'

const supabase = supabaseClient as any

/**
 * Hook for managing custom fields
 * Handles loading, creating, updating, and deleting custom fields
 */
export function useCustomFields(tourId: string) {
  const [customFields, setCustomFields] = useState<string[]>([])
  const [fieldValues, setFieldValues] = useState<MemberFieldValue>({})

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_member_fields')
        .select('field_name')
        .eq('tour_id', tourId)

      if (error) throw error

      // Get unique field names
      const fieldData = data as Array<{ field_name: string }> | null
      const uniqueFields = [...new Set(fieldData?.map(d => d.field_name) || [])]
      setCustomFields(uniqueFields)
    } catch (error) {
      logger.error('載入自訂欄位失敗:', error)
    }
  }

  const loadFieldValues = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_member_fields')
        .select('*')
        .eq('tour_id', tourId)

      if (error) throw error

      // Organize into { memberId: { fieldName: value } } structure
      const values: MemberFieldValue = {}
      const fieldData = data as Array<{
        order_member_id: string
        field_name: string
        field_value: string | null
      }> | null

      fieldData?.forEach(item => {
        if (!values[item.order_member_id]) {
          values[item.order_member_id] = {}
        }
        values[item.order_member_id][item.field_name] = item.field_value || ''
      })

      setFieldValues(values)
    } catch (error) {
      logger.error('載入欄位值失敗:', error)
    }
  }

  const addField = (fieldName: string) => {
    if (!fieldName.trim()) {
      toast.error('請輸入欄位名稱')
      return false
    }

    if (customFields.includes(fieldName.trim())) {
      toast.error('欄位名稱已存在')
      return false
    }

    setCustomFields([...customFields, fieldName.trim()])
    toast.success(`已新增欄位：${fieldName.trim()}`)
    return true
  }

  const deleteField = async (fieldName: string) => {
    const confirmed = await confirm(`確定要刪除「${fieldName}」欄位嗎？所有資料將一併刪除。`, {
      title: '刪除欄位',
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    try {
      // Delete all data for this field from database
      const { error } = await supabase
        .from('tour_member_fields')
        .delete()
        .eq('tour_id', tourId)
        .eq('field_name', fieldName)

      if (error) throw error

      // Update local state
      setCustomFields(customFields.filter(f => f !== fieldName))

      // Clear field values
      const newFieldValues = { ...fieldValues }
      Object.keys(newFieldValues).forEach(memberId => {
        delete newFieldValues[memberId][fieldName]
      })
      setFieldValues(newFieldValues)

      toast.success(`已刪除欄位：${fieldName}`)
    } catch (error) {
      logger.error('刪除欄位失敗:', error)
      toast.error('刪除欄位失敗')
    }
  }

  const updateFieldValue = async (memberId: string, fieldName: string, value: string) => {
    // Update local state immediately
    setFieldValues(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [fieldName]: value
      }
    }))

    try {
      // Upsert to database
      const { error } = await supabase
        .from('tour_member_fields')
        .upsert({
          tour_id: tourId,
          order_member_id: memberId,
          field_name: fieldName,
          field_value: value,
          display_order: 0
        }, {
          onConflict: 'tour_id,order_member_id,field_name'
        })

      if (error) throw error
    } catch (error) {
      logger.error('更新欄位值失敗:', error)
      // Reload on failure
      loadFieldValues()
    }
  }

  const getFieldValue = (memberId: string, fieldName: string): string => {
    return fieldValues[memberId]?.[fieldName] || ''
  }

  return {
    customFields,
    fieldValues,
    loadCustomFields,
    loadFieldValues,
    addField,
    deleteField,
    updateFieldValue,
    getFieldValue,
  }
}
