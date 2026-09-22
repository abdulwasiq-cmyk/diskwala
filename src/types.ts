export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface BotStatus {
  isRunning: boolean;
  mode: 'polling' | 'webhook' | 'stopped' | 'simulator';
  botInfo: BotInfo | null;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  uptimeSeconds: number;
  lastActive: string | null;
  webhookUrl?: string;
  hasToken: boolean;
  maskedToken: string;
}

export interface DiskWalaFileResult {
  id: string;
  originalUrl: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileSizeBytes: number;
  fileType: 'video' | 'audio' | 'document' | 'archive' | 'image' | 'file';
  mimeType?: string;
  downloadUrl: string;
  streamUrl?: string;
  vlcUrl?: string;
  mxPlayerUrl?: string;
  thumbnailUrl?: string;
  uploaderName?: string;
  resolvedAt: string;
  sourceEngine: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source: 'bot' | 'webhook' | 'resolver' | 'system';
  message: string;
  details?: Record<string, unknown>;
}

export interface SimulatedTelegramMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  timestamp: string;
  fileData?: DiskWalaFileResult;
  isDirectVideo?: boolean;
  videoUrl?: string;
  mediaType?: 'video' | 'audio' | 'document';
  inlineButtons?: Array<{
    text: string;
    url?: string;
    callback_data?: string;
  }>;
  isLoading?: boolean;
}
