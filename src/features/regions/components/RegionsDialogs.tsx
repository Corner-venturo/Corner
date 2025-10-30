'use client';

import { useState, useEffect } from 'react';
import { FormDialog } from '@/components/dialog';
import { Input } from '@/components/ui/input';
import type { City } from '@/stores';

// ============================================
// 新增國家對話框
// ============================================

interface AddCountryDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
}

export function AddCountryDialog({ open, onClose, onCreate }: AddCountryDialogProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    name_en: '',
    emoji: '',
    code: '',
    has_regions: false,
    display_order: 0,
    is_active: true,
  });

  const handleSubmit = async () => {
    const result = await onCreate(formData);
    if (result) {
      onClose();
      setFormData({
        id: '',
        name: '',
        name_en: '',
        emoji: '',
        code: '',
        has_regions: false,
        display_order: 0,
        is_active: true,
      });
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title="新增國家"
      onSubmit={handleSubmit}
      submitLabel="新增"
      submitDisabled={!formData.id || !formData.name || !formData.name_en}
      maxWidth="md"
    >
      <div>
        <label className="text-sm font-medium">ID（英文）*</label>
        <Input
          value={formData.id}
          onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
          placeholder="例如: japan"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">中文名稱 *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="例如: 日本"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">英文名稱 *</label>
        <Input
          value={formData.name_en}
          onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
          placeholder="例如: Japan"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Emoji</label>
        <Input
          value={formData.emoji}
          onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
          placeholder="例如: 🇯🇵"
        />
      </div>
      <div>
        <label className="text-sm font-medium">國家代碼</label>
        <Input
          value={formData.code}
          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
          placeholder="例如: JP"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.has_regions}
          onChange={(e) => setFormData(prev => ({ ...prev, has_regions: e.target.checked }))}
          className="w-4 h-4"
        />
        <label className="text-sm">此國家有地區分類（如日本的九州、關東）</label>
      </div>
    </FormDialog>
  );
}

// ============================================
// 新增地區對話框
// ============================================

interface AddRegionDialogProps {
  open: boolean;
  onClose: () => void;
  countryId: string;
  onCreate: (data: any) => Promise<any>;
}

export function AddRegionDialog({ open, onClose, countryId, onCreate }: AddRegionDialogProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    name_en: '',
    display_order: 0,
    is_active: true,
  });

  const handleSubmit = async () => {
    const result = await onCreate({
      ...formData,
      country_id: countryId,
    });
    if (result) {
      onClose();
      setFormData({
        id: '',
        name: '',
        name_en: '',
        display_order: 0,
        is_active: true,
      });
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title="新增地區"
      onSubmit={handleSubmit}
      submitLabel="新增"
      submitDisabled={!formData.id || !formData.name}
      maxWidth="md"
    >
      <div>
        <label className="text-sm font-medium">ID（英文）*</label>
        <Input
          value={formData.id}
          onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
          placeholder="例如: kyushu"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">中文名稱 *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="例如: 九州"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">英文名稱</label>
        <Input
          value={formData.name_en}
          onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
          placeholder="例如: Kyushu"
        />
      </div>
    </FormDialog>
  );
}

// ============================================
// 新增城市對話框
// ============================================

interface AddCityDialogProps {
  open: boolean;
  onClose: () => void;
  countryId: string;
  regionId?: string;
  onCreate: (data: any) => Promise<any>;
}

export function AddCityDialog({ open, onClose, countryId, regionId, onCreate }: AddCityDialogProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    name_en: '',
    airport_code: '',
    display_order: 0,
    is_active: true,
  });

  const handleSubmit = async () => {
    const result = await onCreate({
      ...formData,
      country_id: countryId,
      region_id: regionId || null,
    });
    if (result) {
      onClose();
      setFormData({
        id: '',
        name: '',
        name_en: '',
        airport_code: '',
        display_order: 0,
        is_active: true,
      });
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title="新增城市"
      onSubmit={handleSubmit}
      submitLabel="新增"
      submitDisabled={!formData.id || !formData.name}
      maxWidth="md"
    >
      <div>
        <label className="text-sm font-medium">ID（英文）*</label>
        <Input
          value={formData.id}
          onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
          placeholder="例如: fukuoka"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">中文名稱 *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="例如: 福岡"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">英文名稱</label>
        <Input
          value={formData.name_en}
          onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
          placeholder="例如: Fukuoka"
        />
      </div>
      <div>
        <label className="text-sm font-medium">機場代碼（3 碼）</label>
        <Input
          value={formData.airport_code}
          onChange={(e) => {
            const value = e.target.value.toUpperCase().slice(0, 3);
            setFormData(prev => ({ ...prev, airport_code: value }));
          }}
          placeholder="例如: FUK"
          maxLength={3}
        />
        <p className="text-xs text-morandi-secondary mt-1">
          用於生成團號，建議使用 IATA 機場代碼
        </p>
      </div>
    </FormDialog>
  );
}

// ============================================
// 編輯城市對話框
// ============================================

interface EditCityDialogProps {
  open: boolean;
  onClose: () => void;
  city: City | null;
  onUpdate: (id: string, data: any) => Promise<any>;
}

export function EditCityDialog({ open, onClose, city, onUpdate }: EditCityDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    airport_code: '',
    timezone: '',
  });

  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name,
        name_en: city.name_en || '',
        airport_code: city.airport_code || '',
        timezone: city.timezone || '',
      });
    }
  }, [city]);

  const handleSubmit = async () => {
    if (!city) return;

    const result = await onUpdate(city.id, formData);
    if (result) {
      onClose();
    }
  };

  if (!city) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title="編輯城市"
      onSubmit={handleSubmit}
      submitLabel="儲存"
      submitDisabled={!formData.name}
      maxWidth="md"
    >
      <div>
        <label className="text-sm font-medium">中文名稱 *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="例如: 福岡"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">英文名稱</label>
        <Input
          value={formData.name_en}
          onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
          placeholder="例如: Fukuoka"
        />
      </div>
      <div>
        <label className="text-sm font-medium">機場代碼（3 碼）</label>
        <Input
          value={formData.airport_code}
          onChange={(e) => {
            const value = e.target.value.toUpperCase().slice(0, 3);
            setFormData(prev => ({ ...prev, airport_code: value }));
          }}
          placeholder="例如: FUK"
          maxLength={3}
        />
        <p className="text-xs text-morandi-secondary mt-1">
          用於生成團號，建議使用 IATA 機場代碼
        </p>
      </div>
      <div>
        <label className="text-sm font-medium">時區（IANA 格式）</label>
        <Input
          value={formData.timezone}
          onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
          placeholder="例如: Asia/Tokyo"
        />
        <p className="text-xs text-morandi-secondary mt-1">
          IANA 時區標識符，會自動處理夏令時（例如歐美冬令時）
        </p>
      </div>
    </FormDialog>
  );
}
