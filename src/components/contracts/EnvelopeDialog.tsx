'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tour, EnvelopeRecord } from '@/types/tour.types';
import { useAuthStore } from '@/stores/auth-store';
import { useTourStore } from '@/stores';
import { generateUUID } from '@/lib/utils/uuid';

interface EnvelopeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
}

export function EnvelopeDialog({ isOpen, onClose, tour }: EnvelopeDialogProps) {
  const { user } = useAuthStore();
  const { update: updateTour } = useTourStore();
  const [recipient, setRecipient] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // 寄件人資訊
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const senderAddress = '台北市大同區重慶北路一段67號8樓之2';
  const senderCompany = '角落旅行社';

  useEffect(() => {
    if (isOpen && user) {
      // 從 HR 帶入員工資料
      setSenderName(user.display_name || user.username || '');
      // 從 user 物件取得電話，如果沒有就使用公司總機（可手動修改）
      const userPhone = (user as Record<string, unknown>).phone || (user as Record<string, unknown>).mobile || '';
      setSenderPhone(userPhone || '02-7751-6051');
    } else if (!isOpen) {
      // 對話框關閉時重置欄位
      setRecipient('');
      setRecipientAddress('');
      setRecipientPhone('');
      setSenderName('');
      setSenderPhone('');
    }
  }, [isOpen, user]);

  const handlePrint = async () => {
    if (!recipient || !recipientAddress || !recipientPhone) {
      alert('請填寫完整的收件人資訊');
      return;
    }

    if (!senderName || !senderPhone) {
      alert('請填寫完整的寄件人資訊(姓名和電話)');
      return;
    }

    // 儲存寄件紀錄
    try {
      const newRecord: EnvelopeRecord = {
        id: generateUUID(),
        printed_at: new Date().toISOString(),
        recipient_name: recipient,
        recipient_address: recipientAddress,
        recipient_phone: recipientPhone,
        sender_name: senderName,
        sender_phone: senderPhone,
      };

      // 取得現有紀錄
      let existingRecords: EnvelopeRecord[] = [];
      if (tour.envelope_records) {
        try {
          existingRecords = JSON.parse(tour.envelope_records);
        } catch {
          existingRecords = [];
        }
      }

      // 新增紀錄
      const updatedRecords = [...existingRecords, newRecord];

      // 更新 tour
      await updateTour(tour.id, {
        envelope_records: JSON.stringify(updatedRecords),
      });

    } catch (error) {
            // 繼續列印，不因儲存失敗而中斷
    }

    // 產生列印內容
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('請允許彈出視窗以進行列印');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>信封標籤 - ${tour.code}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              width: 297mm;
              height: 210mm;
              padding: 15mm;
              font-family: "Microsoft JhengHei", "微軟正黑體", sans-serif;
              background: white;
            }

            .envelope-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              border: 2px solid #333;
              padding: 20mm;
              position: relative;
            }

            .section {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .sender-section {
              position: absolute;
              top: 20mm;
              left: 20mm;
              align-items: flex-start;
              text-align: left;
            }

            .recipient-section {
              position: absolute;
              top: 60%;
              right: 40mm;
              transform: translateY(-50%);
              align-items: flex-start;
              text-align: left;
            }

            .label {
              font-size: 14pt;
              color: #666;
              font-weight: 500;
            }

            .company {
              font-size: 18pt;
              font-weight: bold;
              color: #c9b896;
              margin-bottom: 4px;
            }

            .name {
              font-size: 28pt;
              font-weight: bold;
              color: #333;
              margin-bottom: 8px;
            }

            .address {
              font-size: 18pt;
              color: #333;
              line-height: 1.8;
              margin-bottom: 6px;
            }

            .phone {
              font-size: 16pt;
              color: #666;
            }

            .recipient-section .name {
              font-size: 36pt;
            }

            .sender-section .name {
              font-size: 18pt;
            }

            .sender-section .company {
              font-size: 16pt;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="envelope-container">
            <!-- 寄件人 (左上角) -->
            <div class="section sender-section">
              <div class="label">寄件人</div>
              <div class="company">${senderCompany}</div>
              <div class="name">${senderName}</div>
              <div class="address">${senderAddress}</div>
              <div class="phone">電話：${senderPhone}</div>
            </div>

            <!-- 收件人 (中間) -->
            <div class="section recipient-section">
              <div class="label">收件人</div>
              <div class="name">${recipient}</div>
              <div class="address">${recipientAddress}</div>
              <div class="phone">電話：${recipientPhone}</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              // 列印後關閉視窗
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={20} />
            列印信封標籤
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 旅遊團資訊 */}
          <div className="bg-morandi-container/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-morandi-primary mb-2">旅遊團資訊</h3>
            <div className="text-sm text-morandi-primary">
              {tour.code} - {tour.name}
            </div>
          </div>

          {/* 收件人資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">收件人資訊</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">收件人姓名 *</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="請輸入收件人姓名"
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">收件地址 *</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="請輸入收件地址"
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">收件人電話 *</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="請輸入收件人電話"
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 寄件人資訊 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">寄件人資訊</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-morandi-secondary block mb-1">公司名稱</label>
                  <input
                    type="text"
                    value={senderCompany}
                    readOnly
                    className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-morandi-secondary cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs text-morandi-secondary block mb-1">
                    員工姓名 <span className="text-morandi-gold">*</span>
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="請輸入員工姓名（可修改）"
                    className="w-full p-2 border-2 border-morandi-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold focus:border-morandi-gold text-sm bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">公司地址</label>
                <input
                  type="text"
                  value={senderAddress}
                  readOnly
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-morandi-secondary cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs text-morandi-secondary block mb-1">
                  聯絡電話 <span className="text-morandi-gold">*</span>
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="請輸入聯絡電話（可修改）"
                  className="w-full p-2 border-2 border-morandi-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold focus:border-morandi-gold text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-morandi-secondary bg-morandi-container/20 p-3 rounded">
            提示：列印時會自動產生橫向 A4 格式的信封標籤
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            列印
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
