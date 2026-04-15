import { API_ENDPOINTS } from '@/constants';
import { get } from '@/services/api';
import type { TelegramStartLinkDto } from '@/types/telegram';

export async function getTelegramStartLink(): Promise<TelegramStartLinkDto> {
  const result = await get<TelegramStartLinkDto>(API_ENDPOINTS.TELEGRAM.START_TOKEN);

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không lấy được liên kết Telegram');
  }

  return result.data;
}