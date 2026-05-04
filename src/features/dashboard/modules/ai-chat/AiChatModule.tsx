"use client";

import React, { useState } from 'react';
import { Send, Plus, MessageSquare, ChevronDown, Loader2, Sparkles, History, MessagesSquare } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatarBlob } from '@/hooks/useAvatarBlob';
import { DirectChatPanel } from './DirectChatPanel';
import { useAiChat, type Message } from './useAiChat';

/* ──────────────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────────────────
   Markdown-lite renderer
──────────────────────────────────────────────────────────────────────────── */
function preprocessContent(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')  // <br>, <br/>, <br /> → newline
    .replace(/<\/p>/gi, '\n')       // </p> → newline
    .replace(/<p>/gi, '')           // strip <p>
    .replace(/<[^>]+>/g, '');       // strip remaining HTML tags
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = preprocessContent(text).split('\n');
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length === 0) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    nodes.push(
      <Tag key={nodes.length} className={listType === 'ol' ? 'list-decimal pl-4 space-y-0.5 my-1' : 'list-disc pl-4 space-y-0.5 my-1'}>
        {listItems.map((item, i) => (
          <li key={i} className="text-[12px] leading-relaxed">{inlineMarkdown(item)}</li>
        ))}
      </Tag>
    );
    listItems = [];
    listType = null;
  };

  for (const line of lines) {
    const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
    const ulMatch = line.match(/^\s*[-*]\s+(.*)/);

    if (olMatch) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
    } else if (ulMatch) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
    } else {
      flushList();
      if (line.trim() === '') {
        nodes.push(<div key={nodes.length} className="h-1.5" />);
      } else if (line.startsWith('### ')) {
        nodes.push(<p key={nodes.length} className="text-[11.5px] font-bold mt-2 mb-0.5 opacity-90">{inlineMarkdown(line.slice(4))}</p>);
      } else if (line.startsWith('## ')) {
        nodes.push(<p key={nodes.length} className="text-[12.5px] font-bold mt-2 mb-0.5">{inlineMarkdown(line.slice(3))}</p>);
      } else {
        nodes.push(<p key={nodes.length} className="text-[12px] leading-relaxed">{inlineMarkdown(line)}</p>);
      }
    }
  }
  flushList();
  return nodes;
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code key={i} className="bg-black/25 rounded px-1 py-0.5 font-mono text-[10.5px] mx-0.5">
          {part.slice(1, -1)}
        </code>
      );
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────────────── */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ──────────────────────────────────────────────────────────────────────────
   Typing indicator
──────────────────────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <span className="inline-flex gap-[4px] items-center h-4 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-[6px] h-[6px] rounded-full bg-[#4ADE80]/70 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   AI Avatar
──────────────────────────────────────────────────────────────────────────── */
function AiAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="flex-none rounded-full flex items-center justify-center shadow-md flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: '#4ADE80',
      }}
    >
      <Sparkles size={size * 0.42} className="text-black" strokeWidth={2} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Suggestion chip
──────────────────────────────────────────────────────────────────────────── */
function SuggestionChip({ label, onClick, isDark }: { label: string; onClick: () => void; isDark: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-left text-[11px] px-3 py-2 rounded-xl border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
        ${isDark
          ? 'border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:border-[#4ADE80]/40'
          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-[#4ADE80]/5 hover:border-[#4ADE80]/40'}`}
    >
      {label}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Message bubble
──────────────────────────────────────────────────────────────────────────── */
function formatMessageTime(ts: Date): string {
  const now = new Date();
  const isToday =
    ts.getFullYear() === now.getFullYear() &&
    ts.getMonth() === now.getMonth() &&
    ts.getDate() === now.getDate();
  if (isToday) {
    return ts.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return ts.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageBubble({ msg, isDark, userName, userAvatarUrl }: { msg: Message; isDark: boolean; userName: string; userAvatarUrl?: string | null }) {
  const isUser = msg.role === 'user';

  // Stable color from name hash for initials avatar
  const avatarColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#06B6D4'];
  const avatarColorIdx = userName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % avatarColors.length;

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="max-w-[82%] flex flex-col items-end gap-0.5">
          <div
            className="px-3.5 py-2.5 rounded-2xl rounded-br-[4px] text-[12px] leading-relaxed font-medium text-black shadow-lg"
            style={{ background: '#4ADE80' }}
          >
            {msg.content}
          </div>
          {msg.timestamp && (
            <span className="text-[9.5px] opacity-40 pr-1">
              {formatMessageTime(msg.timestamp)}
            </span>
          )}
        </div>
        <div
          className="flex-none w-[26px] h-[26px] rounded-full flex items-center justify-center mb-0.5 shadow-sm flex-shrink-0 overflow-hidden"
          style={{ background: userAvatarUrl ? 'transparent' : avatarColors[avatarColorIdx] }}
        >
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-white font-bold text-[9px]">{getInitials(userName)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <AiAvatar size={28} />
      <div className="max-w-[85%] flex flex-col gap-0.5">
        <div
          className={`px-3.5 py-2.5 rounded-2xl rounded-bl-[4px] shadow-sm space-y-1
            ${isDark
              ? 'bg-[#1a1d2e] border border-white/[0.06] text-gray-100'
              : 'bg-white border border-gray-200 text-gray-800'}`}
        >
          {msg.pending ? <TypingDots /> : renderMarkdown(msg.content)}
        </div>
        {!msg.pending && msg.timestamp && (
          <span className={`text-[9.5px] opacity-40 pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatMessageTime(msg.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main module
──────────────────────────────────────────────────────────────────────────── */
export function AiChatModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const { avatarBlobUrl: userAvatarBlobUrl } = useAvatarBlob(user?.id);

  const [activeTab, setActiveTab] = useState<'ai' | 'direct'>('ai');
  const [directUnread, setDirectUnread] = useState(0);

  const {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    input,
    setInput,
    sending,
    loadingHistory,
    showSessions,
    setShowSessions,
    isPendingNew,
    canSend,
    messagesContainerRef,
    textareaRef,
    sessionsPanelRef,
    loadSession,
    createNew,
    handleSend,
    handleKeyDown,
  } = useAiChat();

  const bg     = isDark ? 'bg-cardBackground' : 'bg-gray-50';
  const border = isDark ? 'border-white/[0.07]' : 'border-gray-200';
  const muted  = isDark ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`h-full w-full flex flex-col ${bg} overflow-hidden`}>

      {/* Tab header: outer div is the drag zone, buttons use pointer-events-auto to override */}
      <div className="module-header drag-handle flex-none flex items-center gap-1.5 px-3 pt-2 pb-1.5 cursor-move select-none">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setActiveTab('ai')}
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold transition-all duration-150 cursor-pointer select-auto ${
            activeTab === 'ai'
              ? 'bg-[#4ADE80] text-black shadow-sm'
              : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles size={10} />
          Trợ lý AI
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setActiveTab('direct')}
          className={`pointer-events-auto relative flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold transition-all duration-150 cursor-pointer select-auto ${
            activeTab === 'direct'
              ? 'bg-[#4ADE80] text-black shadow-sm'
              : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessagesSquare size={10} />
          Nhắn tin
          {directUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
              {directUnread > 9 ? '9+' : directUnread}
            </span>
          )}
        </button>
      </div>

      {/* Direct chat tab — always mounted so SignalR stays active for unread badge */}
      <div className={`flex-1 min-h-0 overflow-hidden ${activeTab === 'direct' ? 'flex flex-col' : 'hidden'}`}>
        <DirectChatPanel
          isDark={isDark}
          userId={user?.id ?? ''}
          userName={user?.fullName ?? ''}
          isVisible={activeTab === 'direct'}
          onUnreadCountChange={setDirectUnread}
        />
      </div>

      {/* ─── AI tab content ─── */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${activeTab === 'ai' ? '' : 'hidden'}`}>

      {/* Session controls bar */}
      <div className={`flex-none flex items-center justify-between pl-3 pr-10 py-1.5 border-b ${border}`}>

        <div className="relative" ref={sessionsPanelRef}>
          <button
            onClick={() => setShowSessions(v => !v)}
            className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[12px] font-semibold
              transition-all duration-150 max-w-[180px]
              ${isDark ? 'hover:bg-white/[0.07] text-gray-100' : 'hover:bg-[#00C805]/5 text-gray-800'}`}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: '#4ADE80' }}
            >
              <Sparkles size={11} className="text-black" />
            </div>
            <span className="truncate">{isPendingNew ? 'Trò chuyện mới' : (activeSession?.title ?? 'AI Assistant')}</span>
            <ChevronDown
              size={12}
              className={`flex-none transition-transform duration-200 ${showSessions ? 'rotate-180' : ''} ${muted}`}
            />
          </button>

          {showSessions && (
            <div
              className={`absolute top-full left-0 mt-1.5 w-64 rounded-2xl border shadow-2xl z-50 overflow-hidden
                ${isDark ? 'bg-[#13161f] border-white/[0.08]' : 'bg-white border-gray-200'}`}
            >
              {sessions.length > 0 && (
                <>
                  <div className={`mx-3 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`} />
                  <div className="p-2 max-h-52 overflow-y-auto space-y-0.5">
                    {[...sessions]
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .map(s => (
                        <button
                          key={s.id}
                          onClick={() => loadSession(s.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150
                            ${s.id === activeSessionId
                              ? isDark ? 'bg-[#4ADE80]/15 text-[#4ADE80]' : 'bg-[#4ADE80]/10 text-[#4ADE80]'
                              : isDark ? 'text-gray-300 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <MessageSquare size={12} className="flex-none opacity-50" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11.5px] font-medium truncate">{s.title}</p>
                            <p className={`text-[10px] mt-0.5 ${muted}`}>
                              {new Date(s.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            </p>
                          </div>
                          {s.id === activeSessionId && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] flex-shrink-0" />
                          )}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={createNew}
            title="Cuoc tro chuyen moi"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150
              ${isDark ? 'hover:bg-white/[0.08] text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setShowSessions(v => !v)}
            title="Lich su tro chuyen"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150
              ${isDark ? 'hover:bg-white/[0.08] text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
          >
            <History size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {!loadingHistory && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-4 pb-6 px-4">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: '#4ADE80' }}
              >
                <Sparkles size={26} className="text-black" />
              </div>
              <div
                className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
                style={{ background: '#4ADE80' }}
              />
            </div>
            <div className="text-center space-y-1">
              <p className={`text-[13.5px] font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                KF Stock
              </p>
              <p className={`text-[11.5px] leading-relaxed ${muted}`}>
                {activeSessionId
                  ? 'Đặt câu hỏi hoặc yêu cầu của bạn về thị trường chứng khoán'
                  : (isPendingNew ? 'Nhập tin nhắn để bắt đầu' : 'ạo cuộc trò chuyện mới để bắt đầu')}
              </p>
            </div>
            {(activeSessionId || isPendingNew) && (
              <div className="flex flex-col gap-2 w-full max-w-[230px]">
                {[
                  'Phân tích cổ phiếu FPT',
                  'Xu hướng thị trường hôm nay?',
                  'Top cổ phiếu tăng mạnh nhất',
                ].map(s => (
                  <SuggestionChip
                    key={s}
                    label={s}
                    isDark={isDark}
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  />
                ))}
              </div>
            )}
            {!activeSessionId && !isPendingNew && (
              <button
                onClick={createNew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-black transition-all hover:opacity-90 active:scale-95 shadow-lg"
                style={{ background: '#4ADE80' }}
              >
                <Plus size={13} />
                Bat dau tro chuyen
              </button>
            )}
          </div>
        )}
        {loadingHistory && (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="animate-spin text-[#4ADE80]" />
            <p className={`text-[11px] ${muted}`}>Dang tai tin nhan...</p>
          </div>
        )}
        {!loadingHistory && messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isDark={isDark} userName={user?.fullName ?? 'User'} userAvatarUrl={userAvatarBlobUrl} />
        ))}
      </div>

      {/* Input */}
      <div className={`flex-none border-t ${border} p-3`}>
        {!activeSessionId && !isPendingNew ? (
          <button
            onClick={createNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98] shadow-md"
            style={{ background: '#4ADE80' }}
          >
            <Plus size={13} />
            Bat dau cuoc tro chuyen
          </button>
        ) : (
          <div
            className={`flex items-end gap-2 rounded-2xl border transition-all duration-200 px-3 py-2
              ${isDark
                ? `bg-[#1a1d2e] ${canSend ? 'border-[#4ADE80]/30 shadow-[0_0_0_1px_rgba(74,222,128,0.3)]' : 'border-white/[0.08]'}`
                : `bg-white ${canSend ? 'border-[#4ADE80]/40 shadow-[0_0_0_2px_rgba(74,222,128,0.15)]' : 'border-gray-200'}`}`}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className={`flex-1 bg-transparent resize-none outline-none text-[12px] leading-relaxed
                placeholder:opacity-40 ${isDark ? 'text-gray-100 placeholder:text-gray-400' : 'text-gray-800 placeholder:text-gray-500'}`}
              style={{ minHeight: 20, maxHeight: 110 }}
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`flex-none w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200
                ${canSend
                  ? 'text-black shadow-md hover:opacity-90 active:scale-90'
                  : isDark ? 'bg-white/[0.06] text-gray-600' : 'bg-gray-100 text-gray-300'}`}
              style={canSend ? { background: '#4ADE80' } : {}}
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
