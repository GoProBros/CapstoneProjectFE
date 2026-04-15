export interface TelegramStartLinkDto {
  startToken: string;
  deepLink: string | null;
  botUsername: string | null;
  expiresInMinutes: number;
}