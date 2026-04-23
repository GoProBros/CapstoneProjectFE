import { apiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { ApiResponse } from '@/types';

export interface ChatSessionListItem {
  id: number;
  title: string;
  sessionType: number;
  participantCount: number;
  creatorName: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageSimple {
  id?: number;
  role: 'user' | 'ai';
  content: string;
  senderId?: string | null;
  senderName?: string | null;
  createdAt?: string;
  isUnreadForCurrentUser?: boolean;
}

export interface ChatSessionDetail {
  id: number;
  title: string;
  sessionType?: number;
  summary: string | null;
  otherParticipant?: {
    userId: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  messages: ChatMessageSimple[];
}

export interface ChatMessageResult {
  id: number;
  sessionId: number;
  senderId: string | null;
  content: string;
  messageType: number;
  createdAt: string;
}

export interface SendMessageResponse {
  /** True when AI is processing asynchronously. Poll jobId for result. */
  accepted: boolean;
  /** 'completed' | 'pending' | etc. */
  status: string;
  jobId: string | null;
  pollUrl: string | null;
  intentHint: string | null;
  /** Top-level user message (echoed back). */
  userMessage: ChatMessageResult | null;
  /**
   * Nested result object containing the full AI response.
   * Present when accepted=false (sync). Null when accepted=true (async job).
   */
  result: {
    userMessage: ChatMessageResult;
    aiMessage: ChatMessageResult;
    intents: Array<{ intent: string; confidence: number }> | null;
  } | null;
}

/** Unified type — backend always returns this shape for send-message. */
export type SendMessageData = SendMessageResponse;

/** True when the AI response is being processed asynchronously (accepted=true + jobId present). */
export function isAiJobAccepted(data: SendMessageData): data is SendMessageData & { accepted: true; jobId: string } {
  return data.accepted === true && typeof data.jobId === 'string';
}

/**
 * Data shape returned by the job-status polling endpoint.
 * Likely same structure as SendMessageResponse once complete.
 */
export interface AiJobStatusData {
  jobId?: string | null;
  status?: string;
  accepted?: boolean;
  /** Same nested result shape as SendMessageResponse */
  result?: {
    aiMessage?: ChatMessageResult | null;
  } | null;
  /** Fallback: some backends return aiMessage at root level */
  aiMessage?: ChatMessageResult | null;
}

export interface CreatedSession {
  id: number;
  title: string;
  sessionType: number;
  status: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendSystemNotificationRequest {
  userIds?: string[];
  sendToAll: boolean;
  message: string;
}

export interface SendSystemNotificationResponse {
  sessionId: number | null;
  messageId: number | null;
  userId: string | null;
  userIds: string[] | null;
  sentToAll: boolean;
  sentCount: number;
  message: string;
  messageType: number;
  sessionType: number;
  createdAt: string;
}

// ─── Direct Message types ─────────────────────────────────────────────────────

export interface DirectParticipant {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export interface DirectSessionListItem {
  sessionId: number;
  otherParticipant: DirectParticipant;
  lastMessageContent: string | null;
  lastMessageSenderId: string | null;
  lastMessageAt: string | null;
  myLastReadAt: string | null;
  myLastReadMessageId: number | null;
  hasUnread: boolean;
  updatedAt: string;
}

export interface DirectChatSessionInfo {
  sessionId: number;
  isNew: boolean;
  otherParticipant: DirectParticipant;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: number;
  sessionId: number;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isFromCurrentUser: boolean;
}

// ─── AI Chat functions ────────────────────────────────────────────────────────

export async function getChatSessions(): Promise<ApiResponse<ChatSessionListItem[]>> {
  return apiRequest<ChatSessionListItem[]>(API_ENDPOINTS.CHAT.SESSIONS);
}

export async function createChatSession(title?: string): Promise<ApiResponse<CreatedSession>> {
  return apiRequest<CreatedSession>(API_ENDPOINTS.CHAT.SESSIONS, {
    method: 'POST',
    body: JSON.stringify({ title: title ?? null }),
  });
}

export async function getChatMessages(sessionId: number): Promise<ApiResponse<ChatSessionDetail>> {
  return apiRequest<ChatSessionDetail>(API_ENDPOINTS.CHAT.SESSION_BY_ID(sessionId));
}

export async function sendChatMessage(
  sessionId: number,
  message: string,
): Promise<ApiResponse<SendMessageData>> {
  return apiRequest<SendMessageData>(API_ENDPOINTS.CHAT.SEND_MESSAGE(sessionId), {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * Poll the status of an async AI job.
 * - Returns HTTP 202 while still processing (apiRequest returns normally, `data.aiMessage` absent)
 * - Returns HTTP 200 when done (`data.aiMessage` present)
 * - Throws on HTTP 404 (job failed / not found)
 */
export async function pollAiJob(jobId: string): Promise<ApiResponse<AiJobStatusData>> {
  return apiRequest<AiJobStatusData>(API_ENDPOINTS.CHAT.AI_JOB_STATUS(jobId));
}

export async function sendSystemNotification(
  payload: SendSystemNotificationRequest,
): Promise<ApiResponse<SendSystemNotificationResponse>> {
  return apiRequest<SendSystemNotificationResponse>(API_ENDPOINTS.CHAT.SYSTEM_NOTIFICATIONS, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Direct Message functions ─────────────────────────────────────────────────

export async function getDirectSessions(): Promise<ApiResponse<DirectSessionListItem[]>> {
  return apiRequest<DirectSessionListItem[]>(API_ENDPOINTS.CHAT.DIRECT);
}

export async function getOrCreateDirectSession(
  phoneOrEmail: string,
): Promise<ApiResponse<DirectChatSessionInfo>> {
  return apiRequest<DirectChatSessionInfo>(API_ENDPOINTS.CHAT.DIRECT, {
    method: 'POST',
    body: JSON.stringify({ phoneOrEmail }),
  });
}

export async function sendDirectMessage(
  sessionId: number,
  content: string,
): Promise<ApiResponse<DirectMessage>> {
  return apiRequest<DirectMessage>(API_ENDPOINTS.CHAT.SEND_DIRECT_MESSAGE(sessionId), {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function markSessionAsRead(sessionId: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(API_ENDPOINTS.CHAT.MARK_AS_READ(sessionId), {
    method: 'PATCH',
  });
}
