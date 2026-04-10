'use client';

import { useEffect } from 'react';
import frontendSystemLogService from '@/services/frontendSystemLogService';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

type ConsoleMethodFn = (...args: unknown[]) => void;

interface WindowWithConsoleCapture extends Window {
  __frontendConsoleCaptureInstalled__?: boolean;
  __frontendConsoleOriginal__?: Partial<Record<ConsoleMethod, ConsoleMethodFn>>;
}

const METHODS: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];

const isSignalRDebugEnabled = (): boolean => {
  if (process.env.NEXT_PUBLIC_ENABLE_SIGNALR_DEBUG === '1') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem('debug:signalrlog') === '1';
  } catch {
    return false;
  }
};

const toMessage = (args: unknown[]): string => {
  if (args.length === 0) {
    return '';
  }

  const first = args[0];
  if (typeof first === 'string') {
    return first;
  }

  try {
    return JSON.stringify(first);
  } catch {
    return String(first);
  }
};

export default function FrontendConsoleCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!isSignalRDebugEnabled()) {
      return;
    }

    const captureWindow = window as WindowWithConsoleCapture;
    if (captureWindow.__frontendConsoleCaptureInstalled__) {
      return;
    }

    captureWindow.__frontendConsoleCaptureInstalled__ = true;
    captureWindow.__frontendConsoleOriginal__ = {};

    METHODS.forEach((method) => {
      const original = console[method].bind(console) as ConsoleMethodFn;
      captureWindow.__frontendConsoleOriginal__![method] = original;

      const wrapped: ConsoleMethodFn = (...args: unknown[]) => {
        original(...args);

        frontendSystemLogService.logConsole({
          level: method,
          event: `CONSOLE_${method.toUpperCase()}`,
          message: toMessage(args),
          payload: {
            args,
            path: window.location.pathname,
          },
        });
      };

      console[method] = wrapped as ConsoleMethodFn;
    });
  }, []);

  return null;
}
