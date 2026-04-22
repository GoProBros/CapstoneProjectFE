'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import { Send, Loader2, ArrowLeft, Plus, UserCircle2, X } from 'lucide-react';
import { useAvatarBlob } from '@/hooks/useAvatarBlob';
import {
  useNotifications,
  type DirectMessagePayload,
} from '@/contexts/NotificationContext';
import {
  getDirectSessions,
  getOrCreateDirectSession,
  sendDirectMessage,
  getChatMessages,
  markSessionAsRead,
  type DirectSessionListItem,
  type DirectMessage,
  type ChatMessageSimple,
} from '@/services/chat/chatService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageItem {
  id: string;
  content: string;
  senderId: string | null;
  senderName: string;
  createdAt: Date;
  fromMe: boolean;
  pending?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatMessageTime(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins}ph`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays}ng`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({
  name,
  userId,
  size = 32,
  online = false,
}: {
  name: string;
  userId?: string;
  size?: number;
  online?: boolean;
}) {
  const { avatarBlobUrl, loadingAvatar } = useAvatarBlob(userId, { enabled: Boolean(userId) });

  // Stable color from name hash (fallback when no avatar)
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#06B6D4'];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return (
    <div
      className="relative flex-none rounded-full flex items-center justify-center text-white font-bold select-none overflow-hidden"
      style={{ width: size, height: size, background: avatarBlobUrl ? 'transparent' : colors[idx], fontSize: size * 0.35 }}
    >
      {loadingAvatar ? (
        <Loader2 className="animate-spin text-white/60" style={{ width: size * 0.5, height: size * 0.5 }} />
      ) : avatarBlobUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarBlobUrl} alt={name} className="w-full h-full object-cover rounded-full" />
      ) : (
        getInitials(name)
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-[#0d0d0d]" />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DirectChatPanelProps {
  isDark: boolean;
  userId: string;
  userName: string;
  isVisible: boolean;
  onUnreadCountChange: (count: number) => void;
}

export function DirectChatPanel({
  isDark,
  userId,
  userName,
  isVisible,
  onUnreadCountChange,
}: DirectChatPanelProps) {
  const [sessions, setSessions] = useState<DirectSessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newContactInput, setNewContactInput] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  // Mobile-like: on narrow panels, collapse session list when chatting
  const [sessionListVisible, setSessionListVisible] = useState(true);

  const { subscribeDirectMessage } = useNotifications();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Ref to track activeSessionId inside callbacks without stale closures
  const activeSessionIdRef = useRef<number | null>(null);
  const isVisibleRef = useRef(isVisible);
  useEffect(() => { isVisibleRef.current = isVisible; }, [isVisible]);

  const border = isDark ? 'border-white/[0.07]' : 'border-gray-200';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';
  const cardBg = isDark ? '#1a1d2e' : '#ffffff';
  const inputBg = isDark ? '#131620' : '#f8f8f8';

  // Keep ref in sync
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Auto-scroll
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
  }, [input]);

  // Report unread count to parent tab badge
  useEffect(() => {
    onUnreadCountChange(sessions.filter((s) => s.hasUnread).length);
  }, [sessions, onUnreadCountChange]);

  // Load sessions on mount
  useEffect(() => {
    void (async () => {
      setLoadingSessions(true);
      try {
        const res = await getDirectSessions();
        if (res.isSuccess && res.data) {
          setSessions(
            [...res.data].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            ),
          );
        }
      } finally {
        setLoadingSessions(false);
      }
    })();
  }, []);

  // Subscribe to real-time direct messages
  useEffect(() => {
    const unsub = subscribeDirectMessage((payload: DirectMessagePayload) => {
      const isMe = payload.senderId === userId;
      const newMsg: MessageItem = {
        id: `msg-${payload.messageId}`,
        content: payload.content,
        senderId: payload.senderId,
        senderName: payload.senderName,
        createdAt: new Date(payload.createdAt),
        fromMe: isMe,
      };

      if (activeSessionIdRef.current === payload.sessionId && isVisibleRef.current) {
        // Active session AND panel is visible → append + mark as read
        setMessages((prev) => [...prev, newMsg]);
        void markSessionAsRead(payload.sessionId);
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === payload.sessionId ? { ...s, hasUnread: false } : s,
          ),
        );
      } else {
        // Not visible or different session → always show unread badge
        // Also append to messages if it's the active session (so they see it when they return)
        if (activeSessionIdRef.current === payload.sessionId) {
          setMessages((prev) => [...prev, newMsg]);
        }
        setSessions((prev) =>
          [...prev]
            .map((s) =>
              s.sessionId === payload.sessionId
                ? {
                    ...s,
                    hasUnread: true,
                    lastMessageContent: payload.content,
                    lastMessageSenderId: payload.senderId,
                    lastMessageAt: payload.createdAt,
                    updatedAt: payload.createdAt,
                  }
                : s,
            )
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        );
      }
    });
    return unsub;
  }, [subscribeDirectMessage, userId]);

  const loadSession = useCallback(
    async (sessionId: number) => {
      setActiveSessionId(sessionId);
      setShowNewChatForm(false);
      setLoadingMessages(true);
      setMessages([]);
      setSessionListVisible(false);
      try {
        const res = await getChatMessages(sessionId);
        if (res.isSuccess && res.data) {
          setMessages(
            res.data.messages.map((m: ChatMessageSimple) => ({
              id: `msg-${m.id ?? Math.random()}`,
              content: m.content,
              senderId: m.senderId ?? null,
              senderName: m.senderName ?? '',
              createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
              fromMe: m.senderId === userId,
            })),
          );
          void markSessionAsRead(sessionId);
          setSessions((prev) =>
            prev.map((s) => (s.sessionId === sessionId ? { ...s, hasUnread: false } : s)),
          );
        }
      } finally {
        setLoadingMessages(false);
      }
    },
    [userId],
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !activeSessionId) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(true);

    const optimisticId = `pending-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        content: text,
        senderId: userId,
        senderName: userName,
        createdAt: new Date(),
        fromMe: true,
        pending: true,
      },
    ]);

    try {
      const res = await sendDirectMessage(activeSessionId, text);
      if (res.isSuccess && res.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? { ...m, id: `msg-${res.data!.id}`, pending: false, createdAt: new Date(res.data!.createdAt) }
              : m,
          ),
        );
        setSessions((prev) =>
          [...prev]
            .map((s) =>
              s.sessionId === activeSessionId
                ? {
                    ...s,
                    lastMessageContent: text,
                    lastMessageSenderId: userId,
                    lastMessageAt: res.data!.createdAt,
                    updatedAt: res.data!.createdAt,
                  }
                : s,
            )
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async () => {
    if (!newContactInput.trim() || startingChat) return;
    setStartingChat(true);
    setStartError(null);
    try {
      const res = await getOrCreateDirectSession(newContactInput.trim());
      if (res.isSuccess && res.data) {
        const { data } = res;
        setSessions((prev) => {
          if (prev.find((s) => s.sessionId === data.sessionId)) return prev;
          return [
            {
              sessionId: data.sessionId,
              otherParticipant: data.otherParticipant,
              lastMessageContent: null,
              lastMessageSenderId: null,
              lastMessageAt: null,
              myLastReadAt: null,
              myLastReadMessageId: null,
              hasUnread: false,
              updatedAt: data.updatedAt,
            },
            ...prev,
          ];
        });
        setNewContactInput('');
        setShowNewChatForm(false);
        void loadSession(data.sessionId);
      } else {
        setStartError(res.message || 'Không tìm thấy người dùng');
      }
    } finally {
      setStartingChat(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full flex overflow-hidden">

      {/* ─── Left: Session list ─── */}
      <div
        className={`flex-none flex flex-col border-r ${border} overflow-hidden transition-all duration-200`}
        style={{
          width: sessionListVisible ? 148 : 0,
          opacity: sessionListVisible ? 1 : 0,
        }}
      >
        {/* Session list header */}
        <div
          className={`flex items-center justify-between px-2.5 py-2 border-b ${border} flex-none`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>
            Trò chuyện
          </span>
          <button
            onClick={() => {
              setShowNewChatForm((v) => !v);
              setStartError(null);
              setNewContactInput('');
            }}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Trò chuyện mới"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New chat form */}
        {showNewChatForm && (
          <div className={`flex-none px-2 py-2 border-b ${border}`}>
            <input
              type="text"
              value={newContactInput}
              onChange={(e) => setNewContactInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleStartChat()}
              placeholder="Email hoặc SĐT"
              className={`w-full text-[11px] rounded-lg px-2 py-1.5 outline-none border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:border-[#4ADE80]/60'
                  : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#4ADE80]/60'
              }`}
            />
            {startError && (
              <p className="text-[10px] text-red-400 mt-1 px-0.5">{startError}</p>
            )}
            <button
              onClick={() => void handleStartChat()}
              disabled={!newContactInput.trim() || startingChat}
              className="mt-1.5 w-full py-1 rounded-lg text-[11px] font-semibold text-black bg-[#4ADE80] hover:bg-green-400 disabled:opacity-60 transition-all"
            >
              {startingChat ? '...' : 'Bắt đầu'}
            </button>
          </div>
        )}

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-[#4ADE80]" />
            </div>
          ) : sessions.length === 0 ? (
            <div className={`flex flex-col items-center gap-1.5 py-6 px-2 ${muted}`}>
              <UserCircle2 className="w-7 h-7 opacity-30" />
              <span className="text-[10px] text-center">Chưa có trò chuyện</span>
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.sessionId}
                onClick={() => void loadSession(s.sessionId)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 transition-colors text-left ${
                  s.sessionId === activeSessionId
                    ? isDark
                      ? 'bg-[#4ADE80]/10'
                      : 'bg-[#4ADE80]/8'
                    : isDark
                      ? 'hover:bg-white/[0.04]'
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative flex-none">
                  <Avatar name={s.otherParticipant.username} userId={s.otherParticipant.userId} size={30} />
                  {s.hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#4ADE80] rounded-full border border-[#0d0d0d]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[11px] truncate font-medium ${
                        isDark ? 'text-gray-100' : 'text-gray-800'
                      } ${s.hasUnread ? 'font-semibold' : ''}`}
                    >
                      {s.otherParticipant.username}
                    </span>
                    <span className={`text-[9px] flex-none ${muted}`}>
                      {formatRelativeTime(s.lastMessageAt)}
                    </span>
                  </div>
                  {s.lastMessageContent && (
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        s.hasUnread ? 'text-[#4ADE80]' : muted
                      }`}
                    >
                      {s.lastMessageSenderId === userId ? 'Bạn: ' : ''}
                      {s.lastMessageContent}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── Right: Message area ─── */}
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ background: isDark ? '#0d0f1a' : '#f9fafb' }}
      >
        {!activeSessionId ? (
          /* No session selected */
          <div className={`flex-1 flex flex-col items-center justify-center gap-3 ${muted}`}>
            {!sessionListVisible && (
              <button
                onClick={() => setSessionListVisible(true)}
                className={`absolute top-2 left-2 p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <UserCircle2 className="w-10 h-10 opacity-20" />
            <p className="text-[12px]">Chọn cuộc trò chuyện</p>
            <button
              onClick={() => {
                setSessionListVisible(true);
                setShowNewChatForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black bg-[#4ADE80] hover:bg-green-400 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Trò chuyện mới
            </button>
          </div>
        ) : (
          <>
            {/* Contact header */}
            <div
              className={`flex-none flex items-center gap-2 px-3 py-2 border-b ${border}`}
              style={{ background: cardBg }}
            >
              <button
                onClick={() => setSessionListVisible(true)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Danh sách trò chuyện"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              {activeSession && (
                <>
                  <Avatar name={activeSession.otherParticipant.username} userId={activeSession.otherParticipant.userId} size={26} />
                  <span
                    className={`text-[12px] font-semibold ${
                      isDark ? 'text-gray-100' : 'text-gray-800'
                    }`}
                  >
                    {activeSession.otherParticipant.username}
                  </span>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#4ADE80]" />
                </div>
              ) : messages.length === 0 ? (
                <div
                  className={`h-full flex flex-col items-center justify-center gap-2 ${muted}`}
                >
                  <p className="text-[11px]">Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-1.5 ${msg.fromMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!msg.fromMe && (
                      <Avatar
                        name={msg.senderName || activeSession?.otherParticipant.username || '?'}
                        userId={activeSession?.otherParticipant.userId}
                        size={22}
                      />
                    )}
                    <div className={`flex flex-col gap-0.5 max-w-[78%] ${msg.fromMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed shadow-sm ${
                          msg.fromMe
                            ? 'rounded-br-[4px] text-black'
                            : isDark
                              ? 'rounded-bl-[4px] bg-[#1e2235] text-gray-100 border border-white/[0.06]'
                              : 'rounded-bl-[4px] bg-white text-gray-800 border border-gray-200'
                        } ${msg.pending ? 'opacity-60' : ''}`}
                        style={msg.fromMe ? { background: '#4ADE80' } : undefined}
                      >
                        {/* Render HTML content from backend safely */}
                        <div dangerouslySetInnerHTML={{ __html: msg.content }} className="prose-chat" />
                      </div>
                      {!msg.pending && (
                        <span className={`text-[9.5px] opacity-40 ${msg.fromMe ? 'pr-1' : 'pl-1'} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div
              className={`flex-none border-t ${border} p-2.5`}
              style={{ background: cardBg }}
            >
              <div
                className={`flex items-end gap-2 rounded-xl border px-3 py-2 transition-all ${
                  isDark
                    ? 'border-white/[0.08] bg-[#131620] focus-within:border-[#4ADE80]/30'
                    : 'border-gray-200 bg-gray-50 focus-within:border-[#4ADE80]/50'
                }`}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className={`flex-1 bg-transparent resize-none outline-none text-[12px] leading-relaxed placeholder:opacity-40 ${
                    isDark ? 'text-gray-100 placeholder:text-gray-500' : 'text-gray-800 placeholder:text-gray-400'
                  }`}
                  style={{ minHeight: 20, maxHeight: 100 }}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || sending}
                  className="flex-none w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                  style={{
                    background: input.trim() && !sending ? '#4ADE80' : undefined,
                  }}
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4ADE80]" />
                  ) : (
                    <Send
                      className={`w-3.5 h-3.5 ${
                        input.trim() ? 'text-black' : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


