import React from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { ChatInterface } from '../chatbot/ChatInterface';

interface FloatingChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ isOpen, onToggle }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-100px)] rounded-3xl bg-slate-950/95 border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-sky-500/20">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-100 tracking-wide">
                  EV Intelligence AI
                </span>
                <span className="block text-[10px] text-cyan-400 font-mono">
                  Floating Analytics Assistant
                </span>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Embedded Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface isWidget={true} />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={onToggle}
        className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-105 active:scale-95 transition-all duration-200"
        title="Open EV Intelligence AI Assistant"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0b0f19] animate-pulse"></span>
        {isOpen ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
        ) : (
          <Bot className="w-6 h-6 transition-transform group-hover:scale-110" />
        )}
      </button>
    </div>
  );
};
