"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { ACCENT_GREEN } from '@/constants/colors';

interface SaveLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (layoutName: string) => Promise<void>;
  onUpdate?: (layoutName: string) => Promise<void>;
  currentLayoutId?: number | null;
  currentLayoutName?: string;
  isSystemDefault?: boolean;
  isLoading?: boolean;
  canEdit?: boolean; // User có quyền edit layout hiện tại không (layout id=1 chỉ admin mới sửa được)
}

/**
 * Modal component cho phép user nhập tên layout để lưu hoặc cập nhật
 */
export default function SaveLayoutModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  currentLayoutId,
  currentLayoutName = '',
  isSystemDefault = false,
  isLoading = false,
  canEdit = true,
}: SaveLayoutModalProps) {
  const [layoutName, setLayoutName] = useState(currentLayoutName);
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'create' | 'update'>('create');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Determine if we can update (has existing layout, not system default, and user has permission)
  const canUpdate = currentLayoutId && !isSystemDefault && onUpdate && canEdit;

  // Focus input khi modal mở
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Reset state khi modal mở
  useEffect(() => {
    if (isOpen) {
      setLayoutName(currentLayoutName !== 'Layout gốc' && currentLayoutName !== 'Layout mặc định' ? currentLayoutName : '');
      setError(null);
      // Default to update if we can update, otherwise create
      setActionType(canUpdate ? 'update' : 'create');
    }
  }, [isOpen, currentLayoutName, canUpdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!layoutName.trim()) {
      setError('Vui lòng nhập tên layout');
      return;
    }

    if (layoutName.trim().length < 2) {
      setError('Tên layout phải có ít nhất 2 ký tự');
      return;
    }

    if (layoutName.trim().length > 50) {
      setError('Tên layout không được quá 50 ký tự');
      return;
    }

    try {
      if (actionType === 'update' && onUpdate) {
        await onUpdate(layoutName.trim());
      } else {
        await onSave(layoutName.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lưu layout thất bại');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - absolute positioning within module */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal - absolute positioning within module */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-md px-4"
            onKeyDown={handleKeyDown}
          >
            <div className="bg-[#282832] rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
              {/* Header với accentGreen */}
              <div 
                className="px-6 py-4 flex items-center justify-between"
                style={{ backgroundColor: ACCENT_GREEN }}
              >
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Save size={20} />
                  {actionType === 'update' ? 'Cập nhật Layout' : 'Tạo Layout Mới'}
                </h3>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-4">
                  <label 
                    htmlFor="layout-name" 
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Tên Layout
                  </label>
                  <input
                    ref={inputRef}
                    id="layout-name"
                    type="text"
                    value={layoutName}
                    onChange={(e) => {
                      setLayoutName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Nhập tên layout..."
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      error 
                        ? 'border-red-500/50 focus:ring-red-500' 
                        : 'border-gray-600 focus:ring-[#22c55e]'
                    }`}
                  />
                  
                  {/* Error message */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                {/* Action Type Toggle - Only show if can update */}
                {canUpdate && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <span className="text-sm text-gray-300">
                        {actionType === 'update' ? 'Cập nhật layout hiện tại' : 'Tạo layout mới'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActionType(actionType === 'update' ? 'create' : 'update')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                          actionType === 'update' ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            actionType === 'update' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !layoutName.trim()}
                    className="px-6 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ backgroundColor: ACCENT_GREEN }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {actionType === 'update' ? 'Đang cập nhật...' : 'Đang lưu...'}
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {actionType === 'update' ? 'Cập nhật' : 'Lưu mới'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
