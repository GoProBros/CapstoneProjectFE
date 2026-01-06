"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { ACCENT_GREEN } from '@/constants/colors';

interface SaveLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (layoutName: string) => Promise<void>;
  currentLayoutName?: string;
  isLoading?: boolean;
}

/**
 * Modal component cho phép user nhập tên layout để lưu
 */
export default function SaveLayoutModal({
  isOpen,
  onClose,
  onSave,
  currentLayoutName = '',
  isLoading = false,
}: SaveLayoutModalProps) {
  const [layoutName, setLayoutName] = useState(currentLayoutName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setLayoutName(currentLayoutName !== 'Layout gốc' ? currentLayoutName : '');
      setError(null);
    }
  }, [isOpen, currentLayoutName]);

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
      await onSave(layoutName.trim());
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
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
                  Lưu Layout
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
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Lưu
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
