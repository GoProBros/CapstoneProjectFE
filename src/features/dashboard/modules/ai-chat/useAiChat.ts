import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  getChatSessions,
  createChatSession,
  getChatMessages,
  sendChatMessage,
  pollAiJob,
  isAiJobAccepted,
  type ChatSessionListItem,
  type ChatMessageSimple,
} from '@/services/chat/chatService';

// ── Session title cache (localStorage) ──────────────────────────────────────
const TITLE_CACHE_KEY = 'kf_ai_session_titles';

function getCachedTitles(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(TITLE_CACHE_KEY) ?? '{}'); } catch { return {}; }
}

function cacheSessionTitle(id: number, title: string) {
  try {
    const titles = getCachedTitles();
    titles[id] = title;
    localStorage.setItem(TITLE_CACHE_KEY, JSON.stringify(titles));
  } catch {}
}

function applyTitleCache(sessions: ChatSessionListItem[]): ChatSessionListItem[] {
  const cache = getCachedTitles();
  return sessions.map((s) => ({ ...s, title: cache[s.id] ?? s.title }));
}

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

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionsPanelRef = useRef<HTMLDivElement>(null);
  // Polling refs — stable across renders, no closure staleness
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPollingRef = useRef(false);
  /** Stable ref holding the session ID to update when resolving a pending AI message */
  const activeSessionIdRef = useRef<number | null>(null);
  /** ID of the pending AI message placeholder currently in the messages list */
  const pendingMsgIdRef = useRef<string | null>(null);

  // Keep activeSessionIdRef in sync with state
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);

  const stopPolling = useCallback(() => {
    cancelPollingRef.current = true;
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  /**
   * Replace the pending AI placeholder with a final message.
   * Uses functional state updates → safe to call from async callbacks / timers.
   */
  const resolvePendingRef = useRef<((content: string, isError?: boolean) => void) | null>(null);
  resolvePendingRef.current = (content: string, isError = false) => {
    stopPolling();
    const pendingId = pendingMsgIdRef.current;
    if (!pendingId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingId
          ? {
              id: isError ? `ai-err-${Date.now()}` : `ai-${Date.now()}`,
              role: 'ai' as const,
              content,
              timestamp: new Date(),
            }
          : m
      )
    );
    const sid = activeSessionIdRef.current;
    if (sid) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid ? { ...s, updatedAt: new Date().toISOString() } : s
        )
      );
    }
    pendingMsgIdRef.current = null;
    setSending(false);
  };

  // Load sessions on mount
  useEffect(() => { loadSessions(); }, []);

  // Cancel polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // Close sessions panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sessionsPanelRef.current && !sessionsPanelRef.current.contains(e.target as Node))
        setShowSessions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-resize textarea (MUST run before scroll so layout is stable)
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 110)}px`;
  }, [input]);

  // Auto-scroll on new messages
  useLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const loadSessions = async () => {
    try {
      const res = await getChatSessions();
      if (res.isSuccess && res.data) {
        const aiSessions = applyTitleCache(res.data.filter((s) => s.sessionType === 1));
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
            timestamp: m.createdAt ? new Date(m.createdAt) : undefined,
          }))
        );

        // Backfill title cache from first user message for sessions with generic title
        const cached = getCachedTitles();
        if (!cached[sessionId]) {
          const firstUser = res.data.messages.find((m: ChatMessageSimple) => m.role === 'user');
          if (firstUser) {
            const derived = firstUser.content.length > 45
              ? firstUser.content.slice(0, 45) + '…'
              : firstUser.content;
            cacheSessionTitle(sessionId, derived);
            setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, title: derived } : s));
          }
        }
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

    // Cancel any previous in-flight polling
    stopPolling();
    pendingMsgIdRef.current = null;

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
          createdAt: createRes.data.updatedAt,
          updatedAt: createRes.data.updatedAt,
        };
        cacheSessionTitle(createRes.data.id, sessionTitle);
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(createRes.data.id);
        activeSessionIdRef.current = createRes.data.id;
        setIsPendingNew(false);
        sessionId = createRes.data.id;
      } catch {
        setSending(false);
        return;
      }
    }

    // Create pending message with a unique ID stored in ref
    const pendingId = `ai-pending-${Date.now()}`;
    pendingMsgIdRef.current = pendingId;
    const now = new Date();
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: now };
    const pendingMsg: Message = { id: pendingId, role: 'ai', content: '', pending: true };

    setMessages((prev) => [...prev, userMsg, pendingMsg]);

    /**
     * Poll for async job completion using refs — no stale closure risk.
     * HTTP 202 body with no aiMessage → still pending, reschedule.
     * HTTP 200 body with aiMessage OR status='completed' → done.
     * Throws (404 etc.) → show error.
     */
    const startPolling = (jobId: string, intervalMs = 3000) => {
      cancelPollingRef.current = false;

      const poll = async () => {
        if (cancelPollingRef.current) return;
        try {
          const res = await pollAiJob(jobId);
          if (cancelPollingRef.current) return;

          const isComplete =
            (res.isSuccess && (!!res.data?.result?.aiMessage || !!res.data?.aiMessage)) ||
            res.data?.status === 'completed';

          if (isComplete) {
            const content =
              res.data?.result?.aiMessage?.content ||
              res.data?.aiMessage?.content ||
              '...';
            resolvePendingRef.current?.(content);
          } else {
            pollingTimerRef.current = setTimeout(poll, intervalMs);
          }
        } catch (err) {
          if (!cancelPollingRef.current) {
            const msg = err instanceof Error ? err.message : 'Không thể lấy kết quả từ AI.';
            resolvePendingRef.current?.(`Lỗi: ${msg}`, true);
          }
        }
      };

      pollingTimerRef.current = setTimeout(poll, intervalMs);
    };

    try {
      const res = await sendChatMessage(sessionId!, text);

      if (!res.isSuccess || !res.data) {
        resolvePendingRef.current?.(res.message || 'Có lỗi xảy ra, vui lòng thử lại.', true);
        return;
      }

      if (isAiJobAccepted(res.data)) {
        // Async path — keep pending bubble, start polling
        startPolling(res.data.jobId);
      } else {
        // Sync path — AI response is in result.aiMessage
        const content = res.data.result?.aiMessage?.content ?? '...';
        resolvePendingRef.current?.(content);
      }
    } catch (err) {
      console.error('[useAiChat] sendChatMessage error:', err);
      const errMsg = err instanceof Error ? err.message : 'Không thể kết nối đến server.';
      resolvePendingRef.current?.(`ERROR: ${errMsg}`, true);
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
    messagesContainerRef,
    textareaRef,
    sessionsPanelRef,
    // Actions
    loadSession,
    createNew,
    handleSend,
    handleKeyDown,
  };
}
