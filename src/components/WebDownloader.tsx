import { useState } from 'react';
import {
  Download,
  Link as LinkIcon,
  Play,
  Film,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  AlertCircle,
  FileCode,
  Shield,
  Zap,
} from 'lucide-react';
import type { DiskWalaFileResult } from '../types.ts';

export function WebDownloader() {
  const [urlInput, setUrlInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<DiskWalaFileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleResolve = async (urlToUse?: string) => {
    const target = (urlToUse || urlInput).trim();
    if (!target) return;

    if (urlToUse) {
      setUrlInput(urlToUse);
    }

    setIsResolving(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();

      if (data.ok && data.result) {
        setResult(data.result);
      } else {
        setError(data.message || 'Unable to resolve file from this link. Please check if the link is active.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Network error: ${msg}`);
    } finally {
      setIsResolving(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleLinks = [
    { label: '🎬 DiskWala Demo (158 MB)', url: 'https://www.diskwala.com/app/demo' },
    { label: '📦 TeraBox Demo (142 MB)', url: 'https://terabox.com/s/1demo' },
    { label: '🔗 TeraBox Format', url: 'https://terabox.com/s/1sample-key' },
    { label: '🔗 DiskWala Short Link', url: 'https://dw.link/sample-id' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          Direct Stream & Fast Download
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          DiskWala & TeraBox Direct Link Extractor
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Extract original high-speed direct download URLs and streaming endpoints from any DiskWala or TeraBox link without ads, waiting counters, or forced app downloads.
        </p>
      </div>

      {/* Input Box Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleResolve();
          }}
          className="space-y-3"
        >
          <label className="block text-xs font-medium text-slate-300">
            Paste DiskWala or TeraBox File URL
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://www.diskwala.com/app/... or https://terabox.com/s/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={!urlInput.trim() || isResolving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
            >
              {isResolving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Link</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Sample Links */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Try Sample:</span>
          {sampleLinks.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleResolve(s.url)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-5 flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-200">Extraction Failed</h4>
            <p className="text-xs text-rose-300/90 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Resolved Result Card */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-6">
          {/* Card Header Banner */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                {result.fileType === 'video' ? (
                  <Film className="w-6 h-6" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg truncate max-w-xl">
                  {result.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono font-semibold">
                    {result.fileSize}
                  </span>
                  <span>•</span>
                  <span className="uppercase text-slate-300 font-semibold">
                    {result.fileType}
                  </span>
                  <span>•</span>
                  <span>Uploader: {result.uploaderName || 'DiskWala Creator'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={result.downloadUrl}
                download={result.fileName}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                Direct Download
              </a>
            </div>
          </div>

          {/* Video Player (if video stream exists) */}
          {result.fileType === 'video' && result.streamUrl && (
            <div className="px-6">
              <div className="rounded-xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                <video
                  controls
                  src={result.streamUrl}
                  className="w-full max-h-[420px] aspect-video object-contain"
                >
                  Your browser does not support HTML5 video preview.
                </video>
              </div>
            </div>
          )}

          {/* Direct Link Breakdown & Actions */}
          <div className="px-6 pb-6 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Direct Endpoints & Quick Copy
            </h4>

            {/* Direct Download URL */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3">
              <div className="overflow-hidden">
                <div className="text-[11px] font-semibold text-slate-400">
                  Direct High-Speed Download URL
                </div>
                <div className="text-xs text-slate-200 font-mono truncate">
                  {result.downloadUrl}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(result.downloadUrl, 'dl')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedKey === 'dl' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedKey === 'dl' ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Video Stream URL */}
            {result.streamUrl && (
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Online Streaming URL (VLC / MX Player)
                  </div>
                  <div className="text-xs text-cyan-300 font-mono truncate">
                    {result.streamUrl}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`vlc://${result.streamUrl}`}
                    className="px-2.5 py-1.5 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30 text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Launch VLC media player"
                  >
                    <Play className="w-3.5 h-3.5" />
                    VLC
                  </a>
                  <button
                    onClick={() => copyToClipboard(result.streamUrl!, 'stream')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'stream' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === 'stream' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* cURL Command Generator */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3">
              <div className="overflow-hidden">
                <div className="text-[11px] font-semibold text-slate-400">
                  cURL Terminal Command
                </div>
                <div className="text-xs text-slate-300 font-mono truncate">
                  curl -L -O -J &quot;{result.downloadUrl}&quot;
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(`curl -L -O -J "${result.downloadUrl}"`, 'curl')
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedKey === 'curl' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedKey === 'curl' ? 'Copied' : 'Copy Command'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-slate-100 text-sm">Ad Bypass & Zero Waiting</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Eliminates 30-second timers, pop-up redirects, and forced app installations from standard DiskWala pages.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Play className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-slate-100 text-sm">Instant Stream Intent</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Directly play videos in VLC Media Player, MX Player, or HTML5 browser players without waiting for downloads to finish.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-slate-100 text-sm">Full Telegram Bot Support</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            The exact same engine powers our Telegram bot, allowing users to send links directly inside Telegram chats or channels.
          </p>
        </div>
      </div>
    </div>
  );
}
