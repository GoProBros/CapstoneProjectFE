'use client';

/**
 * NotificationContext
 * Manages a persistent SignalR connection to /hubs/notifications (NotificationHub).
 * Also loads historical system notification messages from the REST API on mount.
 *
 * Received events:
 *   - ReceiveSystemChatMessage  → system / alert notifications sent by staff or triggered by price alert
 *   - ReceiveAiChatResponse     → AI chat reply (future use)
 *   - ReceiveDirectMessage      → staff → user DM (future use)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import * as signalR from '@microsoft/signalr';
import { getChatSessions, getChatMessages } from '@/services/chatService';
import { getAuthStorageItem } from '@/lib/authStorage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SystemNotification {
  /** Unique client-side id for keying */
  id: string;
  /** HTML content from the backend */
  content: string;
  /** Source label: 'system', 'alert', etc. */
  source: string;
  /** Related ticker (for price-alert messages) */
  ticker?: string;
  createdAt: Date;
  /** True when loaded from API history, false/undefined for realtime push */
  isHistorical?: boolean;
}

/** Payload of ReceiveDirectMessage SignalR event */
export interface DirectMessagePayload {
  sessionId: number;
  messageId: number;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface NotificationContextValue {
  /** Realtime notifications (auto-dismiss after 8s) */
  notifications: SystemNotification[];
  /** Historical notifications loaded from API on mount */
  historicalNotifications: SystemNotification[];
  /** True while loading history from API */
  isLoadingHistory: boolean;
  /** Dismiss any notification by id */
  dismissNotification: (id: string) => void;
  /**
   * Subscribe to incoming direct messages from SignalR.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  subscribeDirectMessage: (listener: (payload: DirectMessagePayload) => void) => () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 8_000;
const MAX_REALTIME = 5;
const MAX_HISTORY = 20;

/** Session type constants matching backend ChatSessionType enum */
const SESSION_TYPE_SYSTEM = 0;

export function NotificationProvider({
  children,
  apiUrl,
}: {
  children: ReactNode;
  apiUrl?: string;
}) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [historicalNotifications, setHistoricalNotifications] = useState<SystemNotification[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  // Map of notif id → timer id for auto-dismiss (realtime only)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Track message IDs already shown as realtime to avoid duplicating history
  const realtimeMessageIdsRef = useRef<Set<number>>(new Set());
  // Direct message listeners registry
  const directListenersRef = useRef<Set<(payload: DirectMessagePayload) => void>>(new Set());

  const subscribeDirectMessage = useCallback(
    (listener: (payload: DirectMessagePayload) => void) => {
      directListenersRef.current.add(listener);
      return () => directListenersRef.current.delete(listener);
    },
    [],
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setHistoricalNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addNotification = useCallback(
    (notif: SystemNotification) => {
      setNotifications((prev) => [notif, ...prev].slice(0, MAX_REALTIME));
      const timer = setTimeout(() => dismissNotification(notif.id), AUTO_DISMISS_MS);
      timersRef.current.set(notif.id, timer);
    },
    [dismissNotification],
  );

  // ── Load historical system notifications from REST API ──────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const sessionsRes = await getChatSessions();
        if (!sessionsRes.isSuccess || !sessionsRes.data) return;

        const systemSession = sessionsRes.data.find(
          (s) => s.sessionType === SESSION_TYPE_SYSTEM,
        );
        if (!systemSession) return;

        const messagesRes = await getChatMessages(systemSession.id);
        if (!messagesRes.isSuccess || !messagesRes.data) return;

        const msgs = messagesRes.data.messages;

        // Messages arrive oldest-first; reverse to get newest-first, then cap
        const histNotifs: SystemNotification[] = [...msgs]
          .reverse()
          .slice(0, MAX_HISTORY)
          .map((m) => ({
            id: `hist-${m.id ?? 0}-${systemSession.id}`,
            content: m.content,
            source: 'system',
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            isHistorical: true,
          }));

        setHistoricalNotifications(histNotifs);
      } catch {
        // Silently ignore — auth may not be ready yet or network error
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SignalR connection ───────────────────────────────────────────────────────
  useEffect(() => {
    const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || '';
    const hubUrl = `${baseUrl}/hubs/notifications`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          if (typeof window === 'undefined') return '';
          return getAuthStorageItem('accessToken') ?? '';
        },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10_000, 30_000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Handle system / alert notification pushed from staff or alert engine
    connection.on(
      'ReceiveSystemChatMessage',
      (payload: {
        sessionId: number;
        messageId: number;
        messageType: string;
        source: string;
        content: string;
        createdAt: string;
        alertId?: number;
        ticker?: string;
      }) => {
        // Track this message ID so history loader won't duplicate it
        realtimeMessageIdsRef.current.add(payload.messageId);

        // Also remove from history if the same message appears there
        setHistoricalNotifications((prev) =>
          prev.filter((h) => h.id !== `hist-${payload.messageId}-${payload.sessionId}`),
        );

        const notif: SystemNotification = {
          id: `sysnotif-${payload.messageId}-${Date.now()}`,
          content: payload.content,
          source: payload.source,
          ticker: payload.ticker,
          createdAt: new Date(payload.createdAt),
          isHistorical: false,
        };
        addNotification(notif);
      },
    );

    // Handle incoming direct messages and dispatch to all listeners
    connection.on(
      'ReceiveDirectMessage',
      (payload: DirectMessagePayload) => {
        directListenersRef.current.forEach((fn) => fn(payload));
      },
    );

    const start = async () => {
      try {
        await connection.start();
        console.log('[NotificationHub] Connected');
      } catch (e) {
        console.warn('[NotificationHub] Initial connection failed:', e);
      }
    };

    start();
    connectionRef.current = connection;

    return () => {
      connection.stop();
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, [apiUrl, addNotification]);

  return (
    <NotificationContext.Provider
      value={{ notifications, historicalNotifications, isLoadingHistory, dismissNotification, subscribeDirectMessage }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
