import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import type { FrontendSystemLogEntry } from '@/types/frontendSystemLog';

export const runtime = 'nodejs';

const LOG_DIR = path.join(process.cwd(), 'logs', 'frontend-system');

const ensureLogDir = async (): Promise<void> => {
  await fs.mkdir(LOG_DIR, { recursive: true });
};

const ensureTodayLogFile = async (): Promise<void> => {
  await ensureLogDir();
  const today = new Date().toISOString().slice(0, 10);
  const filePath = path.join(LOG_DIR, `${today}.jsonl`);
  await fs.writeFile(filePath, '', { flag: 'a' });
};

const toIsoOrNow = (timestamp?: string): string => {
  if (!timestamp) {
    return new Date().toISOString();
  }
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

const normalizeEntry = (entry: Partial<FrontendSystemLogEntry>): FrontendSystemLogEntry => {
  const timestamp = toIsoOrNow(entry.timestamp);
  return {
    id: typeof entry.id === 'string' && entry.id.length > 0
      ? entry.id
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp,
    level: typeof entry.level === 'string' && entry.level.length > 0 ? entry.level : 'info',
    source: typeof entry.source === 'string' && entry.source.length > 0 ? entry.source : 'system',
    event: typeof entry.event === 'string' && entry.event.length > 0 ? entry.event : 'UNKNOWN',
    message: typeof entry.message === 'string' && entry.message.length > 0 ? entry.message : '',
    sessionId: typeof entry.sessionId === 'string' ? entry.sessionId : undefined,
    payload: entry.payload,
    metadata: entry.metadata,
  };
};

const appendEntries = async (entries: FrontendSystemLogEntry[]): Promise<void> => {
  if (entries.length === 0) {
    return;
  }

  await ensureLogDir();

  const groupedByDate = new Map<string, FrontendSystemLogEntry[]>();

  entries.forEach((entry) => {
    const dateKey = entry.timestamp.slice(0, 10);
    const grouped = groupedByDate.get(dateKey) ?? [];
    grouped.push(entry);
    groupedByDate.set(dateKey, grouped);
  });

  for (const [dateKey, dateEntries] of groupedByDate.entries()) {
    const filePath = path.join(LOG_DIR, `${dateKey}.jsonl`);
    const content = dateEntries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
    await fs.appendFile(filePath, content, 'utf8');
  }
};

const parseLines = (content: string): FrontendSystemLogEntry[] => {
  const lines = content.split('\n').filter((line) => line.trim().length > 0);
  const logs: FrontendSystemLogEntry[] = [];

  lines.forEach((line) => {
    try {
      const parsed = JSON.parse(line) as FrontendSystemLogEntry;
      logs.push(parsed);
    } catch {
      // Skip malformed line.
    }
  });

  return logs;
};

const loadAllLogs = async (): Promise<FrontendSystemLogEntry[]> => {
  await ensureLogDir();
  const files = await fs.readdir(LOG_DIR, { withFileTypes: true });

  const logFiles = files
    .filter((file) => file.isFile() && file.name.endsWith('.jsonl'))
    .map((file) => file.name)
    .sort();

  const logs: FrontendSystemLogEntry[] = [];

  for (const fileName of logFiles) {
    const filePath = path.join(LOG_DIR, fileName);
    const content = await fs.readFile(filePath, 'utf8');
    logs.push(...parseLines(content));
  }

  return logs;
};

const filterLogs = (
  logs: FrontendSystemLogEntry[],
  start?: string,
  end?: string,
  source?: string,
): FrontendSystemLogEntry[] => {
  const startTime = start ? new Date(start).getTime() : null;
  const endTime = end ? new Date(end).getTime() : null;

  return logs.filter((log) => {
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
    if (source && log.source !== source) {
      return false;
    }
    return true;
  });
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await ensureTodayLogFile();

    const body = (await request.json()) as {
      entries?: Partial<FrontendSystemLogEntry>[];
      entry?: Partial<FrontendSystemLogEntry>;
    };

    const rawEntries = Array.isArray(body.entries)
      ? body.entries
      : body.entry
        ? [body.entry]
        : [];

    const entries = rawEntries.map(normalizeEntry);
    await appendEntries(entries);

    return NextResponse.json({ success: true, count: entries.length });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to append frontend system logs.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await ensureTodayLogFile();

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') ?? undefined;
    const end = searchParams.get('end') ?? undefined;
    const source = searchParams.get('source') ?? undefined;

    const logs = await loadAllLogs();
    const filtered = filterLogs(logs, start, end, source);

    return NextResponse.json({
      count: filtered.length,
      logs: filtered,
    });
  } catch (error) {
    return NextResponse.json(
      {
        count: 0,
        logs: [],
        message: 'Failed to read frontend system logs.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
