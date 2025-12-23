"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ReportViewerProps {
  reportTitle: string;
  reportUrl: string;
  stockCode: string;
  onClose: () => void;
}

export default function ReportViewer({ reportTitle, reportUrl, stockCode, onClose }: ReportViewerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Xin chào! Tôi là trợ lý AI hỗ trợ phân tích báo cáo tài chính của ${stockCode}. Bạn có thể hỏi tôi về bất kỳ thông tin nào trong báo cáo này.`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Theme-based class helpers
  const getBorderClass = () => isDark ? 'border-gray-700' : 'border-gray-200';
  const getTextClass = () => isDark ? 'text-gray-400' : 'text-gray-600';
  const getBgClass = () => isDark ? 'bg-[#1e1e26]' : 'bg-gray-100';

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response - replace with actual AI API call
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Đây là phản hồi mô phỏng từ AI. Tích hợp API AI sẽ được thêm vào sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div className={`fixed inset-0 z-[9999] flex flex-col ${isDark ? 'bg-[#1e1e26]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${getBorderClass()}`}>
          <div>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {reportTitle}
            </h2>
            <p className={`text-sm mt-1 ${getTextClass()}`}>Mã CK: {stockCode}</p>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors p-2 rounded ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* PDF Viewer Section */}
          <div className={`flex-1 border-r p-4 ${getBorderClass()}`}>
            <div className={`w-full h-full rounded-lg flex items-center justify-center ${
              isDark ? 'bg-[#282832]' : 'bg-white border border-gray-200'
            }`}>
              {reportUrl ? (
                <iframe
                  src={reportUrl}
                  className="w-full h-full rounded-lg"
                  title="PDF Viewer"
                />
              ) : (
                <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Báo cáo PDF sẽ hiển thị tại đây</p>
                  <p className="text-sm mt-2">URL: {reportUrl || 'Chưa có file'}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Chat Section */}
          <div className={`w-[400px] flex flex-col ${isDark ? 'bg-[#282832]' : 'bg-white'}`}>
            {/* Chat Header */}
            <div className={`px-4 py-3 border-b ${getBorderClass()}`}>
              <h3 className={`text-lg font-medium flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Trợ lý
              </h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-cyan-600 text-white'
                        : `${getBgClass()} ${isDark ? 'text-gray-300' : 'text-gray-800'} border ${getBorderClass()}`
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`rounded-lg px-4 py-2 border ${getBgClass()} ${getBorderClass()}`}>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className={`p-4 border-t ${getBorderClass()}`}>
              <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Hỏi AI về báo cáo..."
                  className={`flex-1 border rounded-lg px-4 py-2 text-sm resize-none focus:outline-none focus:border-cyan-500 transition-colors ${
                    isDark ? 'bg-[#1e1e26] text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                  }`}
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="self-end bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
