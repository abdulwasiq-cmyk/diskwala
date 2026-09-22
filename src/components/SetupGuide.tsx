import { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';

export function SetupGuide() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const botFatherCommands = `start - Start bot and show menu
help - How to download & guide
stats - View bot performance & speed
ping - Check latency`;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Telegram Bot Setup & Configuration Guide
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete step-by-step instructions to create, customize, and optimize your DiskWala Telegram bot.
        </p>
      </div>

      {/* Step 1: Create Bot */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
            1
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            Create Your Bot with @BotFather
          </h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed pl-11">
          <p>
            Every Telegram bot must be registered through Telegram's official bot creation service,{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 font-medium hover:underline inline-flex items-center gap-1"
            >
              @BotFather
              <ExternalLink className="w-3 h-3" />
            </a>.
          </p>

          <ol className="list-decimal pl-4 space-y-2 text-slate-400 text-xs">
            <li>
              Open Telegram and search for <strong className="text-slate-200">@BotFather</strong> (look for the verified blue badge).
            </li>
            <li>
              Send the command <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">/newbot</code>.
            </li>
            <li>
              Choose a friendly display name for your bot (e.g., <em className="text-slate-300">My DiskWala Downloader</em>).
            </li>
            <li>
              Choose a unique username that must end in <code className="text-cyan-300">bot</code> (e.g., <em className="text-slate-300">diskwala_dl_fast_bot</em>).
            </li>
            <li>
              BotFather will reply with your API token formatted like:{' '}
              <code className="text-slate-300 font-mono">7123456789:ABCdefGHIjklMNOpqrSTUvwxYZ...</code>.
            </li>
            <li>
              Paste this token into the <strong className="text-slate-200">Bot Manager</strong> tab in this web app!
            </li>
          </ol>
        </div>
      </div>

      {/* Step 2: Configure Bot Menu Commands */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center border border-purple-500/30">
            2
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            Configure Command Auto-Complete Menu
          </h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed pl-11">
          <p>
            To show the native Telegram slash command menu in your bot chat, send the command list to @BotFather:
          </p>

          <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 text-xs">
            <li>Send <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">/setcommands</code> to @BotFather.</li>
            <li>Select your newly created bot.</li>
            <li>Copy and paste the exact list below:</li>
          </ol>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 relative">
            <button
              onClick={() => copyToClipboard(botFatherCommands, 'cmds')}
              className="absolute right-3 top-3 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              {copiedKey === 'cmds' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedKey === 'cmds' ? 'Copied' : 'Copy Commands'}
            </button>
            <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
              {botFatherCommands}
            </pre>
          </div>
        </div>
      </div>

      {/* Step 3: Group Chat Privacy Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
            3
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            Enable Group Chat Auto-Detection (Optional)
          </h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed pl-11">
          <p>
            By default, Telegram bots in groups cannot read messages unless someone mentions or replies to the bot.
            If you want the bot to automatically detect whenever a user posts a DiskWala link in a group:
          </p>

          <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 text-xs">
            <li>Send <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">/setprivacy</code> to @BotFather.</li>
            <li>Choose your bot.</li>
            <li>Select <strong className="text-slate-200">Disable</strong>.</li>
            <li>Now the bot can detect DiskWala links in any group where it is an admin or member!</li>
          </ol>
        </div>
      </div>

      {/* Step 4: File Size Limits Note */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30">
            4
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            Understanding Telegram File Limits & How We Solve It
          </h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed pl-11">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Telegram Bot API 20MB / 50MB Direct Upload Limit
            </h4>
            <p className="text-xs text-slate-400">
              The official Telegram Bot API has a strict file upload limit of 20MB (for standard HTTP bots) or 50MB (with local Bot API servers). Many DiskWala files are HD movies or full seasons weighing 500MB to 5GB+.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
            <h4 className="font-semibold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Direct Video Delivery (sendVideo)
            </h4>
            <p className="text-xs text-slate-300">
              Instead of sending confusing external download links, our bot delivers the actual video directly into the Telegram conversation:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
              <li><strong className="text-slate-200">Native In-Chat Player:</strong> Uses Telegram&apos;s <code className="text-cyan-300">sendVideo</code> with <code className="text-cyan-300">supports_streaming=True</code> so videos start playing immediately without waiting for download completion.</li>
              <li><strong className="text-slate-200">Save to Device / Gallery:</strong> Users can save the video directly to their camera roll or device files using Telegram&apos;s built-in 3-dots menu.</li>
              <li><strong className="text-slate-200">No Download Links Required:</strong> The user gets the media right inside Telegram without redirects, ads, or external pages.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
