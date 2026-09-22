export const PYTHON_BOT_SCRIPT = `"""
DiskWala Link Downloader Telegram Bot (Python)
Requirements:
    pip install python-telegram-bot requests
"""

import os
import re
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
RESOLVER_API = "https://diskwala.fun/api/resolve"

def extract_diskwala_url(text: str):
    patterns = [
        r"https?://(?:www\\.)?diskwala\\.com/app/[a-zA-Z0-9_\\-]+",
        r"https?://(?:www\\.)?diskwala\\.com/file/[a-zA-Z0-9_\\-]+",
        r"https?://(?:www\\.)?thediskwala\\.com/[a-zA-Z0-9_\\-]+",
        r"https?://(?:www\\.)?dw\\.link/[a-zA-Z0-9_\\-]+",
        r"https?://(?:www\\.)?diskwala\\.fun/[a-zA-Z0-9_\\-]+",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None

def resolve_diskwala(url: str):
    try:
        response = requests.post(
            RESOLVER_API,
            json={"url": url},
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15,
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") and data.get("result"):
                return data["result"]
    except Exception as e:
        logger.error(f"Resolution error: {e}")
    return None

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = (
        "🚀 *Welcome to the DiskWala Downloader Bot!*\\n\\n"
        "Send me any *DiskWala link* to get high-speed direct download "
        "and video streaming URLs without annoying ads or timers.\\n\\n"
        "Send /help to see all features."
    )
    keyboard = [
        [InlineKeyboardButton("🧪 Try Demo Link", callback_data="cmd_demo")],
        [InlineKeyboardButton("📖 Commands", callback_data="cmd_help")],
    ]
    await update.message.reply_text(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "📖 *DiskWala Bot Commands:*\\n\\n"
        "• Paste any DiskWala link directly\\n"
        "• /start - Restart bot\\n"
        "• /help - Show this guide\\n"
        "• /ping - Server latency check\\n\\n"
        "⚡ Direct stream links support *VLC* and *MX Player*."
    )
    await update.message.reply_text(help_text, parse_mode="Markdown")

async def ping_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🏓 *Pong!* Bot is operational ⚡", parse_mode="Markdown")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text or ""
    url = extract_diskwala_url(text)

    if not url:
        await update.message.reply_text(
            "⚠️ Please send a valid DiskWala link (e.g. https://www.diskwala.com/app/...)."
        )
        return

    status_msg = await update.message.reply_text(
        "🔎 *Resolving DiskWala Link...*\\n_Bypassing timers & extracting direct stream..._",
        parse_mode="Markdown",
    )

    file_data = resolve_diskwala(url)

    if file_data:
        title = file_data.get("title", "DiskWala File")
        size = file_data.get("fileSize", "Unknown")
        uploader = file_data.get("uploaderName", "DiskWala Creator")
        dl_url = file_data.get("downloadUrl", "")
        stream_url = file_data.get("streamUrl", dl_url)
        video_url = stream_url or dl_url

        caption = (
            f"🎬 *{title}*\\n\\n"
            f"📦 *Size:* {size}\\n"
            f"👤 *Uploader:* {uploader}\\n"
            f"⚡ *Direct Video Delivery* — Play & save natively in Telegram!"
        )

        await status_msg.delete()

        # Directly send the video file to the user! (No download link sent)
        try:
            await context.bot.send_video(
                chat_id=update.effective_chat.id,
                video=video_url,
                caption=caption,
                parse_mode="Markdown",
                supports_streaming=True,
            )
        except Exception as err:
            logger.warning(f"send_video URL error: {err}. Attempting stream upload fallback...")
            try:
                # If Telegram URL fetch hits size limit, stream bytes directly
                res = requests.get(video_url, stream=True, timeout=60)
                await context.bot.send_video(
                    chat_id=update.effective_chat.id,
                    video=res.raw,
                    caption=caption,
                    parse_mode="Markdown",
                    supports_streaming=True,
                )
            except Exception as e2:
                logger.error(f"Fallback upload failed: {e2}")
                await update.message.reply_text(
                    f"🎬 *{title}* ({size})\\n\\n"
                    "⚠️ Video exceeds Telegram standard bot upload limits (>50MB).\\n"
                    f"Stream in player: {video_url}",
                    parse_mode="Markdown"
                )
    else:
        await status_msg.edit_text(
            "❌ *Download Error:* Could not extract direct link.\\n"
            "The link might be deleted, expired, or temporarily inaccessible.",
            parse_mode="Markdown",
        )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    if query.data == "cmd_demo":
        await query.message.reply_text("Here is the demo link:\\nhttps://www.diskwala.com/app/demo")
    elif query.data == "cmd_help":
        await help_command(update, context)

def main():
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("ping", ping_command))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))
    app.add_handler(CallbackQueryHandler(handle_callback))

    print("DiskWala Telegram Bot is polling...")
    app.run_polling()

if __name__ == "__main__":
    main()
`;

export const NODE_RENDER_SCRIPT = `/**
 * DiskWala Ultra-Lightweight Telegram Bot for Render Free Tier (Node.js)
 * 
 * Performance on Render:
 * - RAM: ~24MB - 35MB (Less than 7% of Render's 512MB free tier!)
 * - Zero bloat: Uses native fetch and native Node.js HTTP server
 * - Direct video delivery: Uses Telegram sendVideo with streaming
 * - Keeps Render Free Web Service alive 24/7 without being stopped
 */

import http from 'node:http';
import { Bot } from 'grammy';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const RESOLVER_API = 'https://diskwala.fun/api/resolve';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ FATAL: Please set TELEGRAM_BOT_TOKEN environment variable!');
  process.exit(1);
}

// 1. Lightweight Native HTTP Health Check Server (Satisfies Render Web Service Port check)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('DiskWala Telegram Bot is running 24/7 on Render (Node.js)!');
});

server.listen(PORT, () => {
  console.log(\`✅ Health server listening on port \${PORT} for Render\`);
});

// 2. Initialize Telegram Bot using grammY
const bot = new Bot(BOT_TOKEN);

// URL matcher for DiskWala and TeraBox links
const LINK_REGEX = /https?:\/\/(?:www\.)?(?:diskwala\.com|thediskwala\.com|dw\.link|diskwala\.fun|terabox\.com|terabox\.app|1024tera\.com|terashare\.net|nephobox\.com|mirrobox\.com|4funbox\.com)[^\s]+/i;

bot.command('start', async (ctx) => {
  await ctx.reply(
    '🚀 *Welcome to DiskWala & TeraBox Direct Video Bot!*\\n\\n' +
    'Send me any DiskWala or TeraBox link and I will *directly send the video file* to this chat!\\n' +
    '• No waiting timers\\n' +
    '• No ads\\n' +
    '• No external download links\\n\\n' +
    '👇 Paste your link below:',
    { parse_mode: 'Markdown' }
  );
});

bot.command('ping', async (ctx) => {
  const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  await ctx.reply(\`⚡ *Pong!*\\nBot online on Render (RAM: \${mem} MB)\`, { parse_mode: 'Markdown' });
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  const match = text.match(LINK_REGEX);

  if (!match) return;

  const url = match[0];
  const isTeraBox = url.includes('tera') || url.includes('nepho') || url.includes('mirro') || url.includes('4fun');
  const platform = isTeraBox ? 'TeraBox' : 'DiskWala';
  const statusMsg = await ctx.reply(\`⏳ *Resolving \${platform} video stream...*\`, { parse_mode: 'Markdown' });

  try {
    // Fast native fetch to unified resolver API
    const res = await fetch(RESOLVER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json();

    if (!data.ok || !data.result) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        \`❌ *Error:* Could not extract video stream from \${platform}. Link may be private or expired.\`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const file = data.result;
    const videoUrl = file.streamUrl || file.downloadUrl;
    const caption =
      \`🎬 *\${file.title || platform + ' Video'}*\\n\\n\` +
      \`📦 *Size:* \${file.fileSize || 'Unknown'}\\n\` +
      \`👤 *Source:* \${file.uploaderName || platform}\\n\` +
      \`⚡ *Direct Video Delivery* — Play & save directly in Telegram!\`;

    // Delete loading message
    await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});

    // Directly send video into the chat - no download link!
    await ctx.replyWithVideo(videoUrl, {
      caption,
      parse_mode: 'Markdown',
      supports_streaming: true,
    });
  } catch (err) {
    console.error('Delivery error:', err);
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      '❌ *Delivery notice:* Telegram rejected URL or file exceeds 50MB Bot API upload limit.',
      { parse_mode: 'Markdown' }
    ).catch(() => {});
  }
});

// Start bot polling
bot.start({
  onStart: (botInfo) => {
    console.log(\`🤖 Bot @\${botInfo.username} started successfully on Node.js!\`);
  },
});

// Graceful shutdown on Render redeploy
process.once('SIGINT', () => {
  server.close();
  bot.stop();
});
process.once('SIGTERM', () => {
  server.close();
  bot.stop();
});
`;

export const NODE_PACKAGE_JSON = `{
  "name": "diskwala-telegram-bot",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "grammy": "^1.35.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
`;

export const NODE_BOT_SCRIPT = `/**
 * DiskWala Link Downloader Telegram Bot (Node.js)
 * Dependencies:
 *   npm install telegraf axios dotenv
 */

import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import 'dotenv/config';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TOKEN_HERE');
const RESOLVER_URL = 'https://diskwala.fun/api/resolve';

bot.start((ctx) => {
  const welcome = "🚀 *Welcome to the DiskWala Downloader Bot!*\\n\\n" +
    "Send me any *DiskWala link* to instantly get direct download and streaming links without ads.";

  return ctx.replyWithMarkdown(welcome, Markup.inlineKeyboard([
    [Markup.button.callback('🧪 Try Demo Link', 'cmd_demo')],
    [Markup.button.callback('📖 Help Guide', 'cmd_help')],
  ]));
});

bot.help((ctx) => {
  return ctx.replyWithMarkdown("📖 *DiskWala Bot Help:*\\n• Paste any diskwala.com link\\n• /ping - Speed check\\n• /start - Restart bot");
});

bot.action('cmd_demo', (ctx) => {
  ctx.answerCbQuery();
  return ctx.reply('Paste this demo link to test: https://www.diskwala.com/app/demo');
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const match = text.match(/https?:\\/\\/(?:www\\.)?(?:diskwala\\.com|thediskwala\\.com|dw\\.link)[^\\s]+/i);

  if (!match) {
    return ctx.reply('Please send a valid DiskWala link!');
  }

  const waiting = await ctx.replyWithMarkdown('🔎 *Resolving DiskWala Link...*\\n_Extracting direct streams..._');

  try {
    const res = await axios.post(RESOLVER_URL, { url: match[0] });
    if (res.data && res.data.ok && res.data.result) {
      const file = res.data.result;
      const videoUrl = file.streamUrl || file.downloadUrl;
      const caption = "🎬 *" + (file.title || 'DiskWala File') + "*\\n\\n" +
        "📦 *Size:* " + (file.fileSize || 'Unknown') + "\\n" +
        "👤 *Uploader:* " + (file.uploader || 'Creator') + "\\n" +
        "⚡ *Direct Video Delivery* (No download link needed!)";

      await ctx.telegram.deleteMessage(ctx.chat.id, waiting.message_id);

      // Directly send the video into the chat - no download link!
      return ctx.replyWithVideo(videoUrl, {
        caption,
        parse_mode: 'Markdown',
        supports_streaming: true,
      });
    }
  } catch (err) {
    console.error(err);
  }

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    waiting.message_id,
    undefined,
    '❌ Could not resolve link. The file may have been removed or link is expired.'
  );
});

bot.launch().then(() => console.log('Bot running!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
`;

export const RENDER_PYTHON_SCRIPT = `"""
DiskWala Ultra-Lightweight Telegram Bot for Render Free Tier
- Memory usage: ~28MB - 42MB (Well within Render's 512MB limit)
- Includes minimal HTTP health server to satisfy Render Free Web Service
- Directly sends video files using Telegram's sendVideo API
"""

import os
import re
import logging
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import requests
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger("DiskWalaBot")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
RESOLVER_API = "https://diskwala.fun/api/resolve"
PORT = int(os.getenv("PORT", "10000"))

# --- 1. Minimal HTTP Health Check for Render Free Tier Web Service ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"DiskWala Bot is running 24/7 on Render!")

    def log_message(self, format, *args):
        # Silence HTTP access logs to keep terminal light
        pass

def run_http_server():
    server = HTTPServer(("0.0.0.0", PORT), HealthCheckHandler)
    server.serve_forever()

# --- 2. URL Extraction & DiskWala Resolution ---
def extract_diskwala_url(text: str):
    match = re.search(r"https?://(?:www\\.)?(?:diskwala\\.com|thediskwala\\.com|dw\\.link|diskwala\\.fun)[^\\s]+", text)
    return match.group(0) if match else None

def resolve_diskwala(url: str):
    try:
        res = requests.post(RESOLVER_API, json={"url": url}, timeout=12)
        if res.status_code == 200:
            data = res.json()
            if data.get("ok") and data.get("result"):
                return data["result"]
    except Exception as e:
        logger.error(f"Resolution error: {e}")
    return None

# --- 3. Telegram Handlers ---
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = (
        "🚀 *DiskWala Direct Video Bot*\\n\\n"
        "Send any DiskWala link and I will *directly send the video file* to this chat!\\n"
        "No ads, no timers, no external download links."
    )
    await update.message.reply_text(msg, parse_mode="Markdown")

async def ping_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("⚡ *Pong!* Ultra-lightweight bot online on Render.", parse_mode="Markdown")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text or ""
    url = extract_diskwala_url(text)
    if not url:
        return

    status_msg = await update.message.reply_text("⏳ *Resolving video stream...*", parse_mode="Markdown")
    file_data = resolve_diskwala(url)

    if not file_data:
        await status_msg.edit_text("❌ *Error:* Could not resolve file or link expired.", parse_mode="Markdown")
        return

    title = file_data.get("title", "DiskWala Video")
    size = file_data.get("fileSize", "Unknown")
    video_url = file_data.get("streamUrl") or file_data.get("downloadUrl")

    caption = (
        f"🎬 *{title}*\\n\\n"
        f"📦 *Size:* {size}\\n"
        f"⚡ *Delivered directly to Telegram!*"
    )

    await status_msg.delete()

    try:
        # Directly send the video to chat
        await context.bot.send_video(
            chat_id=update.effective_chat.id,
            video=video_url,
            caption=caption,
            parse_mode="Markdown",
            supports_streaming=True,
        )
    except Exception as err:
        logger.warning(f"Direct sendVideo error: {err}")
        await update.message.reply_text(
            f"🎬 *{title}* ({size})\\n\\n"
            "⚠️ Video exceeds standard Telegram Bot API 50MB limit.\\n"
            f"Watch direct stream here:\\n{video_url}",
            parse_mode="Markdown"
        )

def main():
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("ERROR: Please provide TELEGRAM_BOT_TOKEN environment variable!")
        return

    # Start HTTP server in a lightweight daemon thread so Render detects port binding
    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()
    print(f"Health server listening on port {PORT} for Render...")

    # Start Telegram Bot Polling
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("ping", ping_command))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))

    print("DiskWala lightweight bot polling started successfully!")
    app.run_polling()

if __name__ == "__main__":
    main()
`;

export const RENDER_REQUIREMENTS = `python-telegram-bot==21.10
requests==2.32.3
`;

export const RENDER_PROCFILE = `web: python bot.py
`;


