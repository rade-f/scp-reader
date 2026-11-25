import React, { useState, useEffect } from "react";
import { X, Bookmark, History, ArrowRight } from "lucide-react";

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (slug: string) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({ isOpen, onClose, onSelectDoc }) => {
  const [tab, setTab] = useState<"bookmarks" | "history">("bookmarks");
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch bookmarks & history
      fetch("http://localhost:3001/api/user/bookmarks")
        .then((r) => r.json())
        .then((data) => setBookmarks(data))
        .catch(console.error);

      fetch("http://localhost:3001/api/user/history")
        .then((r) => r.json())
        .then((data) => setHistory(data))
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentList = tab === "bookmarks" ? bookmarks : history;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-md w-full glass-panel border-l border-apple-border dark:border-apple-darkBorder shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
          <div className="flex items-center p-1 bg-neutral-200/60 dark:bg-neutral-800/80 rounded-full border border-black/5 dark:border-white/5">
            <button
              onClick={() => setTab("bookmarks")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                tab === "bookmarks"
                  ? "bg-white dark:bg-apple-darkElevated text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>书签收藏 ({bookmarks.length})</span>
            </button>
            <button
              onClick={() => setTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                tab === "history"
                  ? "bg-white dark:bg-apple-darkElevated text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>最近阅读 ({history.length})</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {currentList.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 text-sm">
              {tab === "bookmarks" ? "暂无收藏的文档" : "暂无历史浏览记录"}
            </div>
          ) : (
            currentList.map((item) => (
              <button
                key={item.slug}
                onClick={() => {
                  onSelectDoc(item.slug);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder hover:shadow-md transition-all text-left cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-apple-blue transition-colors">
                    {item.title}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">{item.slug}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
