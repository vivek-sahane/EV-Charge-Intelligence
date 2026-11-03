import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Cpu,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { evApi } from '../services/api';
import { ChatMessageItem } from '../types';

interface ChatInterfaceProps {
  isWidget?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "How many charging stations are available globally?",
  "Which country has the highest number of charging ports?",
  "Predict EV demand if station count is 500 and port count is 2000.",
  "Which countries have the highest future growth potential?",
  "Find charging hotspots in Europe.",
  "Which EV models support a 150 kW charging station?",
  "Compare India and Germany in EV infrastructure.",
  "What is the R² score of the growth prediction model?",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isWidget = false }) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState<string>(() => {
    const saved = localStorage.getItem('ev_chat_session_id');
    if (saved) return saved;
    const newId = `session_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('ev_chat_session_id', newId);
    return newId;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await evApi.getChatHistory(sessionId);
      if (res && res.messages && res.messages.length > 0) {
        setMessages(
          res.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            tool_calls: m.tool_calls_json ? JSON.parse(m.tool_calls_json) : undefined,
            tool_responses: m.tool_responses_json ? JSON.parse(m.tool_responses_json) : undefined,
            timestamp: m.created_at,
          }))
        );
      } else {
        // Welcome message
        setMessages([
          {
            role: 'assistant',
            content:
              "### 👋 Welcome to EV Intelligence AI Assistant\n\nI am connected to live backend database analytics and trained **GradientBoostingRegressor** machine learning models.\n\nAsk me about:\n- ⚡ **EV Demand Forecasting** for proposed charging sites\n- 📈 **Country Growth Potential** and infrastructure rankings\n- 🌐 **Geographic DBSCAN Hotspots** & KMeans centroids\n- 🔌 **EV Model Power Compatibility** (e.g. 150 kW, 250 kW)\n- ⚖️ **Side-by-side Country Comparisons** (e.g. India vs Germany)",
          },
        ]);
      }
    } catch (e) {
      console.warn('Could not load chat history, starting new conversation', e);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput('');
    const userMsg: ChatMessageItem = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await evApi.sendMessage(query, sessionId);
      const assistantMsg: ChatMessageItem = {
        role: 'assistant',
        content: res.content,
        tool_calls: res.tool_calls,
        tool_responses: res.tool_responses,
        timestamp: res.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error communicating with assistant**: ${err.message || 'Service temporarily unreachable.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await evApi.clearChatHistory(sessionId);
      setMessages([
        {
          role: 'assistant',
          content: 'Conversation history cleared. How can I assist you with EV analytics today?',
        },
      ]);
    } catch (e) {
      console.error('Failed to clear chat', e);
    }
  };

  // Basic markdown formatting helper for lists, tables, headers, and code
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Table row
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const cells = line.split('|').filter((c) => c.trim().length > 0);
        const isHeaderSep = line.includes('---');
        if (isHeaderSep) return null;
        return (
          <div key={idx} className="grid grid-cols-4 gap-2 text-xs py-1 border-b border-slate-800">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? 'font-semibold text-gray-300' : 'text-cyan-300'}>
                {cell.trim().replace(/\*\*/g, '')}
              </span>
            ))}
          </div>
        );
      }

      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base font-bold text-cyan-300 mt-2 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} className="text-sm font-semibold text-gray-200 mt-2 mb-1">
            {line.replace('#### ', '')}
          </h5>
        );
      }

      // Bullet points
      if (line.trim().startsWith('- ')) {
        const bulletText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start space-x-2 my-0.5 text-xs text-gray-300 pl-1">
            <span className="text-cyan-400 font-bold">•</span>
            <span>
              {bulletText.split('`').map((part, pIdx) =>
                pIdx % 2 === 1 ? (
                  <code key={pIdx} className="px-1 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 text-[11px]">
                    {part}
                  </code>
                ) : (
                  part.split('**').map((sub, sIdx) =>
                    sIdx % 2 === 1 ? <strong key={sIdx} className="text-white font-semibold">{sub}</strong> : sub
                  )
                )
              )}
            </span>
          </div>
        );
      }

      // Regular line
      return (
        <p key={idx} className="text-xs leading-relaxed text-gray-200 my-1">
          {line.split('`').map((part, pIdx) =>
            pIdx % 2 === 1 ? (
              <code key={pIdx} className="px-1 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 text-[11px]">
                {part}
              </code>
            ) : (
              part.split('**').map((sub, sIdx) =>
                sIdx % 2 === 1 ? <strong key={sIdx} className="text-white font-semibold">{sub}</strong> : sub
              )
            )
          )}
        </p>
      );
    });
  };

  return (
    <div className={`flex flex-col h-full ${isWidget ? 'max-h-[550px]' : 'min-h-[700px]'}`}>
      {/* Chat Header Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sky-500/15 bg-slate-900/60">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm shadow-cyan-500/30">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200">EV Intelligence AI Assistant</h3>
            <p className="text-[10px] text-cyan-400 font-mono">Real Backend Tools & ML Connected</p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] ${isUser ? 'text-right' : 'text-left'}`}>
                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl shadow-lg text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-tr-none'
                      : 'bg-slate-900/90 border border-sky-500/20 text-gray-200 rounded-tl-none glass-panel'
                  }`}
                >
                  {isUser ? msg.content : renderFormattedContent(msg.content)}
                </div>

                {/* Tool Calling Disclosure Accordion */}
                {!isUser && msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div className="mt-2 text-left">
                    <details className="group rounded-xl border border-sky-500/20 bg-slate-950/70 p-2 text-[11px] transition-all">
                      <summary className="cursor-pointer list-none font-mono text-cyan-400 flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          Backend Tool Executed: <code className="text-white">{msg.tool_calls[0].name}()</code>
                        </span>
                        <span className="text-[10px] text-gray-400 group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <div className="mt-2 pt-2 border-t border-slate-800 font-mono text-[10px] text-gray-300 overflow-x-auto space-y-1">
                        <div>
                          <span className="text-cyan-400 font-semibold">Arguments: </span>
                          <span className="text-gray-200">{JSON.stringify(msg.tool_calls[0].arguments)}</span>
                        </div>
                        {msg.tool_responses && msg.tool_responses.length > 0 && (
                          <div className="mt-1">
                            <span className="text-emerald-400 font-semibold">Live Response: </span>
                            <span className="text-gray-300">
                              {JSON.stringify(msg.tool_responses[0]).substring(0, 160)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-sky-500/20 text-gray-400 text-xs rounded-tl-none flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-2 text-cyan-300 font-mono text-[11px]">Querying Backend & ML Models...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 3 && (
        <div className="px-4 py-2 border-t border-sky-500/10 bg-slate-950/60">
          <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider mb-1.5">
            Suggested Inquiries:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q, qIdx) => (
              <button
                key={qIdx}
                onClick={() => handleSend(q)}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-sky-500/20 hover:border-cyan-400 text-gray-300 hover:text-cyan-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-sky-500/15 bg-slate-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about demand predictions, growth, hotspots, or EV models..."
            disabled={loading}
            className="flex-1 bg-slate-950/90 border border-sky-500/25 rounded-xl px-4 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-md shadow-cyan-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
