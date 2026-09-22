import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { TelegramSimulator } from './components/TelegramSimulator.tsx';
import { BotManager } from './components/BotManager.tsx';
import { WebDownloader } from './components/WebDownloader.tsx';
import { CodeExporter } from './components/CodeExporter.tsx';
import { SetupGuide } from './components/SetupGuide.tsx';
import type { BotStatus } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'manager' | 'downloader' | 'code' | 'guide'>('simulator');
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const fetchBotStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/bot/status');
      const json = await res.json();
      if (json.ok && json.data) {
        setBotStatus(json.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 6000);
    return () => clearInterval(interval);
  }, [fetchBotStatus]);

  const handleQuickToggle = async () => {
    if (!botStatus?.hasToken) return;
    const endpoint = botStatus.isRunning ? '/api/bot/stop' : '/api/bot/start';
    try {
      await fetch(endpoint, { method: 'POST' });
      await fetchBotStatus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        botStatus={botStatus}
        onQuickToggle={handleQuickToggle}
        isLoadingStatus={isLoadingStatus}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'simulator' && (
          <TelegramSimulator
            botStatus={botStatus}
            onOpenManager={() => setActiveTab('manager')}
          />
        )}

        {activeTab === 'manager' && (
          <BotManager
            botStatus={botStatus}
            onRefreshStatus={fetchBotStatus}
            isLoadingStatus={isLoadingStatus}
          />
        )}

        {activeTab === 'downloader' && <WebDownloader />}

        {activeTab === 'code' && <CodeExporter />}

        {activeTab === 'guide' && <SetupGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-semibold text-slate-300">DiskWala Telegram Bot Studio</span>
            <span>•</span>
            <span>Ad-free link resolution & direct media streams</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('simulator')}
              className="hover:text-slate-200 transition-colors"
            >
              Simulator
            </button>
            <button
              onClick={() => setActiveTab('downloader')}
              className="hover:text-slate-200 transition-colors"
            >
              Web Extractor
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className="hover:text-slate-200 transition-colors"
            >
              Export Code
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className="hover:text-slate-200 transition-colors"
            >
              Guide
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
