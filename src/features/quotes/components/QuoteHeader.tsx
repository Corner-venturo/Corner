import React from 'react';
import { ArrowLeft, Save, CheckCircle, Plane, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ParticipantCounts, VersionRecord } from '../types';

interface QuoteHeaderProps {
  isSpecialTour: boolean;
  isReadOnly: boolean;
  relatedTour: any;
  quote: any;
  quoteName: string;
  setQuoteName: (name: string) => void;
  participantCounts: ParticipantCounts;
  setParticipantCounts: React.Dispatch<React.SetStateAction<ParticipantCounts>>;
  saveSuccess: boolean;
  setIsSaveDialogOpen: (open: boolean) => void;
  formatDateTime: (dateString: string) => string;
  handleLoadVersion: (versionData: any) => void;
  handleFinalize: () => void;
  handleCreateTour: () => void;
  handleGenerateQuotation: () => void;
  router: any;
}

function History({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <path d="M3 3v5h5"></path>
      <path d="M12 7v5l4 2"></path>
    </svg>
  );
}

export const QuoteHeader: React.FC<QuoteHeaderProps> = ({
  isSpecialTour,
  isReadOnly,
  relatedTour,
  quote,
  quoteName,
  setQuoteName,
  participantCounts,
  setParticipantCounts,
  saveSuccess,
  setIsSaveDialogOpen,
  formatDateTime,
  handleLoadVersion,
  handleFinalize,
  handleCreateTour,
  handleGenerateQuotation,
  router
}) => {
  return (
    <>
      {/* 特殊團鎖定警告 */}
      {isSpecialTour && (
        <div className="fixed top-18 right-0 left-16 bg-orange-50 border-b border-orange-200 z-30 px-6 py-2">
          <div className="flex items-center space-x-2 text-orange-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">此為特殊團報價單，所有欄位已鎖定無法編輯</span>
          </div>
        </div>
      )}

      {/* 標題區域 */}
      <div className={cn(
        "fixed top-0 right-0 left-16 h-18 bg-background border-b border-border z-40 flex items-center justify-between px-6",
        isSpecialTour && "border-b-0"
      )}>
        {/* 左區：內容標題區域 - 緊湊排列 */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => router.push('/quotes')}
            className="p-2 hover:bg-morandi-container rounded-lg transition-colors"
            title="返回報價單列表"
          >
            <ArrowLeft size={20} className="text-morandi-secondary" />
          </button>

          {/* 顯示編號 */}
          <div className="text-sm font-mono text-morandi-secondary">
            {relatedTour ? (
              <span className="text-morandi-gold" title="旅遊團編號">
                {relatedTour.code || '-'}
              </span>
            ) : (
              <span>
                {quote?.code || '-'}
              </span>
            )}
          </div>

          <input
            type="text"
            value={quoteName}
            onChange={(e) => setQuoteName(e.target.value)}
            disabled={isReadOnly}
            className={cn(
              "text-lg font-bold text-morandi-primary bg-transparent border-0 focus:outline-none focus:bg-white px-2 py-1 rounded w-[180px]",
              isReadOnly && "cursor-not-allowed opacity-60"
            )}
            placeholder="輸入團體名稱"
          />
        </div>

        {/* 右區：功能區域 (原中+右合併) */}
        <div className="flex items-center space-x-2">

          {/* 人數統計 - 5個身份 */}
          <div className="flex items-center space-x-2 whitespace-nowrap text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">成人:</span>
              <input
                type="number"
                value={participantCounts.adult}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, adult: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">小孩:</span>
              <input
                type="number"
                value={participantCounts.child_with_bed}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, child_with_bed: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">不佔床:</span>
              <input
                type="number"
                value={participantCounts.child_no_bed}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, child_no_bed: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">單人房:</span>
              <input
                type="number"
                value={participantCounts.single_room}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, single_room: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">嬰兒:</span>
              <input
                type="number"
                value={participantCounts.infant}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, infant: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-1 whitespace-nowrap">
            <span className="text-sm text-morandi-secondary">狀態:</span>
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded text-sm font-medium',
              quote && quote.status === 'proposed'
                ? 'bg-morandi-gold text-white'
                : 'bg-morandi-green text-white'
            )}>
              {quote?.status === 'proposed' ? '提案' : quote?.status === 'approved' ? '已核准' : quote?.status || '提案'}
            </span>
          </div>

          <Button
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={isReadOnly}
            className={cn(
              "h-8 px-3 text-sm transition-all duration-200",
              saveSuccess
                ? "bg-morandi-green hover:bg-morandi-green text-white"
                : "bg-morandi-green hover:bg-morandi-green-hover text-white",
              isReadOnly && "cursor-not-allowed opacity-60"
            )}
          >
            <Save size={14} className="mr-1.5" />
            {saveSuccess ? '已保存' : '保存版本'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={isReadOnly}
              className={cn(
                "h-8 px-3 text-sm border-morandi-container text-morandi-secondary hover:bg-morandi-container",
                isReadOnly && "cursor-not-allowed opacity-60"
              )}
            >
              <History size={14} className="mr-1.5" />
              版本 {quote?.version || 1}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <div className="px-2 py-1 text-sm font-medium text-morandi-primary border-b border-border">
                版本歷史
              </div>

              {/* 當前版本（僅在有未保存修改時顯示） */}
              {!saveSuccess && (
                <DropdownMenuItem className="flex items-center justify-between py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">版本 {quote?.version || 1} (當前)</span>
                    <span className="text-xs text-morandi-secondary">
                      {quote?.updated_at ? formatDateTime(quote.updated_at) : ''}
                    </span>
                  </div>
                  <div className="text-xs bg-morandi-gold text-white px-2 py-1 rounded">
                    當前
                  </div>
                </DropdownMenuItem>
              )}

              {/* 歷史版本 */}
              {quote?.versions && quote.versions.length > 0 && (
                <>
                  {quote.versions
                    .sort((a: VersionRecord, b: VersionRecord) => b.version - a.version)
                    .map((version: VersionRecord) => (
                      <DropdownMenuItem
                        key={version.id}
                        className="flex items-center justify-between py-2 cursor-pointer hover:bg-morandi-container/30"
                        onClick={() => handleLoadVersion(version)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{version.note || `版本 ${version.version}`}</span>
                          <span className="text-xs text-morandi-secondary">
                            {formatDateTime(version.created_at)}
                          </span>
                        </div>
                        <div className="text-xs text-morandi-secondary">
                          NT$ {version.total_cost.toLocaleString()}
                        </div>
                      </DropdownMenuItem>
                    ))
                  }
                </>
              )}

              {(!quote?.versions || quote.versions.length === 0) && (
                <div className="px-2 py-3 text-sm text-morandi-secondary text-center">
                  尚無歷史版本
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {quote && quote.status === 'proposed' && (
            <Button
              onClick={handleFinalize}
              disabled={isReadOnly}
              className={cn(
                "h-8 px-3 text-sm bg-morandi-primary hover:bg-morandi-primary/90 text-white",
                isReadOnly && "cursor-not-allowed opacity-60"
              )}
            >
              <CheckCircle size={14} className="mr-1.5" />
              轉為最終版本
            </Button>
          )}

          {quote && quote.status === 'approved' && (
            relatedTour ? (
              // 已有關聯旅遊團：前往該旅遊團
              <Button
                onClick={() => router.push(`/tours?highlight=${relatedTour.id}`)}
                className="h-8 px-3 text-sm bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Plane size={14} className="mr-1.5" />
                前往旅遊團
              </Button>
            ) : (
              // 沒有關聯旅遊團：建立新旅遊團
              <Button
                onClick={handleCreateTour}
                disabled={isReadOnly}
                className={cn(
                  "h-8 px-3 text-sm bg-morandi-gold hover:bg-morandi-gold-hover text-white",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <Plane size={14} className="mr-1.5" />
                開旅遊團
              </Button>
            )
          )}
        </div>
      </div>
    </>
  );
};
