'use client';

import React from 'react';
import { morandiColors } from '@/lib/constants/morandi-colors';
import { ParticipantCounts } from '../types';

interface PrintableQuotationProps {
  quote: any;
  quoteName: string;
  participantCounts: ParticipantCounts;
  sellingPrices: {
    adult: number;
    child_with_bed: number;
    child_no_bed: number;
    single_room: number;
    infant: number;
  };
  categories: any[];
  totalCost: number;
}

export const PrintableQuotation: React.FC<PrintableQuotationProps> = ({
  quote,
  quoteName,
  participantCounts,
  sellingPrices,
  categories,
  totalCost,
}) => {
  // 計算總收入
  const totalRevenue =
    (participantCounts.adult * sellingPrices.adult) +
    (participantCounts.child_with_bed * sellingPrices.child_with_bed) +
    (participantCounts.child_no_bed * sellingPrices.child_no_bed) +
    (participantCounts.single_room * sellingPrices.single_room) +
    (participantCounts.infant * sellingPrices.infant);

  const totalProfit = totalRevenue - totalCost;

  // 整理行程包含項目（從 categories 中提取）
  const inclusions: string[] = [];
  const exclusions: string[] = [];

  categories.forEach(category => {
    if (category.items && category.items.length > 0) {
      category.items.forEach((item: any) => {
        if (item.description) {
          inclusions.push(`${category.label}: ${item.description}`);
        }
      });
    }
  });

  // 預設排除項目
  exclusions.push('個人消費及自費項目');
  exclusions.push('旅遊平安保險（建議自行投保）');
  exclusions.push('行李超重費用');
  exclusions.push('簽證費用（如需要）');

  return (
    <div
      className="fixed inset-0 bg-white z-[9999] overflow-auto print:relative print:inset-auto"
      style={{ display: 'none' }}
      id="printable-quotation"
    >
      <style>
        {`
          @media print {
            #printable-quotation {
              display: block !important;
            }

            @page {
              size: A4;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
            }

            .print\\:hidden {
              display: none !important;
            }

            .page-break {
              page-break-after: always;
            }
          }
        `}
      </style>

      {/* A4 容器 */}
      <div
        className="mx-auto bg-white shadow-2xl"
        style={{
          maxWidth: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          backgroundColor: morandiColors.background.main,
        }}
      >
        {/* 頁首：Logo 與品牌 */}
        <header className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: `2px solid ${morandiColors.border.gold}` }}>
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: morandiColors.text.primary }}>
              Venturo Travel
            </h1>
            <p className="text-sm" style={{ color: morandiColors.text.secondary }}>
              專業旅遊規劃 · 精緻行程安排
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm mb-1" style={{ color: morandiColors.text.secondary }}>
              報價單編號
            </div>
            <div className="text-lg font-bold font-mono" style={{ color: morandiColors.gold }}>
              {quote?.code || 'Q-XXXXX'}
            </div>
          </div>
        </header>

        {/* 行程標題 */}
        <section className="mb-8">
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: `linear-gradient(135deg, ${morandiColors.goldLight} 0%, ${morandiColors.background.cream} 100%)`,
              border: `1px solid ${morandiColors.border.gold}`,
            }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ color: morandiColors.text.primary }}>
              {quoteName || '精選旅遊行程'}
            </h2>
            <p className="text-sm" style={{ color: morandiColors.text.secondary }}>
              報價日期: {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </section>

        {/* 客戶資訊與承辦人資訊 */}
        <section className="grid grid-cols-2 gap-6 mb-8">
          {/* 客戶資訊 */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: morandiColors.background.white,
              border: `1px solid ${morandiColors.border.light}`,
            }}
          >
            <h3 className="text-sm font-bold mb-4 pb-2" style={{
              color: morandiColors.text.primary,
              borderBottom: `1px solid ${morandiColors.border.light}`
            }}>
              客戶資訊
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="w-20" style={{ color: morandiColors.text.secondary }}>姓名</span>
                <span className="flex-1 border-b" style={{ borderColor: morandiColors.border.light, color: morandiColors.text.primary }}>
                  _____________________
                </span>
              </div>
              <div className="flex">
                <span className="w-20" style={{ color: morandiColors.text.secondary }}>聯絡電話</span>
                <span className="flex-1 border-b" style={{ borderColor: morandiColors.border.light, color: morandiColors.text.primary }}>
                  _____________________
                </span>
              </div>
              <div className="flex">
                <span className="w-20" style={{ color: morandiColors.text.secondary }}>Email</span>
                <span className="flex-1 border-b" style={{ borderColor: morandiColors.border.light, color: morandiColors.text.primary }}>
                  _____________________
                </span>
              </div>
            </div>
          </div>

          {/* 承辦人資訊 */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: morandiColors.background.white,
              border: `1px solid ${morandiColors.border.light}`,
            }}
          >
            <h3 className="text-sm font-bold mb-4 pb-2" style={{
              color: morandiColors.text.primary,
              borderBottom: `1px solid ${morandiColors.border.light}`
            }}>
              承辦人資訊
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="w-20" style={{ color: morandiColors.text.secondary }}>姓名</span>
                <span className="flex-1" style={{ color: morandiColors.text.primary }}>王小明</span>
              </div>
              <div className="flex">
                <span className="w-20" style={{ color: morandiColors.text.secondary }}>聯絡電話</span>
                <span className="flex-1" style={{ color: morandiColors.text.primary }}>0912-345-678</span>
              </div>
              <div className="flex">
                <span className="w-20" style={{ color: morandiColors.text.secondary }}>Email</span>
                <span className="flex-1" style={{ color: morandiColors.text.primary }}>service@venturo.com</span>
              </div>
            </div>
          </div>
        </section>

        {/* 報價明細 */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4" style={{ color: morandiColors.text.primary }}>
            報價明細
          </h3>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: `1px solid ${morandiColors.border.light}`,
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: morandiColors.goldLight }}>
                  <th className="text-left py-3 px-4" style={{ color: morandiColors.text.primary }}>身份類別</th>
                  <th className="text-center py-3 px-4" style={{ color: morandiColors.text.primary }}>人數</th>
                  <th className="text-right py-3 px-4" style={{ color: morandiColors.text.primary }}>單價 (NT$)</th>
                  <th className="text-right py-3 px-4" style={{ color: morandiColors.text.primary }}>小計 (NT$)</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: morandiColors.background.white }}>
                {participantCounts.adult > 0 && (
                  <tr style={{ borderBottom: `1px solid ${morandiColors.border.light}` }}>
                    <td className="py-3 px-4" style={{ color: morandiColors.text.primary }}>成人</td>
                    <td className="text-center py-3 px-4" style={{ color: morandiColors.text.secondary }}>{participantCounts.adult}</td>
                    <td className="text-right py-3 px-4 font-medium" style={{ color: morandiColors.text.primary }}>
                      {sellingPrices.adult.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-bold" style={{ color: morandiColors.gold }}>
                      {(participantCounts.adult * sellingPrices.adult).toLocaleString()}
                    </td>
                  </tr>
                )}
                {participantCounts.child_with_bed > 0 && (
                  <tr style={{ borderBottom: `1px solid ${morandiColors.border.light}` }}>
                    <td className="py-3 px-4" style={{ color: morandiColors.text.primary }}>小孩佔床</td>
                    <td className="text-center py-3 px-4" style={{ color: morandiColors.text.secondary }}>{participantCounts.child_with_bed}</td>
                    <td className="text-right py-3 px-4 font-medium" style={{ color: morandiColors.text.primary }}>
                      {sellingPrices.child_with_bed.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-bold" style={{ color: morandiColors.gold }}>
                      {(participantCounts.child_with_bed * sellingPrices.child_with_bed).toLocaleString()}
                    </td>
                  </tr>
                )}
                {participantCounts.child_no_bed > 0 && (
                  <tr style={{ borderBottom: `1px solid ${morandiColors.border.light}` }}>
                    <td className="py-3 px-4" style={{ color: morandiColors.text.primary }}>小孩不佔床</td>
                    <td className="text-center py-3 px-4" style={{ color: morandiColors.text.secondary }}>{participantCounts.child_no_bed}</td>
                    <td className="text-right py-3 px-4 font-medium" style={{ color: morandiColors.text.primary }}>
                      {sellingPrices.child_no_bed.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-bold" style={{ color: morandiColors.gold }}>
                      {(participantCounts.child_no_bed * sellingPrices.child_no_bed).toLocaleString()}
                    </td>
                  </tr>
                )}
                {participantCounts.single_room > 0 && (
                  <tr style={{ borderBottom: `1px solid ${morandiColors.border.light}` }}>
                    <td className="py-3 px-4" style={{ color: morandiColors.text.primary }}>單人房</td>
                    <td className="text-center py-3 px-4" style={{ color: morandiColors.text.secondary }}>{participantCounts.single_room}</td>
                    <td className="text-right py-3 px-4 font-medium" style={{ color: morandiColors.text.primary }}>
                      {sellingPrices.single_room.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-bold" style={{ color: morandiColors.gold }}>
                      {(participantCounts.single_room * sellingPrices.single_room).toLocaleString()}
                    </td>
                  </tr>
                )}
                {participantCounts.infant > 0 && (
                  <tr style={{ borderBottom: `1px solid ${morandiColors.border.light}` }}>
                    <td className="py-3 px-4" style={{ color: morandiColors.text.primary }}>嬰兒</td>
                    <td className="text-center py-3 px-4" style={{ color: morandiColors.text.secondary }}>{participantCounts.infant}</td>
                    <td className="text-right py-3 px-4 font-medium" style={{ color: morandiColors.text.primary }}>
                      {sellingPrices.infant.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-bold" style={{ color: morandiColors.gold }}>
                      {(participantCounts.infant * sellingPrices.infant).toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr style={{ backgroundColor: morandiColors.goldLight }}>
                  <td colSpan={3} className="py-4 px-4 text-right font-bold" style={{ color: morandiColors.text.primary }}>
                    報價總額
                  </td>
                  <td className="text-right py-4 px-4 text-xl font-bold" style={{ color: morandiColors.gold }}>
                    NT$ {totalRevenue.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 費用包含 */}
        {inclusions.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: morandiColors.text.primary }}>
              費用包含
            </h3>
            <div
              className="rounded-2xl p-5"
              style={{
                backgroundColor: morandiColors.background.white,
                border: `1px solid ${morandiColors.border.light}`,
              }}
            >
              <ul className="space-y-2 text-sm">
                {inclusions.slice(0, 8).map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span
                      className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: morandiColors.gold }}
                    />
                    <span style={{ color: morandiColors.text.secondary }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 費用不包含 */}
        <section className="mb-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: morandiColors.text.primary }}>
            費用不包含
          </h3>
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: morandiColors.background.white,
              border: `1px solid ${morandiColors.border.light}`,
            }}
          >
            <ul className="space-y-2 text-sm">
              {exclusions.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span
                    className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: morandiColors.text.secondary }}
                  />
                  <span style={{ color: morandiColors.text.secondary }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 重要說明 */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4" style={{ color: morandiColors.text.primary }}>
            重要說明
          </h3>
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: morandiColors.background.cream,
              border: `1px solid ${morandiColors.border.medium}`,
            }}
          >
            <ul className="space-y-2 text-xs leading-relaxed" style={{ color: morandiColors.text.secondary }}>
              <li>1. 本報價單有效期限為報價日起 30 天內</li>
              <li>2. 行程內容可能因天候、交通等因素彈性調整</li>
              <li>3. 最終費用以簽約時確認之人數及價格為準</li>
              <li>4. 如有特殊需求請提前告知承辦人員</li>
              <li>5. 付款方式：訂金 30%，出發前 7 天付清尾款</li>
            </ul>
          </div>
        </section>

        {/* 頁尾裝飾條 */}
        <footer className="mt-12 pt-6" style={{ borderTop: `1px solid ${morandiColors.border.light}` }}>
          <div
            className="h-2 rounded-full mb-4"
            style={{
              background: `linear-gradient(90deg, ${morandiColors.gold} 0%, ${morandiColors.goldLight} 100%)`,
            }}
          />
          <div className="text-center text-xs" style={{ color: morandiColors.text.secondary }}>
            <p className="mb-1">感謝您選擇 Venturo Travel</p>
            <p>如有任何疑問，歡迎隨時與我們聯繫</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
