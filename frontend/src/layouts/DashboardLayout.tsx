import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { FloatingChatbot } from '../components/FloatingChatbot';
import { evApi } from '../services/api';
import { DashboardSummary } from '../types';

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    evApi.getSummary().then(setSummary).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex">
      {/* Collapsible Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {/* Top Navbar */}
        <Navbar summary={summary} onOpenChat={() => setIsChatOpen(true)} />

        {/* Page Content Body */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-4 px-8 border-t border-sky-500/10 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            EV CHARGE INTELLIGENCE &copy; {new Date().getFullYear()} — AI-Powered Infrastructure Analytics & Prediction
          </span>
          <span className="font-mono text-[11px] text-gray-400">
            PostgreSQL • Flask • Scikit-learn • React • Leaflet
          </span>
        </footer>
      </div>

      {/* Floating Chatbot Widget on Every Page */}
      <FloatingChatbot isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
    </div>
  );
};
