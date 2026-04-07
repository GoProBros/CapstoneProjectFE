import type {
  FrontendSystemLogEntry,
  FrontendSystemLogQueryResult,
} from '@/types/frontendSystemLog';

interface QueryLogArgs {
  startIso?: string;
  endIso?: string;
  source?: string;
}

const API_BASE = '/api/debug/signalr-hub-log';

class FrontendSystemLogService {
  private queue: FrontendSystemLogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private buildId(): string {
    const random = Math.random().toString(36).slice(2, 10);
    return `${Date.now()}-${random}`;
  }

  private safeSerialize(payload: unknown): unknown {
    try {
      return JSON.parse(JSON.stringify(payload));
    } catch {
      return { asString: String(payload) };
    }
  }

  private scheduleFlush(): void {
    if (!this.isBrowser() || this.flushTimer !== null) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, 400);
  }

  private async flush(): Promise<void> {
    if (!this.isBrowser() || this.queue.length === 0) {
      return;
    }

    const entries = [...this.queue];
    this.queue = [];

    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries }),
        keepalive: true,
      });
    } catch {
      // Best-effort logging only.
    }
  }

  public enqueue(entry: Omit<FrontendSystemLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): void {
    if (!this.isBrowser()) {
      return;
    }

    const normalized: FrontendSystemLogEntry = {
      ...entry,
      id: this.buildId(),
      timestamp: entry.timestamp ?? new Date().toISOString(),
      payload: this.safeSerialize(entry.payload),
    };

    this.queue.push(normalized);

    // Prevent unbounded memory on repeated failures.
    if (this.queue.length > 5000) {
      this.queue = this.queue.slice(this.queue.length - 5000);
    }

    this.scheduleFlush();
  }

  public logSignalR(args: {
    level: string;
    event: string;
    message: string;
    sessionId?: string;
    payload?: unknown;
    metadata?: Record<string, unknown>;
  }): void {
    this.enqueue({
      level: args.level,
      source: 'signalr',
      event: args.event,
      message: args.message,
      sessionId: args.sessionId,
      payload: args.payload,
      metadata: args.metadata,
    });
  }

  public logConsole(args: {
    level: string;
    event: string;
    message: string;
    payload?: unknown;
    metadata?: Record<string, unknown>;
  }): void {
    this.enqueue({
      level: args.level,
      source: 'console',
      event: args.event,
      message: args.message,
      payload: args.payload,
      metadata: args.metadata,
    });
  }

  public async queryLogs({ startIso, endIso, source }: QueryLogArgs): Promise<FrontendSystemLogQueryResult> {
    const searchParams = new URLSearchParams();
    if (startIso) searchParams.set('start', startIso);
    if (endIso) searchParams.set('end', endIso);
    if (source) searchParams.set('source', source);

    const response = await fetch(`${API_BASE}?${searchParams.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Không thể truy vấn log từ file hệ thống.');
    }

    const data = (await response.json()) as FrontendSystemLogQueryResult;
    return {
      count: Array.isArray(data.logs) ? data.logs.length : data.count,
      logs: Array.isArray(data.logs) ? data.logs : [],
    };
  }

  public async downloadLogs({ startIso, endIso, source }: QueryLogArgs): Promise<number> {
    const result = await this.queryLogs({ startIso, endIso, source });

    if (!this.isBrowser()) {
      return result.logs.length;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      range: {
        start: startIso,
        end: endIso,
      },
      source: source ?? 'all',
      totalCount: result.logs.length,
      logs: result.logs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const startPart = startIso ? startIso.replace(/[:.]/g, '-') : 'all';
    const endPart = endIso ? endIso.replace(/[:.]/g, '-') : 'all';

    anchor.href = url;
    anchor.download = `frontend-system-logs_${startPart}_${endPart}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);

    return result.logs.length;
  }
}

const frontendSystemLogService = new FrontendSystemLogService();

export default frontendSystemLogService;
