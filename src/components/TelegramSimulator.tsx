import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Download,
  Play,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Film,
  FileText,
  RotateCcw,
  X,
} from 'lucide-react';
import type { DiskWalaFileResult, SimulatedTelegramMessage, BotStatus } from '../types.ts';

interface TelegramSimulatorProps {
  botStatus: BotStatus | null;
  onOpenManager: () => void;
}

export function TelegramSimulator({ botStatus, onOpenManager }: TelegramSimulatorProps) {
  const [messages, setMessages] = useState<SimulatedTelegramMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text:
        `🚀 *Welcome to the DiskWala & TeraBox Telegram Bot!*\n\n` +
        `Send me any *DiskWala* or *TeraBox* link and I will **directly send the video file** to this chat — no external download links, no waiting counters, and no ads.\n\n` +
        `⚡ *Supported Link Formats:*\n` +
        `• *DiskWala:* \`https://www.diskwala.com/app/...\`, \`dw.link\`, etc.\n` +
        `• *TeraBox:* \`https://terabox.com/s/1...\`, \`1024tera.com\`, etc.\n\n` +
        `✨ *Key Features:*\n` +
        `• **Direct Video Delivery** in Telegram chat\n` +
        `• Native in-chat player with zero ads\n` +
        `• Play & Save directly to gallery / device\n` +
        `• Zero waiting time & multi-provider fallback\n\n` +
        `👇 _Click below to test instant video delivery or paste your link:_`,
      timestamp: '10:00 AM',
      inlineButtons: [
        { text: '🎬 Send DiskWala Demo Video', callback_data: 'cmd_demo_dw' },
        { text: '📦 Send TeraBox Demo Video', callback_data: 'cmd_demo_tb' },
        { text: '📖 Help Guide', callback_data: 'cmd_help' },
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<DiskWalaFileResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputVal).trim();
    if (!textToSend) return;

    if (!customText) {
      setInputVal('');
    }

    // Add user message
    const userMsg: SimulatedTelegramMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: getCurrentTime(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsBotTyping(true);

    // Simulate bot thinking / resolving
    await processSimulatedInput(textToSend);
  };

  const processSimulatedInput = async (text: string) => {
    const lower = text.toLowerCase();

    // 1. Handle commands
    if (lower === '/start') {
      setIsBotTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text:
            `🚀 *DiskWala & TeraBox Bot is Ready!*\n\n` +
            `Send me any DiskWala or TeraBox link to get direct video delivery and stream URLs without any ads or app installation.`,
          timestamp: getCurrentTime(),
          inlineButtons: [
            { text: '🎬 Test DiskWala Demo', callback_data: 'cmd_demo_dw' },
            { text: '📦 Test TeraBox Demo', callback_data: 'cmd_demo_tb' },
            { text: '📖 Commands & Help', callback_data: 'cmd_help' },
          ],
        },
      ]);
      return;
    }

    if (lower === '/help') {
      setIsBotTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text:
            `📖 *DiskWala & TeraBox Bot Help Guide*\n\n` +
            `1️⃣ *How to Download:*\n` +
            `Simply copy any DiskWala or TeraBox link and paste it into this chat.\n\n` +
            `2️⃣ *Commands:*\n` +
            `• \`/start\` - Main menu\n` +
            `• \`/help\` - This help message\n` +
            `• \`/download <url>\` - Extract link\n` +
            `• \`/stats\` - System metrics\n` +
            `• \`/ping\` - Check speed\n\n` +
            `3️⃣ *Streaming:*\n` +
            `Click "Watch Online" or "Open in VLC" for instant video playback.`,
          timestamp: getCurrentTime(),
          inlineButtons: [
            { text: '🎬 DiskWala Demo', callback_data: 'cmd_demo_dw' },
            { text: '📦 TeraBox Demo', callback_data: 'cmd_demo_tb' },
          ],
        },
      ]);
      return;
    }

    if (lower === '/ping') {
      setIsBotTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `🏓 *Pong!*\n\n• Response Latency: *28ms*\n• DiskWala & TeraBox Engines: *Online 🟢*\n• Status: *Optimal*`,
          timestamp: getCurrentTime(),
        },
      ]);
      return;
    }

    if (lower === '/stats') {
      setIsBotTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text:
            `📊 *Bot Real-Time Statistics*\n\n` +
            `• Total Processed: *${(botStatus?.totalProcessed || 0) + 1}*\n` +
            `• Success Rate: *98.7%*\n` +
            `• Uptime: *${Math.floor((botStatus?.uptimeSeconds || 120) / 60)} minutes*\n` +
            `• Active Mode: *${botStatus?.isRunning ? 'Live Telegram Bot 🟢' : 'Interactive Simulator 🟡'}*`,
          timestamp: getCurrentTime(),
        },
      ]);
      return;
    }

    // 2. Check for URL
    let targetUrl = text;
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      targetUrl = urlMatch[0];
    } else if (text.startsWith('/download')) {
      const parts = text.split(/\s+/);
      if (parts.length > 1) {
        targetUrl = parts[1];
      }
    }

    const isTb = targetUrl.includes('tera') || targetUrl.includes('nepho') || targetUrl.includes('4fun') || targetUrl.includes('mirro');
    const platformName = isTb ? 'TeraBox' : 'DiskWala';

    // Send intermediate "Resolving..." message
    const resolvingId = `bot-resolving-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: resolvingId,
        sender: 'bot',
        text: `🔎 *Resolving ${platformName} Link...*\n_Bypassing wait-time & generating direct video stream..._`,
        timestamp: getCurrentTime(),
        isLoading: true,
      },
    ]);

    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();

      // Remove the "Resolving..." placeholder
      setMessages(prev => prev.filter(m => m.id !== resolvingId));
      setIsBotTyping(false);

      if (data.ok && data.result) {
        const file: DiskWalaFileResult = data.result;
        const isVideo = file.fileType === 'video' || file.mimeType?.startsWith('video/') || file.fileName?.match(/\.(mp4|mkv|mov|webm|avi)$/i);

        if (isVideo) {
          // DIRECT VIDEO MESSAGE - No download links!
          setMessages(prev => [
            ...prev,
            {
              id: `bot-video-${Date.now()}`,
              sender: 'bot',
              isDirectVideo: true,
              videoUrl: file.streamUrl || file.downloadUrl,
              text:
                `🎬 *${file.title}*\n\n` +
                `📦 *File Size:* ${file.fileSize}\n` +
                `👤 *Uploader:* ${file.uploaderName || 'DiskWala User'}\n` +
                `⚡ *Direct Video Delivery* — Play & save natively in Telegram!`,
              timestamp: getCurrentTime(),
              fileData: file,
              inlineButtons: [
                { text: '🔄 Send Another Video', callback_data: 'cmd_help' },
                { text: '📊 Bot Stats', callback_data: 'cmd_stats' },
              ],
            },
          ]);
        } else {
          const typeEmoji = file.fileType === 'audio' ? '🎵' : file.fileType === 'archive' ? '📦' : '📄';
          setMessages(prev => [
            ...prev,
            {
              id: `bot-file-${Date.now()}`,
              sender: 'bot',
              text:
                `${typeEmoji} *${file.title}*\n\n` +
                `📦 *File Size:* ${file.fileSize}\n` +
                `📁 *Category:* ${file.fileType.toUpperCase()}\n` +
                `👤 *Uploader:* ${file.uploaderName || 'DiskWala User'}\n\n` +
                `⚡ *Delivered directly to chat*`,
              timestamp: getCurrentTime(),
              fileData: file,
              inlineButtons: [
                { text: '🔄 Send Another Link', callback_data: 'cmd_help' },
                { text: '📊 Bot Stats', callback_data: 'cmd_stats' },
              ],
            },
          ]);
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'bot',
            text:
              `❌ *Download Error*\n\n` +
              `${data.message || 'Could not resolve file from this link.'}\n\n` +
              `💡 *Tips:*\n` +
              `• Verify the file wasn't deleted by creator\n` +
              `• Make sure link starts with https://diskwala.com/app/...\n\n` +
              `Click below to try with our verified sample file:`,
            timestamp: getCurrentTime(),
            inlineButtons: [{ text: '🧪 Try Demo Video Link', callback_data: 'cmd_demo' }],
          },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages(prev => prev.filter(m => m.id !== resolvingId));
      setIsBotTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `❌ *Network Error:* ${msg}\nPlease try again.`,
          timestamp: getCurrentTime(),
        },
      ]);
    }
  };

  const handleCallbackClick = (btn: { text: string; url?: string; callback_data?: string }, messageFile?: DiskWalaFileResult) => {
    if (btn.url) {
      window.open(btn.url, '_blank');
      return;
    }

    const cb = btn.callback_data;
    if (!cb) return;

    if (cb === 'cmd_demo' || cb === 'cmd_demo_dw') {
      handleSend('https://www.diskwala.com/app/demo');
    } else if (cb === 'cmd_demo_tb') {
      handleSend('https://terabox.com/s/1demo');
    } else if (cb === 'cmd_help') {
      handleSend('/help');
    } else if (cb === 'cmd_stats') {
      handleSend('/stats');
    } else if (cb.startsWith('play_')) {
      if (messageFile) {
        setActiveVideoModal(messageFile);
      }
    } else if (cb.startsWith('copy_')) {
      if (messageFile?.downloadUrl) {
        copyToClipboard(messageFile.downloadUrl, messageFile.id);
      }
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text:
          `🚀 *Welcome to the DiskWala & TeraBox Bot!*\n\n` +
          `Send me any *DiskWala* or *TeraBox link* to instantly download files and stream videos directly without ads or app requirements.\n\n` +
          `👇 _Click a quick action below or paste your link:_`,
        timestamp: getCurrentTime(),
        inlineButtons: [
          { text: '🎬 DiskWala Demo Video', callback_data: 'cmd_demo_dw' },
          { text: '📦 TeraBox Demo Video', callback_data: 'cmd_demo_tb' },
          { text: '📖 Help Guide', callback_data: 'cmd_help' },
        ],
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Simulator Info Header Banner */}
      <div className="mb-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-100 text-sm sm:text-base">
                Interactive Telegram Simulator
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Live Preview
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Test Telegram commands, DiskWala links, inline keyboards, and video streaming right in your browser.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={resetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Chat
          </button>
          {!botStatus?.hasToken && (
            <button
              onClick={onOpenManager}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Connect Real Bot
            </button>
          )}
        </div>
      </div>

      {/* Telegram Window Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[680px]">
        {/* Telegram Chat Header */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm">
                  {botStatus?.botInfo?.first_name || 'DiskWala Downloader Bot'}
                </span>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  bot
                </span>
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {botStatus?.isRunning
                  ? `@${botStatus.botInfo?.username} (Online)`
                  : 'online • ready for links'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">
              v2.4 High-Speed API
            </span>
          </div>
        </div>

        {/* Telegram Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/80 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {/* Sender Tag */}
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-slate-400">
                  {msg.sender === 'user' ? (
                    <>
                      <User className="w-3 h-3" />
                      <span>You</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400">
                        {botStatus?.botInfo?.username ? `@${botStatus.botInfo.username}` : 'DiskWala Bot'}
                      </span>
                    </>
                  )}
                </div>

                {/* Message Body with Markdown format simulation */}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text?.split('\n').map((line, idx) => {
                    // Simple parser for *bold* and _italic_
                    const formatted = line.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
                    return (
                      <div
                        key={idx}
                        dangerouslySetInnerHTML={{ __html: formatted }}
                        className={line.startsWith('•') ? 'pl-2 text-slate-300' : ''}
                      />
                    );
                  })}
                </div>

                {/* Direct Playable Video Player (Telegram Native Media Bubble) */}
                {msg.isDirectVideo && msg.videoUrl ? (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/80 bg-black shadow-xl">
                    <video
                      src={msg.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      poster={msg.fileData?.thumbnailUrl}
                      className="w-full max-h-[300px] object-contain bg-black"
                    />
                    <div className="bg-slate-950 px-3 py-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 font-medium text-cyan-400">
                        <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                        Direct Video Stream
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        In-Chat Video
                      </span>
                    </div>
                  </div>
                ) : msg.fileData && msg.fileData.thumbnailUrl ? (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950">
                    <img
                      src={msg.fileData.thumbnailUrl}
                      alt={msg.fileData.title}
                      className="w-full h-40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-xs font-semibold text-white truncate">
                        {msg.fileData.title}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Inline Buttons Grid */}
                {msg.inlineButtons && msg.inlineButtons.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {msg.inlineButtons.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleCallbackClick(btn, msg.fileData)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center ${
                          btn.text.includes('Download')
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:brightness-110 shadow-sm'
                            : btn.text.includes('Watch') || btn.text.includes('Stream')
                            ? 'bg-slate-800 text-cyan-300 border border-cyan-800/50 hover:bg-slate-750'
                            : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {btn.text.includes('Download') ? (
                          <Download className="w-3.5 h-3.5" />
                        ) : btn.text.includes('Watch') ? (
                          <Play className="w-3.5 h-3.5" />
                        ) : btn.text.includes('Copy') ? (
                          copiedId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                        <span>{btn.text}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`text-[10px] text-right mt-1.5 ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isBotTyping && (
            <div className="flex items-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 rounded-bl-none flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-400">Bot is typing</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 whitespace-nowrap">Quick:</span>
          <button
            onClick={() => handleSend('https://www.diskwala.com/app/demo')}
            className="px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 border border-cyan-800/50 hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            🎬 DiskWala Demo
          </button>
          <button
            onClick={() => handleSend('https://terabox.com/s/1demo')}
            className="px-2.5 py-1 rounded-full bg-slate-800 text-blue-300 border border-blue-800/50 hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            📦 TeraBox Demo
          </button>
          <button
            onClick={() => handleSend('/start')}
            className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            /start
          </button>
          <button
            onClick={() => handleSend('/help')}
            className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            /help
          </button>
          <button
            onClick={() => handleSend('/stats')}
            className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            /stats
          </button>
          <button
            onClick={() => handleSend('/ping')}
            className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            /ping
          </button>
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="bg-slate-900 p-3 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Paste DiskWala link or type command (e.g. /help)..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isBotTyping}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* In-Browser Video Player Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-slate-100 text-sm truncate max-w-md">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black aspect-video flex items-center justify-center">
              <video
                controls
                autoPlay
                src={activeVideoModal.streamUrl || activeVideoModal.downloadUrl}
                className="w-full h-full max-h-[500px]"
              >
                Your browser does not support HTML5 video streaming.
              </video>
            </div>

            <div className="p-4 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                <span>Size: <strong className="text-slate-200">{activeVideoModal.fileSize}</strong></span>
                <span className="mx-2">•</span>
                <span>Type: <strong className="text-slate-200">{activeVideoModal.fileType.toUpperCase()}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeVideoModal.downloadUrl}
                  download={activeVideoModal.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Direct Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
