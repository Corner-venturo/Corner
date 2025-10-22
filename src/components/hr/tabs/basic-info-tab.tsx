'use client';

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Employee } from '@/stores/types';
import { useUserStore, userStoreHelpers } from '@/stores/user-store';
import { User, Phone, Mail, MapPin, Calendar, Edit, Save, X, Lock, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

interface BasicInfoTabProps {
  employee: Employee;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

export const BasicInfoTab = forwardRef<{ handleSave: () => void }, BasicInfoTabProps>(
  ({ employee, isEditing, setIsEditing }, ref) => {
  const { update: updateUser } = useUserStore();
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);

  console.log('🔍 BasicInfoTab employee:', employee);
  console.log('🔍 personal_info:', employee.personal_info);
  console.log('🔍 emergency_contact:', employee.personal_info?.emergency_contact);

  const [formData, setFormData] = useState({
    display_name: employee.display_name || '',
    chinese_name: (employee as any).chinese_name || '',
    english_name: employee.english_name || '',
    personal_info: {
      national_id: employee.personal_info?.national_id || '',
      birthday: employee.personal_info?.birthday || '',
      phone: Array.isArray(employee.personal_info?.phone)
        ? employee.personal_info.phone
        : employee.personal_info?.phone
          ? [employee.personal_info.phone]
          : [''],
      email: employee.personal_info?.email || '',
      address: employee.personal_info?.address || '',
      emergency_contact: {
        name: employee.personal_info?.emergency_contact?.name || '',
        relationship: employee.personal_info?.emergency_contact?.relationship || '',
        phone: employee.personal_info?.emergency_contact?.phone || ''
      }
    },
    job_info: {
      supervisor: employee.job_info?.supervisor || '',
      hire_date: employee.job_info?.hire_date || '',
      probation_end_date: employee.job_info?.probation_end_date || ''
    }
  });

  const handleSave = async () => {
    console.log('🔵 [BasicInfoTab] handleSave 開始執行');
    console.log('🔵 [BasicInfoTab] formData:', formData);
    console.log('🔵 [BasicInfoTab] employee.id:', employee.id);

    // 如果英文名字改變了，同時更新員工編號
    const updates: any = { ...formData };

    if (formData.english_name !== employee.english_name) {
      console.log('🔵 [BasicInfoTab] 英文名字有變更，重新生成員工編號');
      (updates as any).employee_number = userStoreHelpers.generateUserNumber(formData.english_name);
    }

    console.log('🔵 [BasicInfoTab] 準備更新，updates:', updates);

    try {
      await updateUser(employee.id, updates);
      console.log('✅ [BasicInfoTab] 更新成功');
      setIsEditing(false);
    } catch (error) {
      console.error('❌ [BasicInfoTab] 更新失敗:', error);
      alert('儲存失敗：' + (error as Error).message);
    }
  };

  // 將 handleSave 暴露給父組件
  useImperativeHandle(ref, () => ({
    handleSave
  }));

  const handleCancel = () => {
    setFormData({
      display_name: employee.display_name || '',
      chinese_name: (employee as any).chinese_name || '',
      english_name: employee.english_name || '',
      personal_info: {
        national_id: employee.personal_info?.national_id || '',
        birthday: employee.personal_info?.birthday || '',
        phone: Array.isArray(employee.personal_info?.phone)
          ? employee.personal_info.phone
          : employee.personal_info?.phone
            ? [employee.personal_info.phone]
            : [''],
        email: employee.personal_info?.email || '',
        address: employee.personal_info?.address || '',
        emergency_contact: {
          name: employee.personal_info?.emergency_contact?.name || '',
          relationship: employee.personal_info?.emergency_contact?.relationship || '',
          phone: employee.personal_info?.emergency_contact?.phone || ''
        }
      },
      job_info: {
        supervisor: employee.job_info?.supervisor || '',
        hire_date: employee.job_info?.hire_date || '',
        probation_end_date: employee.job_info?.probation_end_date || ''
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

      const result: any = await (supabase as any)
        .from('employees')
        .update({ password_hash: hashedPassword })
        .eq('employee_number', employee.employee_number);

      const { error } = result;

      if (error) {
        console.error('密碼更新失敗:', error);
        alert('密碼更新失敗：' + error.message);
        return;
      }

      alert(`成功更新 ${employee.display_name} 的密碼！`);
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
                    顯示名稱
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-morandi-primary py-2">{employee.display_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    中文姓名
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.chinese_name}
                      onChange={(e) => setFormData({ ...formData, chinese_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-morandi-primary py-2">{(employee as any).chinese_name || '-'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    英文姓名
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.english_name}
                      onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-morandi-primary py-2">{employee.english_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-morandi-primary mb-1">
                    員工編號
                  </label>
                  <p className="text-morandi-primary py-2 bg-morandi-container/20 px-3 rounded">
                    {employee.employee_number}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  身分證號
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personal_info.national_id}
                    onChange={(e) => setFormData({
                      ...formData,
                      personal_info: { ...formData.personal_info, national_id: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personal_info.national_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center gap-1">
                  <Calendar size={14} />
                  生日
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.personal_info.birthday}
                    onChange={(e) => setFormData({
                      ...formData,
                      personal_info: { ...formData.personal_info, birthday: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">
                    {new Date(employee.personal_info.birthday).toLocaleDateString()}
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
                <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone size={14} />
                    聯絡電話
                  </span>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const phones = Array.isArray(formData.personal_info.phone)
                          ? formData.personal_info.phone
                          : [formData.personal_info.phone];
                        setFormData({
                          ...formData,
                          personal_info: {
                            ...formData.personal_info,
                            phone: [...phones, '']
                          }
                        });
                      }}
                      className="h-6 text-xs"
                    >
                      <Plus size={12} className="mr-1" />
                      新增電話
                    </Button>
                  )}
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    {(Array.isArray(formData.personal_info.phone)
                      ? formData.personal_info.phone
                      : [formData.personal_info.phone]
                    ).map((phone, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => {
                            const phones = Array.isArray(formData.personal_info.phone)
                              ? [...formData.personal_info.phone]
                              : [formData.personal_info.phone];
                            phones[index] = e.target.value;
                            setFormData({
                              ...formData,
                              personal_info: { ...formData.personal_info, phone: phones }
                            });
                          }}
                          placeholder={`電話 ${index + 1}`}
                        />
                        {(Array.isArray(formData.personal_info.phone)
                          ? formData.personal_info.phone.length
                          : 1) > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const phones = Array.isArray(formData.personal_info.phone)
                                ? formData.personal_info.phone.filter((_, i) => i !== index)
                                : [];
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
                ) : (
                  <div className="space-y-1">
                    {(Array.isArray(employee.personal_info.phone)
                      ? employee.personal_info.phone
                      : [employee.personal_info.phone]
                    ).map((phone, index) => (
                      <p key={index} className="text-morandi-primary py-2">
                        {phone || '-'}
                      </p>
                    ))}
                  </div>
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
                    value={formData.personal_info.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      personal_info: { ...formData.personal_info, email: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personal_info.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center gap-1">
                  <MapPin size={14} />
                  地址
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personal_info.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      personal_info: { ...formData.personal_info, address: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personal_info.address}</p>
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
                  入職日期
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.job_info.hire_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      job_info: { ...formData.job_info, hire_date: e.target.value }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">
                    {new Date(employee.job_info.hire_date).toLocaleDateString()}
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
                    value={formData.personal_info.emergency_contact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      personal_info: {
                        ...formData.personal_info,
                        emergency_contact: {
                          ...formData.personal_info.emergency_contact,
                          name: e.target.value
                        }
                      }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personal_info?.emergency_contact?.name || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  關係
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personal_info.emergency_contact.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      personal_info: {
                        ...formData.personal_info,
                        emergency_contact: {
                          ...formData.personal_info.emergency_contact,
                          relationship: e.target.value
                        }
                      }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personal_info?.emergency_contact?.relationship || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  電話
                </label>
                {isEditing ? (
                  <Input
                    value={formData.personal_info.emergency_contact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      personal_info: {
                        ...formData.personal_info,
                        emergency_contact: {
                          ...formData.personal_info.emergency_contact,
                          phone: e.target.value
                        }
                      }
                    })}
                  />
                ) : (
                  <p className="text-morandi-primary py-2">{employee.personal_info?.emergency_contact?.phone || '-'}</p>
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
                點擊「修改密碼」為 {employee.display_name} 設定新密碼
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