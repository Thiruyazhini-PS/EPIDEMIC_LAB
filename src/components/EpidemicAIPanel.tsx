// src/components/EpidemicAIPanel.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  Cpu,
  CornerDownLeft,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface EpidemicAIPanelProps {
  onClose: () => void;
  onPromptSelect?: (prompt: string) => void;
}

export const EpidemicAIPanel: React.FC<EpidemicAIPanelProps> = ({
  onClose,
  onPromptSelect,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);

  const suggestedPrompts = [
    'Why did the outbreak peak here?',
    "Trace this person's contacts.",
    'Explain the current BFS traversal.',
    'Compare this counterfactual intervention.',
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;
    setSubmittedQuery(promptInput);
    if (onPromptSelect) onPromptSelect(promptInput);
  };

  const handlePickPrompt = (text: string) => {
    setPromptInput(text);
    setSubmittedQuery(text);
    if (onPromptSelect) onPromptSelect(text);
  };

  if (isMinimized) {
    return (
      <div className="absolute bottom-28 right-4 z-40 rounded-full bg-white/90 border border-[#9FA1FF]/40 shadow-xl px-4 py-2 flex items-center space-x-2.5 text-[#444766] font-mono text-xs backdrop-blur-md animate-in fade-in select-none">
        <div className="w-2 h-2 rounded-full bg-[#9192E8] animate-pulse" />
        <Bot className="w-3.5 h-3.5 text-[#9192E8]" />
        <span className="font-bold">EPIDEMIC AI</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-slate-100 rounded-lg text-[#9192E8] cursor-pointer"
          title="Expand AI Assistant"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-lg text-[#787B99] cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-28 right-4 z-40 w-96 rounded-2xl glass-panel border border-[#9FA1FF]/45 shadow-2xl p-5 text-[#444766] font-mono text-xs space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(159,161,255,0.22)]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-purple-50 border border-[#9FA1FF]/40 text-[#9192E8]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold uppercase tracking-wider text-xs text-[#444766]">
              EPIDEMIC AI
            </h3>
            <span className="text-[10px] text-[#787B99]">COGNITIVE EPIDEMIOLOGY ASSISTANT</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-[#787B99] hover:text-[#444766] cursor-pointer"
            title="Minimize to floating pill to view background network"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-[#787B99] hover:text-[#444766] cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Model Status Card */}
      <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/25 space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#787B99] font-bold">MODEL STATUS</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
            DISCONNECTED (AI-READY)
          </span>
        </div>
        <p className="text-[10.5px] text-[#676B8C] leading-relaxed">
          Frontend architecture is fully structured to stream inferences from an external LLM / reasoning server once configured.
        </p>
      </div>

      {/* Submitted Query Display or Initial Guidance */}
      {submittedQuery ? (
        <div className="p-3 rounded-xl bg-purple-50/80 border border-[#9FA1FF]/30 space-y-2 shadow-xs">
          <div className="flex items-center space-x-1.5 text-[#9192E8] text-[10px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#9192E8]" />
            <span>DISPATCHED TO BACKEND PROXY:</span>
          </div>
          <p className="text-[#444766] text-[11px] font-semibold">"{submittedQuery}"</p>
          <div className="pt-2 border-t border-[rgba(159,161,255,0.2)] text-[10px] text-[#787B99] flex items-center space-x-1.5">
            <Cpu className="w-3 h-3 text-[#9192E8]" />
            <span>Awaiting LLM endpoint connection. Responses are not fabricated.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#787B99] block font-bold">SUGGESTED PROMPTS</span>
          <div className="space-y-1.5">
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handlePickPrompt(p)}
                className="w-full text-left p-2 rounded-xl bg-white/80 hover:bg-white border border-[#9FA1FF]/20 hover:border-[#9192E8] text-[#444766] text-[11px] transition-all flex items-center justify-between group shadow-xs cursor-pointer"
              >
                <span>{p}</span>
                <CornerDownLeft className="w-3 h-3 text-[#787B99] group-hover:text-[#9192E8]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="relative pt-1">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Ask about this simulation..."
          className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white border border-[#9FA1FF]/30 text-[#444766] text-xs placeholder:text-[#787B99]/60 focus:border-[#9192E8] focus:outline-none transition-all shadow-xs"
        />
        <button
          type="submit"
          disabled={!promptInput.trim()}
          className="absolute right-1.5 bottom-1.5 p-1.5 rounded-lg bg-[#9192E8] hover:bg-[#8384e5] text-white disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
