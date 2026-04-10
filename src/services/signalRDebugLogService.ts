import type {
  SignalRDebugLogEntry,
  SignalRLogDirection,
  SignalRLogExportPayload,
} from '@/types/signalRDebugLog';
import frontendSystemLogService from '@/services/frontendSystemLogService';

const STORAGE_KEY = 'signalr:frontend:hub-logs:v1';
const MAX_LOG_ENTRIES = 20000;
const MAX_SERIALIZED_PAYLOAD_LENGTH = 20000;

class SignalRDebugLogService {
  private logs: SignalRDebugLogEntry[] = [];
  private sessionId: string | null = null;
  private isLoaded = false;

  private isDebugEnabled(): boolean {
    if (process.env.NEXT_PUBLIC_ENABLE_SIGNALR_DEBUG === '1') {
      return true;
    }

    if (!this.isBrowser()) {
      return false;
    }

    try {
      return window.localStorage.getItem('debug:signalrlog') === '1';
    } catch {
      return false;
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private loadFromStorage(): void {
    if (!this.isBrowser() || this.isLoaded) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.logs = [];
        this.isLoaded = true;
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.logs = parsed as SignalRDebugLogEntry[];
      } else {
        this.logs = [];
      }
    } catch {
      this.logs = [];
    } finally {
      this.isLoaded = true;
    }
  }

  private persist(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch {
      // Ignore quota/storage errors in debug-only feature.
    }
  }

  private newId(): string {
    const random = Math.random().toString(36).slice(2, 10);
    return `${Date.now()}-${random}`;
  }

  private safeSerialize(payload: unknown): unknown {
    if (payload === undefined) {
      return undefined;
    }

    try {
      const serialized = JSON.stringify(payload, (_key, value) => {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
        if (value instanceof Map) {
          return Object.fromEntries(value.entries());
        }
        if (value instanceof Set) {
          return Array.from(value.values());
        }
        return value;
      });

      if (typeof serialized !== 'string') {
        return payload;
      }

      if (serialized.length > MAX_SERIALIZED_PAYLOAD_LENGTH) {
        return {
          truncated: true,
          preview: serialized.slice(0, MAX_SERIALIZED_PAYLOAD_LENGTH),
        };
      }

      return JSON.parse(serialized);
    } catch {
      return {
        serializationError: true,
        asString: String(payload),
      };
    }
  }

  private append(
    direction: SignalRLogDirection,
    event: string,
    payload?: unknown,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.isBrowser() || !this.isDebugEnabled()) {
      return;
    }

    if (!this.sessionId) {
      return;
    }

    this.loadFromStorage();

    const entry: SignalRDebugLogEntry = {
      id: this.newId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      direction,
      event,
      payload: this.safeSerialize(payload),
      metadata,
    };

    this.logs.push(entry);

    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(this.logs.length - MAX_LOG_ENTRIES);
    }

    this.persist();

    frontendSystemLogService.logSignalR({
      level: direction,
      event,
      message: event,
      sessionId: entry.sessionId,
      payload: entry.payload,
      metadata: entry.metadata,
    });
  }

  public startSession(metadata?: Record<string, unknown>): void {
    if (!this.isBrowser() || !this.isDebugEnabled()) {
      return;
    }

    this.loadFromStorage();
    if (!this.sessionId) {
      this.sessionId = this.newId();
    }

    this.append('state', 'SESSION_STARTED', {
      message: 'SignalR connected and debug capture started',
    }, metadata);
  }

  public endSession(reason: string): void {
    if (!this.isDebugEnabled()) {
      this.sessionId = null;
      return;
    }

    this.append('state', 'SESSION_ENDED', { reason });
    this.sessionId = null;
  }

  public ensureSession(metadata?: Record<string, unknown>): void {
    if (!this.isDebugEnabled()) {
      return;
    }

    if (!this.sessionId) {
      this.startSession(metadata);
    }
  }

  public getCurrentSessionId(): string | null {
    return this.sessionId;
  }

  public logState(event: string, payload?: unknown, metadata?: Record<string, unknown>): void {
    if (!this.isDebugEnabled()) return;
    this.append('state', event, payload, metadata);
  }

  public logAction(event: string, payload?: unknown, metadata?: Record<string, unknown>): void {
    if (!this.isDebugEnabled()) return;
    this.append('action', event, payload, metadata);
  }

  public logReceived(event: string, payload?: unknown, metadata?: Record<string, unknown>): void {
    if (!this.isDebugEnabled()) return;
    this.append('received', event, payload, metadata);
  }

  public logError(event: string, payload?: unknown, metadata?: Record<string, unknown>): void {
    if (!this.isDebugEnabled()) return;
    this.append('error', event, payload, metadata);
  }

  public getLogs(startIso?: string, endIso?: string): SignalRDebugLogEntry[] {
    if (!this.isDebugEnabled()) {
      return [];
    }

    this.loadFromStorage();

    const startTime = startIso ? new Date(startIso).getTime() : null;
    const endTime = endIso ? new Date(endIso).getTime() : null;

    return this.logs.filter((log) => {
      const timestamp = new Date(log.timestamp).getTime();
      if (Number.isNaN(timestamp)) {
        return false;
      }
      if (startTime !== null && !Number.isNaN(startTime) && timestamp < startTime) {
        return false;
      }
      if (endTime !== null && !Number.isNaN(endTime) && timestamp > endTime) {
        return false;
      }
      return true;
    });
  }

  public getCount(startIso?: string, endIso?: string): number {
    if (!this.isDebugEnabled()) {
      return 0;
    }

    return this.getLogs(startIso, endIso).length;
  }

  public clearAllLogs(): void {
    if (!this.isDebugEnabled()) {
      return;
    }

    this.logs = [];
    this.persist();
  }

  public downloadLogs(startIso?: string, endIso?: string): void {
    if (!this.isBrowser() || !this.isDebugEnabled()) {
      return;
    }

    const filteredLogs = this.getLogs(startIso, endIso);

    const payload: SignalRLogExportPayload = {
      exportedAt: new Date().toISOString(),
      range: {
        start: startIso,
        end: endIso,
      },
      totalCount: filteredLogs.length,
      logs: filteredLogs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const startPart = startIso ? startIso.replace(/[:.]/g, '-') : 'all';
    const endPart = endIso ? endIso.replace(/[:.]/g, '-') : 'all';

    anchor.href = url;
    anchor.download = `signalr-frontend-hub-logs_${startPart}_${endPart}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }
}

const signalRDebugLogService = new SignalRDebugLogService();

export default signalRDebugLogService;
