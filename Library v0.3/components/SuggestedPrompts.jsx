import { useState } from "react";
import { Sparkles, Code2, FileText, Compass, Send, Paperclip, Mic, ArrowRight } from "lucide-react";

const PROMPTS = [
  {
    id: "brainstorm",
    icon: Sparkles,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    label: "Ideation",
    labelColor: "text-amber-600",
    text: "Brainstorm 5 creative marketing ideas for a SaaS launch",
  },
  {
    id: "code",
    icon: Code2,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    label: "Code",
    labelColor: "text-blue-600",
    text: "Analyze this React component for performance bottlenecks",
  },
  {
    id: "writing",
    icon: FileText,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    label: "Writing",
    labelColor: "text-emerald-600",
    text: "Draft a concise summary email from bullet points",
  },
  {
    id: "strategy",
    icon: Compass,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-700",
    label: "Strategy",
    labelColor: "text-pink-600",
    text: "Outline a product roadmap for Q3",
  },
];

export default function SuggestedPrompts() {
  const [inputValue, setInputValue] = useState("");
  const [activePrompt, setActivePrompt] = useState(null);

  function handleSelect(prompt) {
    setActivePrompt(prompt.id);
    setInputValue(prompt.text);
  }

  function handleClear() {
    setActivePrompt(null);
    setInputValue("");
  }

  const hasInput = inputValue.trim().length > 0;

  return (
    <div className="flex items-center justify-center min-h-[420px] bg-zinc-50 p-6 rounded-xl">
      <div className="w-full max-w-[480px] bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            i
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900 leading-none">Aria</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">AI assistant · ready</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
            <span className="text-[11px] text-zinc-400">Online</span>
          </div>
        </div>

        {/* Suggested prompts */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
              Suggested actions
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium">
              Preset action
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              const isActive = activePrompt === prompt.id;
              return (
                <button
                  key={prompt.id}
                  onClick={() => handleSelect(prompt)}
                  className={[
                    "flex items-start gap-2.5 p-3 rounded-xl border text-left",
                    "transition-all duration-150 group",
                    isActive
                      ? "border-zinc-900 bg-zinc-50 shadow-sm"
                      : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-white hover:shadow-md hover:-translate-y-0.5",
                  ].join(" ")}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${prompt.iconBg}`}>
                    <Icon size={12} className={prompt.iconColor} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-800 leading-[15px] line-clamp-2">
                      {prompt.text}
                    </p>
                    <span className={`mt-1 inline-block text-[9px] font-semibold uppercase tracking-wide ${prompt.labelColor}`}>
                      {prompt.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-zinc-100 mb-3" />

        {/* Input area */}
        <div className="px-5 pb-5">
          <div className={[
            "border rounded-xl bg-white transition-all duration-150",
            hasInput ? "border-zinc-900 shadow-sm" : "border-zinc-200",
          ].join(" ")}>
            <div className="px-3.5 pt-3 pb-1">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (!e.target.value) setActivePrompt(null);
                }}
                placeholder="Click a suggestion or type anything…"
                rows={3}
                className="w-full resize-none text-[12.5px] text-zinc-800 placeholder:text-zinc-400 outline-none bg-transparent leading-[18px]"
              />
            </div>

            <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-100">
              <div className="flex items-center gap-1.5">
                <button className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors">
                  <Paperclip size={12} />
                </button>
                <button className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors">
                  <Mic size={12} />
                </button>
                {hasInput && (
                  <button
                    onClick={handleClear}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600 ml-1 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                disabled={!hasInput}
                className={[
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all duration-150",
                  hasInput
                    ? "bg-zinc-900 text-white hover:bg-zinc-700 shadow-sm"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed",
                ].join(" ")}
              >
                Send
                {hasInput ? <Send size={11} /> : <ArrowRight size={11} />}
              </button>
            </div>
          </div>

          {hasInput && (
            <p className="mt-2 text-center text-[10px] text-zinc-400">
              Press <kbd className="px-1 py-0.5 rounded bg-zinc-100 font-mono text-[9px]">⌘↵</kbd> to send
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
