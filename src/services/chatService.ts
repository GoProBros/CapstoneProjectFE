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
  role: 'user' | 'ai';
  content: string;
}

export interface ChatSessionDetail {
  id: number;
  title: string;
  summary: string | null;
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
