'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Employee } from '@/stores/types';
import { useUserStore } from '@/stores/user-store';
import { hashPassword } from '@/lib/auth';

interface AddEmployeeFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export function AddEmployeeForm({ onSubmit, onCancel }: AddEmployeeFormProps) {
  const { addUser, generateUserNumber, loadUsersFromDatabase } = useUserStore();

  const [formData, setFormData] = useState({
    englishName: '',
    chineseName: '',
    defaultPassword: 'venturo123', // 預設密碼
    personalInfo: {
      nationalId: '',
      birthday: '',
      gender: 'male' as 'male' | 'female',
      phone: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    },
    jobInfo: {
      department: '',
      position: '',
      hireDate: new Date().toISOString().split('T')[0],
      employmentType: 'fulltime' as Employee['jobInfo']['employmentType']
    },
    salaryInfo: {
      baseSalary: 0,
      allowances: [],
      salaryHistory: []
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.englishName.trim() || !formData.chineseName.trim()) {
      alert('請填寫姓名');
      return;
    }

    try {
      // 生成員工編號
      const employeeNumber = generateUserNumber(formData.englishName);

      // 加密預設密碼
      const hashedPassword = await hashPassword(formData.defaultPassword);

      // 建立資料庫員工記錄
      const dbEmployeeData = {
        employee_number: employeeNumber,
        english_name: formData.englishName,
        chinese_name: formData.chineseName,
        password_hash: hashedPassword,
        personal_info: {
          national_id: formData.personalInfo.nationalId,
          birthday: formData.personalInfo.birthday,
          gender: formData.personalInfo.gender,
          phone: formData.personalInfo.phone,
          email: formData.personalInfo.email,
          address: formData.personalInfo.address,
          emergency_contact: {
            name: formData.personalInfo.emergencyContact.name,
            relationship: formData.personalInfo.emergencyContact.relationship,
            phone: formData.personalInfo.emergencyContact.phone
          }
        },
        job_info: {
          department: formData.jobInfo.department,
          position: formData.jobInfo.position,
          hire_date: formData.jobInfo.hireDate,
          employment_type: formData.jobInfo.employmentType
        },
        salary_info: {
          base_salary: formData.salaryInfo.baseSalary,
          allowances: [],
          salary_history: [
            {
              effective_date: formData.jobInfo.hireDate,
              base_salary: formData.salaryInfo.baseSalary,
              reason: '入職起薪'
            }
          ]
        },
        permissions: [], // 初始無權限，需要後續設定
        status: 'active' // 新員工預設為在職狀態
      };

      // 儲存到本地（純本地模式）
      addUser(dbEmployeeData);

      console.log('📦 本地模式：員工已新增', employeeNumber);

      alert(`員工 ${formData.chineseName} 已成功創建！\n\n員工編號: ${employeeNumber}\n預設密碼: ${formData.defaultPassword}\n\n請提醒員工首次登入後更改密碼。`);
      onSubmit();
    } catch (error) {
      console.error('創建員工失敗:', error);
      alert('創建員工失敗，請稍後再試');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本資料 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-morandi-primary border-b pb-2">基本資料</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              中文姓名 *
            </label>
            <Input
              value={formData.chineseName}
              onChange={(e) => setFormData({ ...formData, chineseName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              英文姓名 * (用於生成員工編號)
            </label>
            <Input
              value={formData.englishName}
              onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
              placeholder="例：John"
              required
            />
            {formData.englishName && (
              <p className="text-xs text-morandi-muted mt-1">
                員工編號將為：{generateUserNumber(formData.englishName)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">身分證號</label>
            <Input
              value={formData.personalInfo.nationalId}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, nationalId: e.target.value }
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">性別</label>
            <select
              value={formData.personalInfo.gender}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, gender: e.target.value as 'male' | 'female' }
              })}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary"
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">生日</label>
            <Input
              type="date"
              value={formData.personalInfo.birthday}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, birthday: e.target.value }
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">電話</label>
            <Input
              value={formData.personalInfo.phone}
              onChange={(e) => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, phone: e.target.value }
              })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">Email</label>
          <Input
            type="email"
            value={formData.personalInfo.email}
            onChange={(e) => setFormData({
              ...formData,
              personalInfo: { ...formData.personalInfo, email: e.target.value }
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
      </div>

      {/* 職務資料 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-morandi-primary border-b pb-2">職務資料</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">部門</label>
            <Input
              value={formData.jobInfo.department}
              onChange={(e) => setFormData({
                ...formData,
                jobInfo: { ...formData.jobInfo, department: e.target.value }
              })}
              placeholder="例：業務部"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">職位</label>
            <Input
              value={formData.jobInfo.position}
              onChange={(e) => setFormData({
                ...formData,
                jobInfo: { ...formData.jobInfo, position: e.target.value }
              })}
              placeholder="例：業務專員"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">入職日期</label>
            <Input
              type="date"
              value={formData.jobInfo.hireDate}
              onChange={(e) => setFormData({
                ...formData,
                jobInfo: { ...formData.jobInfo, hireDate: e.target.value }
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">雇用類型</label>
            <select
              value={formData.jobInfo.employmentType}
              onChange={(e) => setFormData({
                ...formData,
                jobInfo: { ...formData.jobInfo, employmentType: e.target.value as Employee['jobInfo']['employmentType'] }
              })}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary"
            >
              <option value="fulltime">全職</option>
              <option value="parttime">兼職</option>
              <option value="contract">約聘</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">起薪</label>
          <Input
            type="number"
            value={formData.salaryInfo.baseSalary}
            onChange={(e) => setFormData({
              ...formData,
              salaryInfo: { ...formData.salaryInfo, baseSalary: Number(e.target.value) }
            })}
            placeholder="0"
          />
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
  );
}