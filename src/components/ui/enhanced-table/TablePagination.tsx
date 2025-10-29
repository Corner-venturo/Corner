'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  startIndex: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  startIndex,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40 bg-morandi-container/10">
      {/* 左側：資料統計 */}
      <div className="text-sm text-morandi-secondary">
        顯示第 <span className="font-medium text-morandi-primary">{startIndex + 1}</span> 到 <span className="font-medium text-morandi-primary">{Math.min(startIndex + pageSize, totalItems)}</span> 筆，
        共 <span className="font-medium text-morandi-primary">{totalItems}</span> 筆資料
      </div>

      {/* 右側：分頁控制 */}
      <div className="flex items-center gap-2">
        {/* 每頁顯示筆數 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-morandi-secondary">每頁</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-20 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-morandi-secondary">筆</span>
        </div>

        {/* 分頁按鈕 - 只在有多頁時顯示 */}
        {totalPages > 1 && (
          <>
            <div className="w-px h-6 bg-border/60 mx-1"></div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="h-9 px-3 text-sm"
            >
              上一頁
            </Button>

            <div className="flex items-center gap-0.5 sm:gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={cn(
                      "w-9 h-9 p-0 text-sm",
                      currentPage === pageNum ? "" : "text-morandi-primary"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-9 px-3 text-sm"
            >
              下一頁
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
