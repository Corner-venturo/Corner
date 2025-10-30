import { useCallback } from 'react'

/**
 * 簽證日期計算 Hook
 * 計算下件時間：護照 21天、護照急件 3天、台胞證 14天、台胞證急件 6天
 */
export const useVisaDateCalculator = () => {
  /**
   * 計算下件時間（所有天數含例假日）
   */
  const calculateReceivedDate = useCallback((submissionDate: string, visaType: string): string => {
    if (!submissionDate) return ''

    const date = new Date(submissionDate)

    // 根據簽證類型決定天數（所有天數都含例假日，不需要順延）
    let days = 21 // 預設護照一般件

    if (visaType.includes('台胞證') && visaType.includes('急件')) {
      days = 6
    } else if (visaType.includes('護照') && visaType.includes('急件')) {
      days = 3
    } else if (visaType.includes('台胞證')) {
      days = 14
    } else if (visaType.includes('護照')) {
      days = 21
    }

    date.setDate(date.getDate() + days)

    return date.toISOString().split('T')[0]
  }, [])

  return {
    calculateReceivedDate,
  }
}
