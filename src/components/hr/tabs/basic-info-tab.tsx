'use client';

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Employee } from '@/stores/types';
import { useUserStore } from '@/stores/user-store';
import { User, Phone, Mail, MapPin, Calendar, Edit, Save, X, Lock, Eye, EyeOff } from 'lucide-react';

interface BasicInfoTabProps {
  employee: Employee;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

export const BasicInfoTab = forwardRef<{ handleSave: () => void }, BasicInfoTabProps>(
  ({ employee, isEditing, setIsEditing }, ref) => {
  const { updateUser } = useUserStore();
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);

  console.log('🔍 BasicInfoTab employee:', employee);
  console.log('🔍 personalInfo:', employee.personalInfo);
  console.log('🔍 emergencyContact:', employee.personalInfo?.emergencyContact);

  const [formData, setFormData] = useState({
    chineseName: employee.chineseName || '',
    englishName: employee.englishName || '',
    personalInfo: {
      nationalId: employee.personalInfo?.nationalId || '',
      birthday: employee.personalInfo?.birthday || '',
      gender: employee.personalInfo?.gender || 'male',
      phone: employee.personalInfo?.phone || '',
      email: employee.personalInfo?.email || '',
      address: employee.personalInfo?.address || '',
      emergencyContact: {
        name: employee.personalInfo?.emergencyContact?.name || '',
        relationship: employee.personalInfo?.emergencyContact?.relationship || '',
        phone: employee.personalInfo?.emergencyContact?.phone || ''
      }
    },
    jobInfo: {
      department: employee.jobInfo?.department || '',
      position: employee.jobInfo?.position || '',
      supervisor: employee.jobInfo?.supervisor || '',
      hireDate: employee.jobInfo?.hireDate || '',
      probationEndDate: employee.jobInfo?.probationEndDate || '',
      employmentType: employee.jobInfo?.employmentType || 'fulltime'
    }
  });

  const handleSave = async () => {
    // 如果英文名字改變了，同時更新員工編號
    const updates = { ...formData };
    if (formData.englishName !== employee.englishName) {
      const { generateUserNumber } = useUserStore.getState();
      updates.employeeNumber = generateUserNumber(formData.englishName);
    }

    await updateUser(employee.id, updates);
    setIsEditing(false);
  };

  // 將 handleSave 暴露給父組件
  useImperativeHandle(ref, () => ({
    handleSave
  }));

  const handleCancel = () => {
    setFormData({
      chineseName: employee.chineseName || '',
      englishName: employee.englishName || '',
      personalInfo: {
        nationalId: employee.personalInfo?.nationalId || '',
        birthday: employee.personalInfo?.birthday || '',
        gender: employee.personalInfo?.gender || 'male',
        phone: employee.personalInfo?.phone || '',
        email: employee.personalInfo?.email || '',
        address: employee.personalInfo?.address || '',
        emergencyContact: {
          name: employee.personalInfo?.emergencyContact?.name || '',
          relationship: employee.personalInfo?.emergencyContact?.relationship || '',
          phone: employee.personalInfo?.emergencyContact?.phone || ''
        }
      },
      jobInfo: {
        department: employee.jobInfo?.department || '',
        position: employee.jobInfo?.position || '',
        supervisor: employee.jobInfo?.supervisor || '',
        hireDate: employee.jobInfo?.hireDate || '',
        probationEndDate: employee.jobInfo?.probationEndDate || '',
        employmentType: employee.jobInfo?.employmentType || 'fulltime'
      }
    });
    setIsEditing(false);
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('新密碼與確認密碼不符！');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('密碼長度至少需要8個字元！');
      return;
    }

    setPasswordUpdateLoading(true);

    try {
      // 導入密碼加密函數
      const { hashPassword } = await import('@/lib/auth');
      const hashedPassword = await hashPassword(passwordData.newPassword);

      // 導入 Supabase client
      const { supabase } = await import('@/lib/supabase/client');

      const { error } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('employee_number', employee.employeeNumber);

      if (error) {
        console.error('密碼更新失敗:', error);
        alert('密碼更新失敗：' + error.message);
        return;
      }

      alert(`成功更新 ${employee.chineseName} 的密碼！`);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (error) {
      console.error('密碼更新過程中發生錯誤:', error);
      alert('密碼更新失敗，請稍後再試');
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：個人基本資料 */}
        <div className="space-y-6">
          <div className="bg-morandi-container/10 rounded-lg p-4">
            <h4 className="font-medium text-morandi-primary mb-3">個人資料</h4>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    中文姓名
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.chineseName}
                      onChange={(e) => setFormData({ ...formData, chineseName: e.target.value })}
                    />
                  ) : (
                    <p className="text-morandi-primary py-2">{employee.chineseName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    英文姓名
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.englishName}
                      onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                    />
                  ) : (
                    <p className="text-morandi-primary py-2">{employee.englishName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  員工編號
                </label>
                <p className="text-morandi-primary py-2 bg-morandi-container/20 px-3 rounded">
                  {employee.employeeNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    身分證號
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.personalInfo.nationalId}
                      onChange={(e) => setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, nationalId: e.target.value }
                      })}
                    />
                  ) : (
                    <p className="text-morandi-primary py-2">{employee.personalInfo.nationalId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    性別
                  </label>
                  {isEditing ? (
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
                  ) : (
                    <p className="text-morandi-primary py-2">
                      {employee.personalInfo.gender === 'male' ? '男' : '女'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center gap-1">
                  <Calendar size={14} />
                  生日
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.personalInfo.birthday}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, birthday: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">
                    {new Date(employee.personalInfo.birthday).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 聯絡資訊 */}
          <div className="bg-morandi-container/10 rounded-lg p-4">
            <h4 className="font-medium text-morandi-primary mb-3">聯絡資訊</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center gap-1">
                  <Phone size={14} />
                  電話
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personalInfo.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, phone: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personalInfo.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center gap-1">
                  <Mail size={14} />
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.personalInfo.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, email: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personalInfo.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center gap-1">
                  <MapPin size={14} />
                  地址
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personalInfo.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, address: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personalInfo.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右側：職務資料與緊急聯絡人 */}
        <div className="space-y-6">
          {/* 職務資料 */}
          <div className="bg-morandi-container/10 rounded-lg p-4">
            <h4 className="font-medium text-morandi-primary mb-3">職務資料</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  部門
                </label>
                {isEditing ? (
                  <Input
                    value={formData.jobInfo.department}
                    onChange={(e) => setFormData({
                      ...formData,
                      jobInfo: { ...formData.jobInfo, department: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.jobInfo.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  職位
                </label>
                {isEditing ? (
                  <Input
                    value={formData.jobInfo.position}
                    onChange={(e) => setFormData({
                      ...formData,
                      jobInfo: { ...formData.jobInfo, position: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.jobInfo.position}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  入職日期
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.jobInfo.hireDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      jobInfo: { ...formData.jobInfo, hireDate: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">
                    {new Date(employee.jobInfo.hireDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  雇用類型
                </label>
                {isEditing ? (
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
                ) : (
                  <p className="text-morandi-primary py-2">
                    {employee.jobInfo.employmentType === 'fulltime' ? '全職' :
                     employee.jobInfo.employmentType === 'parttime' ? '兼職' : '約聘'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 緊急聯絡人 */}
          <div className="bg-morandi-container/10 rounded-lg p-4">
            <h4 className="font-medium text-morandi-primary mb-3">緊急聯絡人</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  姓名
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personalInfo.emergencyContact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: {
                        ...formData.personalInfo,
                        emergencyContact: {
                          ...formData.personalInfo.emergencyContact,
                          name: e.target.value
                        }
                      }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personalInfo.emergencyContact.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  關係
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personalInfo.emergencyContact.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: {
                        ...formData.personalInfo,
                        emergencyContact: {
                          ...formData.personalInfo.emergencyContact,
                          relationship: e.target.value
                        }
                      }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personalInfo.emergencyContact.relationship}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  電話
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personalInfo.emergencyContact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: {
                        ...formData.personalInfo,
                        emergencyContact: {
                          ...formData.personalInfo.emergencyContact,
                          phone: e.target.value
                        }
                      }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personalInfo.emergencyContact.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* 密碼管理區塊 */}
          <div className="bg-morandi-container/10 rounded-lg p-4 border-l-4 border-morandi-gold">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-morandi-primary flex items-center gap-2">
                <Lock size={16} />
                密碼管理
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-sm"
              >
                {showPasswordSection ? '取消' : '修改密碼'}
              </Button>
            </div>

            {!showPasswordSection && (
              <p className="text-sm text-morandi-muted">
                點擊「修改密碼」為 {employee.chineseName} 設定新密碼
              </p>
            )}

            {showPasswordSection && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    新密碼
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      placeholder="至少8個字元"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    確認新密碼
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                    placeholder="再次輸入新密碼"
                  />
                </div>

                {passwordData.newPassword && passwordData.confirmPassword && (
                  <div className="text-sm">
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <span className="text-green-600">✓ 密碼確認一致</span>
                    ) : (
                      <span className="text-red-600">✗ 密碼確認不一致</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handlePasswordUpdate}
                    disabled={passwordUpdateLoading || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword || passwordData.newPassword.length < 8}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover"
                  >
                    {passwordUpdateLoading ? '更新中...' : '更新密碼'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({ newPassword: '', confirmPassword: '' });
                    }}
                  >
                    取消
                  </Button>
                </div>

                <div className="text-xs text-morandi-muted bg-morandi-container/30 p-2 rounded">
                  <p>📝 密碼要求：</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>至少8個字元</li>
                    <li>建議包含數字和字母</li>
                    <li>員工下次登入時需要使用新密碼</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

BasicInfoTab.displayName = 'BasicInfoTab';