import { UI_DELAYS, SYNC_DELAYS } from '@/lib/constants/timeouts';
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { _Employee } from '@/stores/types';
import { useUserStore, userStoreHelpers } from '@/stores/user-store';
import { hashPassword } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Check, Plus, Trash2 } from 'lucide-react';

interface AddEmployeeFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export function AddEmployeeForm({ onSubmit, onCancel }: AddEmployeeFormProps) {
  const { create: addUser } = useUserStore();

  // 成功創建對話框狀態
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<{
    display_name: string;
    employee_number: string;
    password: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    english_name: '',
    display_name: '',
    chinese_name: '',
    defaultPassword: 'venturo123', // 預設密碼
    roles: [] as ('admin' | 'employee' | 'user' | 'tour_leader' | 'sales' | 'accountant' | 'assistant')[],
    personal_info: {
      national_id: '',
      birthday: '',
      phone: [''], // 改成陣列
      email: '',
      address: '',
      emergency_contact: {
        name: '',
        relationship: '',
        phone: ''
      }
    },
    job_info: {
      hire_date: new Date().toISOString().split('T')[0]
    },
    salary_info: {
      base_salary: 0,
      allowances: [],
      salaryHistory: []
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.english_name.trim() || !formData.display_name.trim()) {
      alert('請填寫姓名');
      return;
    }

    try {
      // 生成員工編號
      const employee_number = userStoreHelpers.generateUserNumber(formData.english_name);

      // 加密預設密碼
      const hashedPassword = await hashPassword(formData.defaultPassword);

      // 建立資料庫員工記錄
      const dbEmployeeData = {
        employee_number: employee_number,
        english_name: formData.english_name,
        display_name: formData.display_name,
        chinese_name: formData.chinese_name,
        password_hash: hashedPassword,
        roles: formData.roles,
        personal_info: {
          national_id: formData.personal_info.national_id,
          birthday: formData.personal_info.birthday,
          phone: formData.personal_info.phone.filter(p => p.trim() !== ''), // 過濾空白電話
          email: formData.personal_info.email,
          address: formData.personal_info.address,
          emergency_contact: {
            name: formData.personal_info.emergency_contact.name,
            relationship: formData.personal_info.emergency_contact.relationship,
            phone: formData.personal_info.emergency_contact.phone
          }
        },
        job_info: {
          hire_date: formData.job_info.hire_date
        },
        salary_info: {
          base_salary: formData.salary_info.base_salary,
          allowances: [],
          salary_history: [
            {
              effective_date: formData.job_info.hire_date,
              base_salary: formData.salary_info.base_salary,
              reason: '入職起薪'
            }
          ]
        },
        permissions: [], // 初始無權限，需要後續設定
        status: 'active' // 新員工預設為在職狀態
      };

      // 儲存到本地（純本地模式）
      addUser(dbEmployeeData as any);

      console.log('📦 本地模式：員工已新增', employee_number);

      // 顯示成功對話框
      setCreatedEmployee({
        display_name: formData.display_name,
        employee_number: employee_number,
        password: formData.defaultPassword
      });
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('創建員工失敗:', error);
      alert('創建員工失敗，請稍後再試');
    }
  };

  // 複製到剪貼簿
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), UI_DELAYS.SUCCESS_MESSAGE);
  };

  // 關閉成功對話框
  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    setCreatedEmployee(null);
    onSubmit();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本資料 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-morandi-primary border-b pb-2">基本資料</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              顯示名稱 *
            </label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              中文姓名
            </label>
            <Input
              value={formData.chinese_name}
              onChange={(e) => setFormData({ ...formData, chinese_name: e.target.value })}
              placeholder="例：王小明"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              英文姓名 * (用於生成員工編號)
            </label>
            <Input
              value={formData.english_name}
              onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
              placeholder="例：John"
              required
            />
            {formData.english_name && (
              <p className="text-xs text-morandi-muted mt-1">
                員工編號將為：{userStoreHelpers.generateUserNumber(formData.english_name)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              員工編號（自動生成）
            </label>
            <Input
              value={formData.english_name ? userStoreHelpers.generateUserNumber(formData.english_name) : ''}
              disabled
              className="bg-morandi-container/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">身分證號</label>
          <Input
            value={formData.personal_info.national_id}
            onChange={(e) => setFormData({
              ...formData,
              personal_info: { ...formData.personal_info, national_id: e.target.value }
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">生日</label>
          <Input
            type="date"
            value={formData.personal_info.birthday}
            onChange={(e) => setFormData({
              ...formData,
              personal_info: { ...formData.personal_info, birthday: e.target.value }
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center justify-between">
            <span>聯絡電話</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setFormData({
                  ...formData,
                  personal_info: {
                    ...formData.personal_info,
                    phone: [...formData.personal_info.phone, '']
                  }
                });
              }}
              className="h-6 text-xs"
            >
              <Plus size={12} className="mr-1" />
              新增電話
            </Button>
          </label>
          <div className="space-y-2">
            {formData.personal_info.phone.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => {
                    const phones = [...formData.personal_info.phone];
                    phones[index] = e.target.value;
                    setFormData({
                      ...formData,
                      personal_info: { ...formData.personal_info, phone: phones }
                    });
                  }}
                  placeholder={`電話 ${index + 1}`}
                />
                {formData.personal_info.phone.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const phones = formData.personal_info.phone.filter((_, i) => i !== index);
                      setFormData({
                        ...formData,
                        personal_info: { ...formData.personal_info, phone: phones }
                      });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">Email</label>
          <Input
            type="email"
            value={formData.personal_info.email}
            onChange={(e) => setFormData({
              ...formData,
              personal_info: { ...formData.personal_info, email: e.target.value }
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">
            預設登入密碼
          </label>
          <Input
            type="text"
            value={formData.defaultPassword}
            onChange={(e) => setFormData({ ...formData, defaultPassword: e.target.value })}
            placeholder="請設定預設密碼"
            required
          />
          <p className="text-xs text-morandi-muted mt-1">
            員工可使用此密碼首次登入，建議提醒其登入後更改密碼
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-2">
            附加身份標籤（可複選）
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="user"
                checked={formData.roles.includes('user')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, roles: [...formData.roles, 'user'] });
                  } else {
                    setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'user') });
                  }
                }}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">普通使用者</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="employee"
                checked={formData.roles.includes('employee')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, roles: [...formData.roles, 'employee'] });
                  } else {
                    setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'employee') });
                  }
                }}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">員工</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="admin"
                checked={formData.roles.includes('admin')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, roles: [...formData.roles, 'admin'] });
                  } else {
                    setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'admin') });
                  }
                }}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">管理員</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="tour_leader"
                checked={formData.roles.includes('tour_leader')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, roles: [...formData.roles, 'tour_leader'] });
                  } else {
                    setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'tour_leader') });
                  }
                }}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">領隊</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="sales"
                checked={formData.roles.includes('sales')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, roles: [...formData.roles, 'sales'] });
                  } else {
                    setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'sales') });
                  }
                }}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">業務</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="accountant"
                checked={formData.roles.includes('accountant')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, roles: [...formData.roles, 'accountant'] });
                  } else {
                    setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'accountant') });
                  }
                }}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">會計</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value="assistant"
                checked={formData.roles.includes('assistant')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, roles: [...formData.roles, 'assistant'] });
                  } else {
                    setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'assistant') });
                  }
                }}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">助理</span>
            </label>
          </div>
          <p className="text-xs text-morandi-muted mt-2">
            此標籤僅用於篩選，不影響實際權限功能。可勾選多個身份
          </p>
        </div>
      </div>

      {/* 職務資料 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-morandi-primary border-b pb-2">職務資料</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">入職日期</label>
            <Input
              type="date"
              value={formData.job_info.hire_date}
              onChange={(e) => setFormData({
                ...formData,
                job_info: { ...formData.job_info, hire_date: e.target.value }
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">起薪</label>
            <Input
              type="number"
              value={formData.salary_info.base_salary}
              onChange={(e) => setFormData({
                ...formData,
                salary_info: { ...formData.salary_info, base_salary: Number(e.target.value) }
              })}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* 按鈕 */}
      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" className="flex-1">
          建立員工
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>

    {/* 成功創建對話框 */}
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-600">✅ 員工創建成功</DialogTitle>
          <DialogDescription>員工資料已成功建立，請記錄以下登入資訊</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-sm text-morandi-primary mb-4">
              員工 <span className="font-bold text-morandi-gold">{createdEmployee?.display_name}</span> 已成功創建！
            </p>

            <div className="space-y-3">
              {/* 員工編號 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-morandi-muted mb-1.5">員工編號</p>
                    <p className="font-mono text-base font-semibold text-morandi-primary">
                      {createdEmployee?.employee_number}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdEmployee?.employee_number || '', 'number')}
                    className="ml-3 p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="複製員工編號"
                  >
                    {copiedField === 'number' ? (
                      <Check size={20} className="text-green-600" />
                    ) : (
                      <Copy size={20} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* 預設密碼 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-morandi-muted mb-1.5">預設密碼</p>
                    <p className="font-mono text-base font-semibold text-morandi-primary">
                      {createdEmployee?.password}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdEmployee?.password || '', 'password')}
                    className="ml-3 p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="複製密碼"
                  >
                    {copiedField === 'password' ? (
                      <Check size={20} className="text-green-600" />
                    ) : (
                      <Copy size={20} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-base">💡</span>
              <span>請提醒員工首次登入後更改密碼</span>
            </div>
          </div>

          <Button onClick={handleCloseSuccess} className="w-full bg-morandi-gold hover:bg-morandi-gold/90 text-white rounded-lg py-2.5">
            完成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}