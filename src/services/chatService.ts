import { apiRequest } from './api';
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

export interface SendMessageResponse {
  userMessage: {
    id: number;
    sessionId: number;
    senderId: string | null;
    content: string;
    messageType: number;
    createdAt: string;
  };
  aiMessage: {
    id: number;
    sessionId: number;
    senderId: string | null;
    content: string;
    messageType: number;
    createdAt: string;
  };
  intents: Array<{ intent: string; confidence: number }> | null;
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
): Promise<ApiResponse<SendMessageResponse>> {
  return apiRequest<SendMessageResponse>(API_ENDPOINTS.CHAT.SEND_MESSAGE(sessionId), {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
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
