'use client'

import React, { forwardRef, useImperativeHandle } from 'react'
import { Employee } from '@/stores/types'
import { _FileText } from 'lucide-react'

interface ContractsTabProps {
  employee: Employee
  isEditing?: boolean
  setIsEditing?: (editing: boolean) => void
}

export const ContractsTab = forwardRef<{ handleSave: () => void }, ContractsTabProps>(
  ({ employee }, ref) => {
    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        // 合約資訊目前為唯讀，未來若需編輯功能可在此實作
      },
    }))

    const getContractTypeLabel = (type: Employee['contracts'][0]['type']) => {
      const typeMap = {
        employment: '正式雇用',
        probation: '試用期',
        renewal: '續約',
      }
      return typeMap[type]
    }

    return (
      <div className="space-y-6">
        <div className="bg-morandi-container/10 rounded-lg p-4">
          {employee.contracts.length > 0 ? (
            <div className="space-y-3">
              {employee.contracts.map(contract => (
                <div key={contract.id} className="bg-white rounded border p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-morandi-primary">
                        {getContractTypeLabel(contract.type)}
                      </h4>
                      <p className="text-sm text-morandi-muted">合約編號：{contract.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-morandi-secondary">
                        {new Date(contract.start_date).toLocaleDateString()}
                        {contract.end_date &&
                          ` - ${new Date(contract.end_date).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  {contract.notes && (
                    <div className="text-sm text-morandi-muted mb-2">備註：{contract.notes}</div>
                  )}

                  {contract.file_path && (
                    <div className="text-sm">
                      <a
                        href={contract.file_path}
                        className="text-morandi-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        檢視合約檔案
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-morandi-muted text-sm">無合約紀錄</p>
          )}
        </div>
      </div>
    )
  }
)
