import React from "react";
import { Search, Bookmark, Moon, Sun, Shield, Globe, Award, Sparkles, Smile } from "lucide-react";

export type PrimaryCategory = "featured" | "en" | "cn" | "joke";

export interface SeriesOption {
  key: string;
  label: string;
  range: string;
}

export const EN_SERIES_OPTIONS: SeriesOption[] = [
  { key: "series-1", label: "Series I", range: "001~999" },
  { key: "series-2", label: "Series II", range: "1000~1999" },
  { key: "series-3", label: "Series III", range: "2000~2999" },
  { key: "series-4", label: "Series IV", range: "3000~3999" },
  { key: "series-5", label: "Series V", range: "4000~4999" },
  { key: "series-6", label: "Series VI", range: "5000~5999" },
  { key: "series-7", label: "Series VII", range: "6000~6999" },
  { key: "series-8", label: "Series VIII", range: "7000~7999" },
  { key: "series-9", label: "Series IX", range: "8000~8999" }
];

export const CN_SERIES_OPTIONS: SeriesOption[] = [
  { key: "cn-series-1", label: "CN 系列 I", range: "001~999" },
  { key: "cn-series-2", label: "CN 系列 II", range: "1000~1999" },
  { key: "cn-series-3", label: "CN 系列 III", range: "2000~2999" }
];

interface NavbarProps {
  currentSeries: string;
  onSelectSeries: (key: string) => void;
  onOpenSearch: () => void;
  onOpenBookmarks: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSeries,
  onSelectSeries,
  onOpenSearch,
  onOpenBookmarks,
  isDark,
  onToggleDark,
  onGoHome
}) => {
  // Infer primary category from currentSeries
  const activePrimary: PrimaryCategory = currentSeries === "featured"
    ? "featured"
    : currentSeries === "joke"
    ? "joke"
    : currentSeries.startsWith("cn-")
    ? "cn"
    : "en";

  const handleSelectPrimary = (cat: PrimaryCategory) => {
    if (cat === "featured") onSelectSeries("featured");
    else if (cat === "joke") onSelectSeries("joke");
    else if (cat === "en") onSelectSeries("series-1");
    else if (cat === "cn") onSelectSeries("cn-series-1");
  };

  const currentSubOptions = activePrimary === "en" ? EN_SERIES_OPTIONS : activePrimary === "cn" ? CN_SERIES_OPTIONS : [];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-apple-border dark:border-apple-darkBorder transition-all duration-300">
      {/* Level 1: Primary Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button onClick={onGoHome} className="flex items-center gap-2.5 group cursor-pointer text-left shrink-0">
          <div className="w-9 h-9 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 flex items-center justify-center text-apple-blue group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight">SCP 档案阅读器</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20">
                12,000+
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">控制 · 收容 · 保护</p>
          </div>
        </button>

        {/* Apple Segmented Primary Tabs */}
        <div className="hidden md:flex items-center p-1 bg-neutral-200/60 dark:bg-neutral-800/80 rounded-full border border-black/5 dark:border-white/5">
          <button
            onClick={() => handleSelectPrimary("featured")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activePrimary === "featured"
                ? "bg-white dark:bg-apple-darkElevated text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>精选</span>
          </button>

          <button
            onClick={() => handleSelectPrimary("en")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activePrimary === "en"
                ? "bg-white dark:bg-apple-darkElevated text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>主站 (001~8999)</span>
          </button>

          <button
            onClick={() => handleSelectPrimary("cn")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activePrimary === "cn"
                ? "bg-white dark:bg-apple-darkElevated text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>CN 中文原创 (001~2999)</span>
          </button>

          <button
            onClick={() => handleSelectPrimary("joke")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activePrimary === "joke"
                ? "bg-white dark:bg-apple-darkElevated text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-emerald-500" />
            <span>搞笑 -J</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 text-neutral-600 dark:text-neutral-300 text-xs font-medium border border-black/5 dark:border-white/5 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">快速查找 (001~8999)</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-neutral-500 dark:text-neutral-300">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={onOpenBookmarks}
            aria-label="查看书签"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDark}
            aria-label="切换明暗模式"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Level 2: Sub-series Secondary Bar (Smooth horizontal scrolling for Series 1 ~ 9 & CN 1 ~ 3) */}
      {currentSubOptions.length > 0 && (
        <div className="border-t border-black/5 dark:border-white/5 bg-neutral-100/40 dark:bg-neutral-900/40 px-4 sm:px-6 py-2 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-2 shrink-0">
              千位系列：
            </span>
            {currentSubOptions.map((opt) => {
              const active = currentSeries === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onSelectSeries(opt.key)}
                  className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-apple-blue text-white shadow-sm"
                      : "bg-white/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-700 border border-black/5 dark:border-white/5"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`text-[10px] ${active ? "text-white/80" : "text-neutral-400"}`}>
                    ({opt.range})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
