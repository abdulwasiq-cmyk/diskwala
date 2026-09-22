import { resolveAnyLink, detectPlatform, type SupportedPlatform } from './unifiedResolver.ts';
import { extractDiskWalaId } from './diskwalaResolver.ts';
import { isTeraboxUrl, extractTeraBoxSurl } from './teraboxResolver.ts';

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
}

export interface BotLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source: 'bot' | 'webhook' | 'resolver' | 'system';
  message: string;
  details?: Record<string, unknown>;
}

export class TelegramBotManager {
  private token: string = '';
  private isRunning: boolean = false;
  private mode: 'polling' | 'webhook' | 'stopped' = 'stopped';
  private pollingAbortController: AbortController | null = null;
  private lastUpdateId: number = 0;
  private botInfo: TelegramUser | null = null;
  private webhookUrl: string = '';
  private startTime: number = Date.now();

  // Metrics
  private totalProcessed: number = 0;
  private successCount: number = 0;
  private errorCount: number = 0;
  private lastActive: string | null = null;

  // Logs
  private logs: BotLog[] = [];

  constructor() {
    // Check environment token
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    if (envToken && envToken.trim().length > 10) {
      this.token = envToken.trim();
      this.addLog('info', 'system', 'Loaded Telegram bot token from environment variable');
      // Auto-validate and start in background
      this.verifyToken(this.token).then(valid => {
        if (valid) {
          this.startPolling();
        }
      });
    } else {
      this.addLog('info', 'system', 'No TELEGRAM_BOT_TOKEN in environment. Waiting for manual configuration.');
    }
  }

  public addLog(type: BotLog['type'], source: BotLog['source'], message: string, details?: Record<string, unknown>) {
    const log: BotLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      source,
      message,
      details,
    };
    this.logs.unshift(log);
    if (this.logs.length > 100) {
      this.logs.pop();
    }
  }

  public getLogs(): BotLog[] {
    return this.logs;
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      mode: this.mode,
      botInfo: this.botInfo,
      totalProcessed: this.totalProcessed,
      successCount: this.successCount,
      errorCount: this.errorCount,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      lastActive: this.lastActive,
      webhookUrl: this.webhookUrl,
      hasToken: Boolean(this.token && this.token.length > 5),
      maskedToken: this.token
        ? `${this.token.substring(0, 4)}...${this.token.substring(this.token.length - 4)}`
        : '',
    };
  }

  /**
   * Verify token with Telegram API getMe
   */
  public async verifyToken(candidateToken: string): Promise<boolean> {
    try {
      const cleanToken = candidateToken.trim();
      if (!cleanToken || cleanToken.length < 10) {
        return false;
      }
      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const data = await res.json();
      if (data.ok && data.result) {
        this.token = cleanToken;
        this.botInfo = data.result;
        this.addLog('success', 'bot', `Verified bot @${data.result.username} (ID: ${data.result.id})`);
        return true;
      } else {
        this.addLog('error', 'bot', `Token verification failed: ${data.description || 'Unknown error'}`);
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.addLog('error', 'bot', `Network error validating token: ${msg}`);
      return false;
    }
  }

  /**
   * Start long-polling
   */
  public async startPolling(): Promise<boolean> {
    if (!this.token) {
      this.addLog('warning', 'bot', 'Cannot start polling: No bot token configured.');
      return false;
    }

    if (this.isRunning && this.mode === 'polling') {
      return true;
    }

    // Clear any active webhook first
    try {
      await fetch(`https://api.telegram.org/bot${this.token}/deleteWebhook?drop_pending_updates=false`);
    } catch {
      // ignore
    }

    this.stop();
    this.isRunning = true;
    this.mode = 'polling';
    this.pollingAbortController = new AbortController();
    this.addLog('info', 'bot', `Started long-polling for @${this.botInfo?.username || 'bot'}`);

    this.runPollingLoop();
    return true;
  }

  /**
   * Stop polling or webhook
   */
  public stop() {
    if (this.pollingAbortController) {
      this.pollingAbortController.abort();
      this.pollingAbortController = null;
    }
    this.isRunning = false;
    this.mode = 'stopped';
    this.addLog('info', 'bot', 'Telegram bot stopped.');
  }

  /**
   * Continuous Polling Loop
   */
  private async runPollingLoop() {
    while (this.isRunning && this.mode === 'polling') {
      try {
        const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url, { signal: this.pollingAbortController?.signal });
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.processUpdate(update);
          }
        } else if (!data.ok) {
          console.warn('[Telegram Polling] API returned:', data.description);
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err: unknown) {
        if (this.pollingAbortController?.signal.aborted) {
          break;
        }
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Telegram Polling Error]:', msg);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  /**
   * Set Webhook
   */
  public async setWebhook(url: string): Promise<boolean> {
    if (!this.token) return false;
    try {
      this.stop();
      const res = await fetch(`https://api.telegram.org/bot${this.token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok) {
        this.webhookUrl = url;
        this.isRunning = true;
        this.mode = 'webhook';
        this.addLog('success', 'webhook', `Webhook successfully registered to ${url}`);
        return true;
      } else {
        this.addLog('error', 'webhook', `Webhook registration failed: ${data.description}`);
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.addLog('error', 'webhook', `Failed to set webhook: ${msg}`);
      return false;
    }
  }

  /**
   * Process incoming Update (from polling or webhook)
   */
  public async processUpdate(update: TelegramUpdate) {
    this.lastActive = new Date().toISOString();

    // 1. Handle Callback Queries (inline keyboard clicks)
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return;
    }

    // 2. Handle Text Messages
    if (update.message && update.message.text) {
      await this.handleTextMessage(update.message);
    }
  }

  /**
   * Handle incoming Text Message
   */
  private async handleTextMessage(msg: TelegramMessage) {
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || '';
    const sender = msg.from?.username || msg.from?.first_name || 'User';

    this.addLog('info', 'bot', `Received message from @${sender}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`);

    // Commands
    if (text.startsWith('/start')) {
      await this.sendWelcomeMessage(chatId);
      return;
    }

    if (text.startsWith('/help')) {
      await this.sendHelpMessage(chatId);
      return;
    }

    if (text.startsWith('/ping')) {
      await this.sendMessage(chatId, '🏓 *Pong!*\n\nBot is active and running at full speed ⚡\nDiskWala & TeraBox link resolution engines are online.', {
        parse_mode: 'Markdown',
      });
      return;
    }

    if (text.startsWith('/stats')) {
      const stats = this.getStatus();
      const uptimeMin = Math.floor(stats.uptimeSeconds / 60);
      const textMsg = `📊 *Telegram Bot Statistics*\n\n` +
        `• *Status:* ${stats.isRunning ? '🟢 Active' : '🔴 Inactive'}\n` +
        `• *Mode:* ${stats.mode.toUpperCase()}\n` +
        `• *Total Links Processed:* ${stats.totalProcessed}\n` +
        `• *Successful Downloads:* ${stats.successCount}\n` +
        `• *Failed Requests:* ${stats.errorCount}\n` +
        `• *Uptime:* ${uptimeMin} minutes\n` +
        `• *Supported:* DiskWala & TeraBox Links`;
      await this.sendMessage(chatId, textMsg, { parse_mode: 'Markdown' });
      return;
    }

    // Check if the text contains a URL
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    let targetUrl = urlMatch ? urlMatch[0] : '';

    // If user ran /download <url>
    if (text.startsWith('/download')) {
      const parts = text.split(/\s+/);
      if (parts.length > 1) {
        targetUrl = parts[1];
      }
    }

    const candidate = targetUrl || text;
    const detection = detectPlatform(candidate);

    if (detection.platform !== 'unknown') {
      await this.handleDownloadLink(chatId, detection.url, sender, detection.platform);
      return;
    }

    // Default response for unrecognized text
    await this.sendMessage(
      chatId,
      `👋 *Hello ${msg.from?.first_name || 'there'}!*\n\n` +
      `Send me any *DiskWala* or *TeraBox* link to download or stream files directly!\n\n` +
      `📌 *Supported Platforms:*\n` +
      `• *DiskWala:* \`https://www.diskwala.com/app/...\` or \`https://dw.link/...\`\n` +
      `• *TeraBox:* \`https://terabox.com/s/1...\`, \`1024tera.com\`, etc.\n\n` +
      `Use /help to see all available features.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎬 Test DiskWala Demo', callback_data: 'cmd_demo_dw' },
              { text: '📦 Test TeraBox Demo', callback_data: 'cmd_demo_tb' },
            ],
            [{ text: '📖 Help Guide', callback_data: 'cmd_help' }],
          ],
        },
      }
    );
  }

  /**
   * Handle link resolution and response (DiskWala & TeraBox)
   */
  private async handleDownloadLink(chatId: number, url: string, sender: string, platform?: SupportedPlatform) {
    this.totalProcessed++;
    const platformLabel = platform === 'terabox' ? 'TeraBox' : platform === 'diskwala' ? 'DiskWala' : 'Cloud';

    // 1. Send status indicator
    await this.sendChatAction(chatId, 'upload_document');
    const statusMsg = await this.sendMessage(
      chatId,
      `🔎 *Resolving ${platformLabel} Link...*\n_Bypassing wait-time & extracting direct video stream..._`,
      { parse_mode: 'Markdown' }
    );

    const startTime = Date.now();
    const result = await resolveAnyLink(url);
    const duration = Date.now() - startTime;

    if (result.ok && result.result) {
      this.successCount++;
      const file = result.result;
      this.addLog('success', 'resolver', `Resolved "${file.title}" (${file.fileSize}) for @${sender} in ${duration}ms`);

      // Delete the temporary status message if possible
      if (statusMsg?.message_id) {
        this.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
      }

      // Check file category
      const isVideo = file.fileType === 'video' || file.mimeType?.startsWith('video/') || file.fileName?.match(/\.(mp4|mkv|mov|webm|avi)$/i);
      const isAudio = file.fileType === 'audio' || file.mimeType?.startsWith('audio/') || file.fileName?.match(/\.(mp3|m4a|aac|wav|ogg)$/i);

      if (isVideo) {
        // DIRECT VIDEO DELIVERY - Send video directly, no download link!
        await this.sendChatAction(chatId, 'upload_video');
        const videoUrl = file.streamUrl || file.downloadUrl;
        const caption =
          `🎬 *${file.title}*\n\n` +
          `📦 *File Size:* ${file.fileSize}\n` +
          `👤 *Source:* ${file.uploaderName || platformLabel}\n` +
          `⚡ *Delivered directly to Telegram* — Play & save natively without download links!`;

        const sent = await this.sendVideo(chatId, videoUrl, {
          caption,
          parse_mode: 'Markdown',
          supports_streaming: true,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Send Another Video', callback_data: 'cmd_help' }],
              [{ text: '📊 Bot Stats', callback_data: 'cmd_stats' }],
            ],
          },
        });

        if (!sent.ok) {
          this.addLog('warning', 'bot', `Direct sendVideo notice (${sent.description})`);
          // If Telegram Bot API limit prevents direct upload (e.g. over 50MB)
          await this.sendMessage(chatId,
            `🎬 *${file.title}*\n\n` +
            `📦 *File Size:* ${file.fileSize}\n` +
            `⚠️ Telegram Bot API restricts direct bot delivery for files over 50MB.\n` +
            `Here is the direct in-player stream:\n\n` +
            `▶️ *Direct Stream:* [Watch in Player](${videoUrl})\n` +
            `🎬 *VLC Intent:* \`vlc://${videoUrl}\``,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '▶️ Stream in VLC', url: file.vlcUrl || `vlc://${videoUrl}` }],
                  [{ text: '🔄 Send Another Link', callback_data: 'cmd_help' }],
                ],
              },
            }
          );
        }
      } else if (isAudio) {
        // DIRECT AUDIO DELIVERY
        await this.sendChatAction(chatId, 'upload_voice');
        const audioUrl = file.streamUrl || file.downloadUrl;
        const caption = `🎵 *${file.title}*\n📦 *Size:* ${file.fileSize}\n👤 *Uploader:* ${file.uploaderName || platformLabel}`;
        await this.sendAudio(chatId, audioUrl, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Send Another Link', callback_data: 'cmd_help' }],
            ],
          },
        });
      } else {
        // DIRECT DOCUMENT DELIVERY
        await this.sendChatAction(chatId, 'upload_document');
        const docUrl = file.downloadUrl;
        const caption = `📄 *${file.title}*\n📦 *Size:* ${file.fileSize}`;
        await this.sendDocument(chatId, docUrl, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Send Another Link', callback_data: 'cmd_help' }],
            ],
          },
        });
      }
    } else {
      this.errorCount++;
      this.addLog('error', 'resolver', `Failed to resolve ${url}: ${result.message}`);

      // Delete status message
      if (statusMsg?.message_id) {
        this.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
      }

      await this.sendMessage(
        chatId,
        `❌ *Download Error*\n\n` +
        `Could not extract file from this ${platformLabel} link:\n` +
        `_${result.message || 'Unknown error'}\n\n` +
        `💡 *Common Causes:*\n` +
        `• The file was deleted or made private by the owner\n` +
        `• The link was expired or mistyped\n` +
        `• Server maintenance or rate limits\n\n` +
        `You can test with our verified demo links:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🎬 Test DiskWala Demo', callback_data: 'cmd_demo_dw' },
                { text: '📦 Test TeraBox Demo', callback_data: 'cmd_demo_tb' },
              ],
            ],
          },
        }
      );
    }
  }

  /**
   * Handle Callback Queries from Inline Keyboards
   */
  private async handleCallbackQuery(cb: { id: string; from: TelegramUser; message?: TelegramMessage; data?: string }) {
    const data = cb.data;
    const chatId = cb.message?.chat.id;

    // Answer callback query so Telegram client removes loading animation
    if (this.token) {
      fetch(`https://api.telegram.org/bot${this.token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id }),
      }).catch(() => {});
    }

    if (!chatId || !data) return;

    if (data === 'cmd_demo' || data === 'cmd_demo_dw') {
      await this.handleDownloadLink(chatId, 'https://www.diskwala.com/app/demo', cb.from.username || 'User', 'diskwala');
    } else if (data === 'cmd_demo_tb') {
      await this.handleDownloadLink(chatId, 'https://terabox.com/s/1demo', cb.from.username || 'User', 'terabox');
    } else if (data === 'cmd_help') {
      await this.sendHelpMessage(chatId);
    } else if (data === 'cmd_stats') {
      const stats = this.getStatus();
      await this.sendMessage(
        chatId,
        `📊 *Bot Real-time Metrics*\n\n` +
        `• Processed: *${stats.totalProcessed}*\n` +
        `• Successful: *${stats.successCount}*\n` +
        `• Errors: *${stats.errorCount}*\n` +
        `• Status: *${stats.isRunning ? 'Active 🟢' : 'Idle ⚪'}*`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  /**
   * Send Welcome message
   */
  private async sendWelcomeMessage(chatId: number) {
    const text =
      `🚀 *Welcome to the DiskWala & TeraBox Video Bot!*\n\n` +
      `Send me any *DiskWala* or *TeraBox* link and I will *directly send the video file* to this chat!\n\n` +
      `⚡ *Supported Link Formats:*\n` +
      `• *DiskWala:* \`diskwala.com\`, \`dw.link\`, \`thediskwala.com\`\n` +
      `• *TeraBox:* \`terabox.com\`, \`1024tera.com\`, \`terashare.net\`, etc.\n\n` +
      `✨ *Highlights:*\n` +
      `• Direct video streaming into Telegram\n` +
      `• Ad bypass & no wait timer\n` +
      `• Streaming playback in VLC or MX Player\n\n` +
      `👇 _Try sending a link now or click the test buttons below:_`;

    await this.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎬 Test DiskWala Demo', callback_data: 'cmd_demo_dw' },
            { text: '📦 Test TeraBox Demo', callback_data: 'cmd_demo_tb' },
          ],
          [{ text: '📖 Help & Tips', callback_data: 'cmd_help' }],
        ],
      },
    });
  }

  /**
   * Send Help message
   */
  private async sendHelpMessage(chatId: number) {
    const text =
      `📖 *DiskWala & TeraBox Bot Help Guide*\n\n` +
      `1️⃣ *How to Download:*\n` +
      `Simply copy any DiskWala or TeraBox link and paste it into this chat.\n\n` +
      `2️⃣ *Bot Commands:*\n` +
      `• \`/start\` - Restart bot & main menu\n` +
      `• \`/help\` - Detailed usage guide\n` +
      `• \`/download <url>\` - Extract link\n` +
      `• \`/stats\` - Server health & performance\n` +
      `• \`/ping\` - Speed check\n\n` +
      `3️⃣ *Streaming in External Players:*\n` +
      `When you resolve a video, click "Open in VLC" to stream directly without having to wait for the download to finish!`;

    await this.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎬 DiskWala Demo', callback_data: 'cmd_demo_dw' },
            { text: '📦 TeraBox Demo', callback_data: 'cmd_demo_tb' },
          ],
        ],
      },
    });
  }

  /**
   * Helper: Send message
   */
  public async sendMessage(chatId: number, text: string, options: Record<string, unknown> = {}): Promise<TelegramMessage | null> {
    if (!this.token) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          ...options,
        }),
      });
      const data = await res.json();
      return data.ok ? data.result : null;
    } catch {
      return null;
    }
  }

  /**
   * Helper: Send video directly to chat via Telegram sendVideo API
   */
  public async sendVideo(
    chatId: number,
    videoUrl: string,
    options: {
      caption?: string;
      parse_mode?: string;
      supports_streaming?: boolean;
      reply_markup?: unknown;
    } = {}
  ): Promise<{ ok: boolean; result?: TelegramMessage; description?: string }> {
    if (!this.token) return { ok: false, description: 'No bot token configured' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendVideo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          video: videoUrl,
          caption: options.caption,
          parse_mode: options.parse_mode || 'Markdown',
          supports_streaming: options.supports_streaming ?? true,
          reply_markup: options.reply_markup,
        }),
      });
      const data = await res.json();
      return { ok: Boolean(data.ok), result: data.result, description: data.description };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, description: msg };
    }
  }

  /**
   * Helper: Send audio directly to chat via Telegram sendAudio API
   */
  public async sendAudio(
    chatId: number,
    audioUrl: string,
    options: {
      caption?: string;
      parse_mode?: string;
      reply_markup?: unknown;
    } = {}
  ): Promise<{ ok: boolean; result?: TelegramMessage; description?: string }> {
    if (!this.token) return { ok: false, description: 'No bot token configured' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendAudio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          audio: audioUrl,
          caption: options.caption,
          parse_mode: options.parse_mode || 'Markdown',
          reply_markup: options.reply_markup,
        }),
      });
      const data = await res.json();
      return { ok: Boolean(data.ok), result: data.result, description: data.description };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, description: msg };
    }
  }

  /**
   * Helper: Send document directly to chat via Telegram sendDocument API
   */
  public async sendDocument(
    chatId: number,
    documentUrl: string,
    options: {
      caption?: string;
      parse_mode?: string;
      reply_markup?: unknown;
    } = {}
  ): Promise<{ ok: boolean; result?: TelegramMessage; description?: string }> {
    if (!this.token) return { ok: false, description: 'No bot token configured' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendDocument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          document: documentUrl,
          caption: options.caption,
          parse_mode: options.parse_mode || 'Markdown',
          reply_markup: options.reply_markup,
        }),
      });
      const data = await res.json();
      return { ok: Boolean(data.ok), result: data.result, description: data.description };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, description: msg };
    }
  }

  /**
   * Helper: Send chat action (typing, upload_document)
   */
  public async sendChatAction(chatId: number, action: string) {
    if (!this.token) return;
    try {
      await fetch(`https://api.telegram.org/bot${this.token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action }),
      });
    } catch {
      // ignore
    }
  }

  /**
   * Helper: Delete message
   */
  public async deleteMessage(chatId: number, messageId: number) {
    if (!this.token) return;
    try {
      await fetch(`https://api.telegram.org/bot${this.token}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
      });
    } catch {
      // ignore
    }
  }
}

export const botManager = new TelegramBotManager();
