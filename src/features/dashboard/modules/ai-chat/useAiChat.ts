import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  getChatSessions,
  createChatSession,
  getChatMessages,
  sendChatMessage,
  type ChatSessionListItem,
  type ChatMessageSimple,
} from '@/services/chat/chatService';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  pending?: boolean;
  timestamp?: Date;
}

export type { Message };

export function useAiChat() {
  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [isPendingNew, setIsPendingNew] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionsPanelRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => { loadSessions(); }, []);

  // Close sessions panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sessionsPanelRef.current && !sessionsPanelRef.current.contains(e.target as Node))
        setShowSessions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-scroll on new messages
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 110)}px`;
  }, [input]);

  const loadSessions = async () => {
    try {
      const res = await getChatSessions();
      if (res.isSuccess && res.data) {
        const aiSessions = res.data.filter((s) => s.sessionType === 1);
        setSessions(aiSessions);
        if (aiSessions.length > 0) {
          const latest = [...aiSessions].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          loadSession(latest.id);
        }
      }
    } catch { /* silent */ }
  };

  const loadSession = useCallback(async (sessionId: number) => {
    setActiveSessionId(sessionId);
    setShowSessions(false);
    setLoadingHistory(true);
    setMessages([]);
    try {
      const res = await getChatMessages(sessionId);
      if (res.isSuccess && res.data) {
        setMessages(
          res.data.messages.map((m: ChatMessageSimple, i: number) => ({
            id: `hist-${i}`,
            role: m.role === 'user' ? 'user' : 'ai',
            content: m.content,
            timestamp: new Date(),
          }))
        );
      }
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const createNew = () => {
    setActiveSessionId(null);
    setMessages([]);
    setIsPendingNew(true);
    setShowSessions(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!activeSessionId && !isPendingNew) return;

    setInput('');
    setSending(true);

    let sessionId = activeSessionId;
    if (isPendingNew) {
      try {
        const sessionTitle = text.length > 45 ? text.slice(0, 45) + '…' : text;
        const createRes = await createChatSession(sessionTitle);
        if (!createRes.isSuccess || !createRes.data) {
          setSending(false);
          return;
        }
        const newSession: ChatSessionListItem = {
          id: createRes.data.id,
          title: sessionTitle,
          sessionType: createRes.data.sessionType,
          participantCount: 1,
          creatorName: null,
          createdBy: createRes.data.createdBy,
          createdAt: createRes.data.createdAt,
          updatedAt: createRes.data.updatedAt,
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(createRes.data.id);
        setIsPendingNew(false);
        sessionId = createRes.data.id;
      } catch {
        setSending(false);
        return;
      }
    }

    const now = new Date();
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: now };
    const pendingMsg: Message = { id: 'ai-pending', role: 'ai', content: '', pending: true };

    setMessages((prev) => [...prev, userMsg, pendingMsg]);

    try {
      const res = await sendChatMessage(sessionId!, text);
      if (res.isSuccess && res.data) {
        const aiContent = res.data.aiMessage?.content ?? '...';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === 'ai-pending'
              ? { id: `ai-${Date.now()}`, role: 'ai', content: aiContent, timestamp: new Date() }
              : m
          )
        );
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, updatedAt: new Date().toISOString() }
              : s
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === 'ai-pending'
              ? { id: `ai-err-${Date.now()}`, role: 'ai', content: res.message || 'Có lỗi xảy ra, vui lòng thử lại.', timestamp: new Date() }
              : m
          )
        );
      }
    } catch (err) {
      console.error('[useAiChat] sendChatMessage error:', err);
      const errMsg = err instanceof Error ? err.message : 'Không thể kết nối đến server.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === 'ai-pending'
            ? { id: `ai-err-${Date.now()}`, role: 'ai', content: `ERROR: ${errMsg}`, timestamp: new Date() }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const canSend = input.trim().length > 0 && !sending && (!!activeSessionId || isPendingNew);

  return {
    // State
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
    // Refs
    bottomRef,
    textareaRef,
    sessionsPanelRef,
    // Actions
    loadSession,
    createNew,
    handleSend,
    handleKeyDown,
  };
}
