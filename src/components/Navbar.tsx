import { Bot, Send, Download, Code2, HelpCircle, Activity, Power } from 'lucide-react';
import type { BotStatus } from '../types.ts';

interface NavbarProps {
  activeTab: 'simulator' | 'manager' | 'downloader' | 'code' | 'guide';
  setActiveTab: (tab: 'simulator' | 'manager' | 'downloader' | 'code' | 'guide') => void;
  botStatus: BotStatus | null;
  onQuickToggle: () => void;
  isLoadingStatus: boolean;
}

export function Navbar({
  activeTab,
  setActiveTab,
  botStatus,
  onQuickToggle,
  isLoadingStatus,
}: NavbarProps) {
  const isRunning = botStatus?.isRunning;
  const botUsername = botStatus?.botInfo?.username;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-lg tracking-tight">
                  DiskWala Bot
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Telegram Downloader
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                High-Speed Link Resolver & Telegram Bot Runner
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Send className="w-4 h-4" />
              Bot Simulator
            </button>

            <button
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'manager'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              Bot Manager
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('downloader')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'downloader'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Download className="w-4 h-4" />
              Web Downloader
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Deploy Code
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Setup Guide
            </button>
          </nav>

          {/* Bot Status & Control */}
          <div className="flex items-center gap-2.5">
            {botUsername ? (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                title="Open in Telegram app"
              >
                @{botUsername}
              </a>
            ) : null}

            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isRunning
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : botStatus?.hasToken
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? 'bg-emerald-400 animate-ping'
                    : botStatus?.hasToken
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
              {isRunning
                ? 'Bot Active'
                : botStatus?.hasToken
                ? 'Bot Idle'
                : 'Simulator Mode'}
            </div>

            {botStatus?.hasToken && (
              <button
                onClick={onQuickToggle}
                disabled={isLoadingStatus}
                title={isRunning ? 'Stop Bot' : 'Start Bot'}
                className={`p-2 rounded-lg border transition-all ${
                  isRunning
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Submenu Tabs */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2.5 gap-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('manager')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'manager'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manager
          </button>
          <button
            onClick={() => setActiveTab('downloader')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'downloader'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Downloader
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deploy Code
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guide
          </button>
        </div>
      </div>
    </header>
  );
}
