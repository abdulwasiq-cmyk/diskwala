import { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Cloud,
  FileText,
  Zap,
} from 'lucide-react';
import {
  NODE_RENDER_SCRIPT,
  NODE_PACKAGE_JSON,
  RENDER_PYTHON_SCRIPT,
  RENDER_REQUIREMENTS,
  NODE_BOT_SCRIPT,
} from '../data/botTemplates.ts';

export function CodeExporter() {
  const [activeLang, setActiveLang] = useState<'node-render' | 'package-json' | 'python-render' | 'requirements' | 'telegraf'>('node-render');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getActiveCode = () => {
    switch (activeLang) {
      case 'node-render':
        return NODE_RENDER_SCRIPT;
      case 'package-json':
        return NODE_PACKAGE_JSON;
      case 'python-render':
        return RENDER_PYTHON_SCRIPT;
      case 'requirements':
        return RENDER_REQUIREMENTS;
      case 'telegraf':
        return NODE_BOT_SCRIPT;
    }
  };

  const getFilename = () => {
    switch (activeLang) {
      case 'node-render':
        return 'index.js (Node.js for Render Free Tier)';
      case 'package-json':
        return 'package.json';
      case 'python-render':
        return 'bot.py (Python Alternative)';
      case 'requirements':
        return 'requirements.txt';
      case 'telegraf':
        return 'bot.js (Telegraf)';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5" />
          Ultra-Lightweight Node.js (Only ~25MB RAM on Render Free Tier)
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Node.js Standalone Bot for Render Free Tier
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Export a featherweight Node.js Telegram bot built specifically to run 24/7 on Render’s free Web Service tier without getting suspended or exceeding 512MB RAM.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveLang('node-render')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            activeLang === 'node-render'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-200" />
          index.js (~25MB RAM)
        </button>

        <button
          onClick={() => setActiveLang('package-json')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            activeLang === 'package-json'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          package.json
        </button>

        <button
          onClick={() => setActiveLang('python-render')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            activeLang === 'python-render'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          bot.py (Python Alternative)
        </button>

        <button
          onClick={() => setActiveLang('requirements')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            activeLang === 'requirements'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          requirements.txt
        </button>

        <button
          onClick={() => setActiveLang('telegraf')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            activeLang === 'telegraf'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          bot.js (Telegraf)
        </button>
      </div>

      {/* Code Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            {getFilename()}
          </div>

          <button
            onClick={() => copyToClipboard(getActiveCode(), 'code')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            {copiedKey === 'code' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedKey === 'code' ? 'Copied' : 'Copy All Code'}
          </button>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[500px]">
          {getActiveCode()}
        </pre>
      </div>

      {/* Render Free Step-by-Step Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-slate-100 text-base flex items-center gap-2">
          <Cloud className="w-5 h-5 text-emerald-400" />
          How to Deploy Node.js to Render Free Tier (3 Easy Steps)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
              Create GitHub Repo
            </div>
            <p className="text-slate-400">Push only 2 files to your GitHub repository:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono text-[11px]">
              <li>index.js (copy code above)</li>
              <li>package.json (copy tab above)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
              New Web Service on Render
            </div>
            <ul className="space-y-1 text-slate-400">
              <li>• Go to <strong>dashboard.render.com</strong></li>
              <li>• Click <strong>New +</strong> &rarr; <strong>Web Service</strong></li>
              <li>• Connect your GitHub repository</li>
              <li>• Runtime: <strong>Node</strong></li>
              <li>• Build: <code className="text-emerald-300">npm install</code></li>
              <li>• Start: <code className="text-emerald-300">npm start</code></li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
              Add Bot Token &amp; Run
            </div>
            <ul className="space-y-1 text-slate-400">
              <li>• Scroll to <strong>Environment Variables</strong></li>
              <li>• Key: <code className="text-emerald-300">TELEGRAM_BOT_TOKEN</code></li>
              <li>• Value: <em>Your token from @BotFather</em></li>
              <li>• Plan: <strong>Free</strong></li>
              <li>• Click <strong>Create Web Service</strong></li>
            </ul>
          </div>
        </div>

        {/* Why this Node setup wins on Render */}
        <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-xs text-slate-300 flex flex-col gap-1.5">
          <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
            ⚡ Why this Node.js setup is optimal for Render Free (512MB RAM):
          </div>
          <p className="text-slate-400">
            • <strong>Lowest RAM:</strong> Uses <code className="text-emerald-300">grammY</code> + Node 20 native fetch (zero bulky packages like axios or heavy binary modules) &mdash; idle memory is only <strong>~24MB - 30MB</strong> (Render gives you 512MB, so you use less than 6%).<br />
            • <strong>Render Port Binding:</strong> Includes a built-in zero-overhead HTTP server on <code className="text-emerald-300">process.env.PORT</code>, keeping Render&apos;s free Web Service healthy without paying for a background worker.<br />
            • <strong>Direct Video Delivery:</strong> Directly delivers the video file to the chat via <code className="text-emerald-300">replyWithVideo</code> with streaming enabled (no download links).
          </p>
        </div>
      </div>
    </div>
  );
}

