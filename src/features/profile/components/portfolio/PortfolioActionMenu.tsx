"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import type { PortfolioDto } from '@/types/portfolio';

interface PortfolioActionMenuProps {
  isOpen: boolean;
  portfolio: PortfolioDto | null;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onEdit: (portfolio: PortfolioDto) => void;
  onDetail: (portfolio: PortfolioDto) => void;
  onDelete: (portfolio: PortfolioDto) => void;
  borderCls: string;
  textPrimary: string;
  hoverBg: string;
}

export function PortfolioActionMenu({
  isOpen,
  portfolio,
  position,
  onClose,
  onEdit,
  onDetail,
  onDelete,
  borderCls,
  textPrimary,
  hoverBg,
}: PortfolioActionMenuProps) {
  if (!isOpen || !portfolio || !position) return null;

  return createPortal(
    <div
      className={`fixed z-[80] w-44 overflow-hidden rounded-xl border ${borderCls} bg-white shadow-2xl dark:bg-[#1e1e26]`}
      style={{ top: position.top, left: position.left }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          onClose();
          onEdit(portfolio);
        }}
        className={`block w-full px-4 py-2.5 text-left text-sm ${textPrimary} ${hoverBg}`}
      >
        Chỉnh sửa
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onDetail(portfolio);
        }}
        className={`block w-full px-4 py-2.5 text-left text-sm ${textPrimary} ${hoverBg}`}
      >
        Chi tiết
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onDelete(portfolio);
        }}
        className="block w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10"
      >
        Xóa
      </button>
    </div>,
    document.body,
  );
}
