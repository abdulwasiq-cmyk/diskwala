import { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Power,
  RefreshCw,
  Activity,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Radio,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { BotStatus, ActivityLog } from '../types.ts';

interface BotManagerProps {
  botStatus: BotStatus | null;
  onRefreshStatus: () => Promise<void>;
  isLoadingStatus: boolean;
}

export function BotManager({ botStatus, onRefreshStatus, isLoadingStatus }: BotManagerProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'error'>('all');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Auto-fill Webhook URL based on current host
  const detectedWebhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/telegram-webhook`
    : '';

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/bot/logs');
      const data = await res.json();
      if (data.ok && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleConfigureToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsSavingToken(true);
    setTokenFeedback(null);

    try {
      const res = await fetch('/api/bot/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim(), autoStart: true }),
      });
      const data = await res.json();

      if (data.ok) {
        setTokenFeedback({
          type: 'success',
          message: `Connected successfully as @${data.data.botInfo?.username || 'bot'}! Long-polling is now active.`,
        });
        setTokenInput('');
        await onRefreshStatus();
        fetchLogs();
      } else {
        setTokenFeedback({
          type: 'error',
          message: data.error || 'Invalid Telegram bot token. Please check the token provided by @BotFather.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTokenFeedback({ type: 'error', message: `Network error: ${msg}` });
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleToggleBot = async () => {
    if (!botStatus?.hasToken) return;

    const endpoint = botStatus.isRunning ? '/api/bot/stop' : '/api/bot/start';
    try {
      await fetch(endpoint, { method: 'POST' });
      await onRefreshStatus();
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetWebhook = async () => {
    if (!botStatus?.hasToken) return;
    try {
      const res = await fetch('/api/bot/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: detectedWebhookUrl }),
      });
      const data = await res.json();
      if (data.ok) {
        setTokenFeedback({ type: 'success', message: 'Telegram Webhook registered successfully!' });
      } else {
        setTokenFeedback({ type: 'error', message: data.error || 'Failed to set webhook' });
      }
      await onRefreshStatus();
      fetchLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTokenFeedback({ type: 'error', message: `Webhook error: ${msg}` });
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(detectedWebhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Telegram Bot Manager & Status
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect your @BotFather bot token, manage polling/webhook modes, and inspect real-time logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onRefreshStatus();
              fetchLogs();
            }}
            disabled={isLoadingStatus}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            Refresh State
          </button>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Bot Status</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                botStatus?.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="text-lg font-bold text-slate-100">
              {botStatus?.isRunning ? 'Polling Active' : 'Stopped / Idle'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mode: <span className="font-mono text-slate-300 uppercase">{botStatus?.mode || 'None'}</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Links Processed</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {botStatus?.totalProcessed || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total DiskWala requests handled
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Successful Downloads</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {botStatus?.successCount || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Bypassed and resolved
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Server Uptime</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {Math.floor((botStatus?.uptimeSeconds || 0) / 60)}m
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active server process
          </p>
        </div>
      </div>

      {/* Main Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Token & Webhook Setup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Token Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Telegram Bot API Token
                </h3>
                <p className="text-xs text-slate-400">
                  Obtain your token from <strong className="text-slate-300">@BotFather</strong> on Telegram.
                </p>
              </div>
            </div>

            {botStatus?.hasToken && botStatus?.botInfo && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm">
                        {botStatus.botInfo.first_name}
                      </span>
                      <a
                        href={`https://t.me/${botStatus.botInfo.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                      >
                        @{botStatus.botInfo.username}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-400">
                      ID: <span className="font-mono">{botStatus.botInfo.id}</span> • Active Token: <span className="font-mono">{botStatus.maskedToken}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleBot}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    botStatus.isRunning
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {botStatus.isRunning ? 'Stop Bot' : 'Start Polling'}
                </button>
              </div>
            )}

            <form onSubmit={handleConfigureToken} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {botStatus?.hasToken ? 'Update Bot Token' : 'Enter Bot Token'}
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pr-20 text-sm text-slate-100 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: Numbers followed by a colon and 35 alphanumeric characters.
                </p>
              </div>

              {tokenFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    tokenFeedback.type === 'success'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950/40 text-rose-300 border-rose-800'
                  }`}
                >
                  {tokenFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{tokenFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Bot will start receiving Telegram links automatically upon verification.
                </span>
                <button
                  type="submit"
                  disabled={!tokenInput.trim() || isSavingToken}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSavingToken ? 'Verifying...' : 'Save & Start Bot'}
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Configuration Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Webhook Mode (Alternative to Polling)
                </h3>
                <p className="text-xs text-slate-400">
                  Send updates instantly from Telegram to your server via HTTP POST.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Webhook Endpoint URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={detectedWebhookUrl}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all"
                  />
                  <button
                    onClick={copyWebhook}
                    className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    {copiedWebhook ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedWebhook ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-400 max-w-md">
                  Webhook mode requires an active bot token and a publicly reachable HTTPS URL (Cloud Run or custom domain).
                </p>
                <button
                  onClick={handleSetWebhook}
                  disabled={!botStatus?.hasToken}
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
                >
                  Register Webhook with Telegram
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Log Stream */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-slate-100 text-sm">
                  Live Event Stream
                </h3>
              </div>

              {/* Log filter pills */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-2 py-0.5 rounded-md ${
                    logFilter === 'all'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setLogFilter('success')}
                  className={`px-2 py-0.5 rounded-md ${
                    logFilter === 'success'
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Success
                </button>
                <button
                  onClick={() => setLogFilter('error')}
                  className={`px-2 py-0.5 rounded-md ${
                    logFilter === 'error'
                      ? 'bg-rose-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Errors
                </button>
              </div>
            </div>

            {/* Log Messages List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  No log events recorded yet. Send a link in Telegram or use the simulator to generate activity.
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg border ${
                      log.type === 'success'
                        ? 'bg-emerald-950/20 text-emerald-300 border-emerald-900/40'
                        : log.type === 'error'
                        ? 'bg-rose-950/20 text-rose-300 border-rose-900/40'
                        : log.type === 'warning'
                        ? 'bg-amber-950/20 text-amber-300 border-amber-900/40'
                        : 'bg-slate-950/40 text-slate-300 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="uppercase font-semibold tracking-wider">
                        [{log.source}]
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="break-words">{log.message}</div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Logging
              </span>
              <span>{logs.length} events logged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
