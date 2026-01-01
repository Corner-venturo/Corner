'use client'

import React from 'react'
import { TourFormData } from '../types'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, AlertCircle, FileX, GripVertical } from 'lucide-react'

interface NoticesPolicySectionProps {
  data: TourFormData
  onChange: (data: TourFormData) => void
}

// 預設提醒事項
const getDefaultNotices = (): string[] => [
  '本行程之最低出團人數為4人(含)以上。',
  '行程內容僅供出發前參考,最終行程、航班時刻及住宿安排,請以行前說明會提供之資料為準。',
  '各日行程將依當地交通與實際狀況彈性調整,如景點順序、住宿安排與參觀時間,均由專業領隊現場妥善規劃,敬請旅客理解與配合。',
  '團費已包含機場稅、燃油附加費及領隊/導遊服務費;惟不包含其他個別性小費(如司機、行李員、飯店服務人員之服務小費)。',
  '因應國際油價波動,航空公司可能調整燃油附加費,相關費用將依實際票務成本調整計算。',
  '住宿以雙人房為主(兩張單人床或一張大床)。如需求三人房,將視飯店實際情況安排加床(多為折疊床或沙發床),空間較為有限。若需單人房,請於報名時提出並補足房差費用。',
  '航空公司座位安排(非廉價航空):多提供班機起飛前48小時內的網路與手機報到免費選位服務,惟額外加長座位(如出口座位)不包含於免費選位範圍內。',
]

// 預設取消政策
const getDefaultCancellationPolicy = (): string[] => [
  '旅客繳交訂金後,即視為《國外旅遊定型化契約》正式生效。旅行社將依各合作單位(如飯店、餐廳、行程體驗業者)之規定,陸續預付旅程相關費用。若旅客因個人因素取消行程,將依契約條款辦理,或視實際已支出金額酌收相關費用後,退還剩餘款項。',
  '由於本行程多數項目須事前預約安排,若旅客於旅途中臨時於國外提出無法參與之通知,將視同自動放棄,相關費用恕無法退還,敬請理解與配合。',
]

export function NoticesPolicySection({ data, onChange }: NoticesPolicySectionProps) {
  const notices = data.notices || []
  const cancellationPolicy = data.cancellationPolicy || []

  // 更新提醒事項
  const updateNotice = (index: number, value: string) => {
    const newNotices = [...notices]
    newNotices[index] = value
    onChange({ ...data, notices: newNotices })
  }

  // 新增提醒事項
  const addNotice = () => {
    onChange({ ...data, notices: [...notices, ''] })
  }

  // 刪除提醒事項
  const removeNotice = (index: number) => {
    const newNotices = notices.filter((_, i) => i !== index)
    onChange({ ...data, notices: newNotices })
  }

  // 更新取消政策
  const updateCancellationPolicy = (index: number, value: string) => {
    const newPolicy = [...cancellationPolicy]
    newPolicy[index] = value
    onChange({ ...data, cancellationPolicy: newPolicy })
  }

  // 新增取消政策
  const addCancellationPolicy = () => {
    onChange({ ...data, cancellationPolicy: [...cancellationPolicy, ''] })
  }

  // 刪除取消政策
  const removeCancellationPolicy = (index: number) => {
    const newPolicy = cancellationPolicy.filter((_, i) => i !== index)
    onChange({ ...data, cancellationPolicy: newPolicy })
  }

  return (
    <div className="space-y-8">
      {/* ===== 提醒事項 ===== */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-1">
          提醒事項 NOTICES
        </h2>

        {/* 顯示開關 */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-status-warning" />
            <div>
              <h3 className="font-medium text-morandi-primary">顯示提醒事項</h3>
              <p className="text-sm text-morandi-secondary">
                出團前的重要提醒與注意事項
              </p>
            </div>
          </div>
          <Switch
            checked={data.showNotices || false}
            onCheckedChange={(checked) => {
              onChange({
                ...data,
                showNotices: checked,
                notices: checked && notices.length === 0 ? getDefaultNotices() : notices,
              })
            }}
          />
        </div>

        {/* 提醒事項列表 */}
        {data.showNotices && (
          <div className="space-y-3">
            {notices.map((notice, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex items-start pt-2">
                  <GripVertical className="h-4 w-4 text-morandi-muted/60" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-morandi-primary">第 {index + 1} 項</Label>
                  <Textarea
                    value={notice}
                    onChange={(e) => updateNotice(index, e.target.value)}
                    placeholder="輸入提醒事項..."
                    className="mt-1 min-h-[60px]"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNotice(index)}
                  className="h-8 w-8 p-0 text-morandi-muted hover:text-status-danger mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addNotice}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增提醒事項
            </Button>
          </div>
        )}
      </div>

      {/* ===== 取消政策 ===== */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-1">
          取消政策 CANCELLATION
        </h2>

        {/* 顯示開關 */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <FileX className="h-5 w-5 text-morandi-red" />
            <div>
              <h3 className="font-medium text-morandi-primary">顯示取消政策</h3>
              <p className="text-sm text-morandi-secondary">
                取消行程的相關規定與費用說明
              </p>
            </div>
          </div>
          <Switch
            checked={data.showCancellationPolicy || false}
            onCheckedChange={(checked) => {
              onChange({
                ...data,
                showCancellationPolicy: checked,
                cancellationPolicy: checked && cancellationPolicy.length === 0 ? getDefaultCancellationPolicy() : cancellationPolicy,
              })
            }}
          />
        </div>

        {/* 取消政策列表 */}
        {data.showCancellationPolicy && (
          <div className="space-y-3">
            {cancellationPolicy.map((policy, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex items-start pt-2">
                  <GripVertical className="h-4 w-4 text-morandi-muted/60" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-morandi-primary">第 {index + 1} 項</Label>
                  <Textarea
                    value={policy}
                    onChange={(e) => updateCancellationPolicy(index, e.target.value)}
                    placeholder="輸入取消政策..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCancellationPolicy(index)}
                  className="h-8 w-8 p-0 text-morandi-muted hover:text-status-danger mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addCancellationPolicy}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              新增取消政策
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
