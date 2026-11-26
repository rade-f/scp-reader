import React, { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight, BookOpen } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectDoc }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Search API fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(trimmed)}`);
        if (resp.ok) {
          const data = await resp.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const isNumeric = /^\d+$/.test(query.trim());
  const num = query.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      style={{ paddingTop: "calc(5rem + var(--sat))", paddingBottom: "var(--sab)" }}
    >
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Apple Spotlight Modal */}
      <div className="relative w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-apple-border dark:border-apple-darkBorder overflow-hidden z-10 transition-all transform scale-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-apple-border dark:border-apple-darkBorder gap-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索编号、标题或直接输入数字 (例如: 173, cn-2000)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-black/5 dark:divide-white/5">
          {/* Direct jump suggestions for numbers */}
          {isNumeric && (
            <div className="p-2 space-y-1">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                直接跳转
              </div>
              <button
                onClick={() => {
                  onSelectDoc(`scp-${num}`);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-semibold text-xs">
                    EN
                  </div>
                  <span className="font-medium text-sm">SCP-{num}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onSelectDoc(`scp-cn-${num}`);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-semibold text-xs">
                    CN
                  </div>
                  <span className="font-medium text-sm">SCP-CN-{num}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Cached Results from DB */}
          {results.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                本地缓存档案
              </div>
              {results.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => {
                    onSelectDoc(item.slug);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-neutral-400" />
                    <div>
                      <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                        {item.title}
                      </div>
                      <div className="text-xs text-neutral-500">{item.slug}</div>
                    </div>
                  </div>
                  {item.object_class && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                      {item.object_class}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Quick jump for custom slug if entered */}
          {query.trim() && !isNumeric && results.length === 0 && !loading && (
            <div className="p-4 text-center">
              <button
                onClick={() => {
                  onSelectDoc(query.trim().toLowerCase());
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-apple-blue text-white text-xs font-medium hover:bg-blue-600 transition-colors cursor-pointer"
              >
                <span>以 "{query.trim()}" 作为编号拉取档案</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer hint */}
        <div className="px-4 py-2.5 bg-neutral-100/60 dark:bg-neutral-900/60 border-t border-apple-border dark:border-apple-darkBorder flex items-center justify-between text-[11px] text-neutral-500">
          <span>支持中文分部 (CN) 与主站自动嗅探</span>
          <span>按 ESC 键退出</span>
        </div>
      </div>
    </div>
  );
};
