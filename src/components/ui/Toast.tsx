"use client";

import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  isOpen,
  message,
  type = 'info',
  duration = 3000,
  onClose
}: ToastProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          iconColor: 'text-green-500',
          bgColor: isDark ? 'bg-green-500/20 border-green-500/50' : 'bg-green-50 border-green-200',
          textColor: isDark ? 'text-green-400' : 'text-green-800'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-red-500',
          bgColor: isDark ? 'bg-red-500/20 border-red-500/50' : 'bg-red-50 border-red-200',
          textColor: isDark ? 'text-red-400' : 'text-red-800'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-yellow-500',
          bgColor: isDark ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-yellow-50 border-yellow-200',
          textColor: isDark ? 'text-yellow-400' : 'text-yellow-800'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-blue-500',
          bgColor: isDark ? 'bg-blue-500/20 border-blue-500/50' : 'bg-blue-50 border-blue-200',
          textColor: isDark ? 'text-blue-400' : 'text-blue-800'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] max-w-md ${config.bgColor}`}>
        <div className={config.iconColor}>
          {config.icon}
        </div>
        <p className={`flex-1 text-sm font-medium ${config.textColor}`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ${
            isDark 
              ? 'hover:bg-white/10' 
              : 'hover:bg-black/10'
          }`}
        >
          <X size={16} className={config.textColor} />
        </button>
      </div>
    </div>
  );
}
