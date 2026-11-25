import React, { useState } from "react";
import {
  Search,
  Bookmark,
  Moon,
  Sun,
  Shield,
  Globe,
  Award,
  Sparkles,
  Smile,
  ChevronDown,
  Layers,
  X,
  Check
} from "lucide-react";

export type PrimaryCategory = "featured" | "en" | "cn" | "joke";

export interface SeriesOption {
  key: string;
  label: string;
  range: string;
  count: string;
}

export const EN_SERIES_OPTIONS: SeriesOption[] = [
  { key: "series-1", label: "Series I", range: "001~999", count: "998篇" },
  { key: "series-2", label: "Series II", range: "1000~1999", count: "999篇" },
  { key: "series-3", label: "Series III", range: "2000~2999", count: "1000篇" },
  { key: "series-4", label: "Series IV", range: "3000~3999", count: "1000篇" },
  { key: "series-5", label: "Series V", range: "4000~4999", count: "1000篇" },
  { key: "series-6", label: "Series VI", range: "5000~5999", count: "1000篇" },
  { key: "series-7", label: "Series VII", range: "6000~6999", count: "998篇" },
  { key: "series-8", label: "Series VIII", range: "7000~7999", count: "1000篇" },
  { key: "series-9", label: "Series IX", range: "8000~8999", count: "1003篇" }
];

export const CN_SERIES_OPTIONS: SeriesOption[] = [
  { key: "cn-series-1", label: "CN 系列 I", range: "001~999", count: "999篇" },
  { key: "cn-series-2", label: "CN 系列 II", range: "1000~1999", count: "1000篇" },
  { key: "cn-series-3", label: "CN 系列 III", range: "2000~2999", count: "998篇" }
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
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

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

  // Get current active series label for mobile trigger button
  const getCurrentLabel = () => {
    if (currentSeries === "featured") return "精选经典";
    if (currentSeries === "joke") return "搞笑特辑";
    const found = [...EN_SERIES_OPTIONS, ...CN_SERIES_OPTIONS].find(o => o.key === currentSeries);
    return found ? `${found.label} (${found.range})` : currentSeries;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-apple-border dark:border-apple-darkBorder transition-all duration-300">
        {/* Main Bar */}
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand */}
          <button onClick={onGoHome} className="flex items-center gap-2 group cursor-pointer text-left shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 flex items-center justify-center text-apple-blue group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm sm:text-base tracking-tight">SCP 阅读器</span>
                <span className="text-[9px] font-semibold px-1 py-0.2 rounded-full bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20">
                  12k+
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-neutral-500 dark:text-neutral-400">控制 · 收容 · 保护</p>
            </div>
          </button>

          {/* Desktop Apple Segmented Primary Tabs (Hidden on mobile) */}
          <div className="hidden lg:flex items-center p-1 bg-neutral-200/60 dark:bg-neutral-800/80 rounded-full border border-black/5 dark:border-white/5">
            <button
              onClick={() => handleSelectPrimary("featured")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activePrimary === "joke"
                  ? "bg-white dark:bg-apple-darkElevated text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-emerald-500" />
              <span>搞笑 -J</span>
            </button>
          </div>

          {/* Mobile Series Trigger Pill Button (Shown on mobile & tablets) */}
          <button
            onClick={() => setIsMobileSheetOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue font-medium text-xs border border-apple-blue/20 hover:bg-apple-blue/15 transition-all cursor-pointer max-w-[150px] truncate"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{getCurrentLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={onOpenSearch}
              aria-label="快速查找文档"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 text-neutral-600 dark:text-neutral-300 text-xs font-medium border border-black/5 dark:border-white/5 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">查找 (001~8999)</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-neutral-500 dark:text-neutral-300">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={onOpenBookmarks}
              aria-label="查看书签"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleDark}
              aria-label="切换明暗模式"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Category Pills (Always available on mobile for 1-swipe switching) */}
        <div className="lg:hidden border-t border-black/5 dark:border-white/5 bg-white/40 dark:bg-neutral-900/40 px-3 py-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <button
              onClick={() => handleSelectPrimary("featured")}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activePrimary === "featured"
                  ? "bg-apple-blue text-white shadow-sm"
                  : "bg-neutral-200/50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <Award className="w-3 h-3 text-amber-400" />
              <span>精选</span>
            </button>

            <button
              onClick={() => handleSelectPrimary("en")}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activePrimary === "en"
                  ? "bg-apple-blue text-white shadow-sm"
                  : "bg-neutral-200/50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <Globe className="w-3 h-3 text-blue-400" />
              <span>主站 (001~8999)</span>
            </button>

            <button
              onClick={() => handleSelectPrimary("cn")}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activePrimary === "cn"
                  ? "bg-apple-blue text-white shadow-sm"
                  : "bg-neutral-200/50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>CN 原创 (001~2999)</span>
            </button>

            <button
              onClick={() => handleSelectPrimary("joke")}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activePrimary === "joke"
                  ? "bg-apple-blue text-white shadow-sm"
                  : "bg-neutral-200/50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <Smile className="w-3 h-3 text-emerald-400" />
              <span>搞笑 -J</span>
            </button>
          </div>
        </div>

        {/* Level 2: Sub-series Secondary Bar (Smooth horizontal scrolling for Series 1 ~ 9 & CN 1 ~ 3) */}
        {currentSubOptions.length > 0 && (
          <div className="border-t border-black/5 dark:border-white/5 bg-neutral-100/50 dark:bg-neutral-900/50 px-3 sm:px-6 py-2 overflow-x-auto no-scrollbar">
            <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1 sm:mr-2 shrink-0">
                千位系列：
              </span>
              {currentSubOptions.map((opt) => {
                const active = currentSeries === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => onSelectSeries(opt.key)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      active
                        ? "bg-apple-blue text-white shadow-sm scale-100"
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

      {/* iOS-Style Mobile Bottom Sheet Drawer for All Series Selection */}
      {isMobileSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileSheetOpen(false)}
          />

          {/* Sheet Modal */}
          <div className="relative w-full max-h-[85vh] glass-panel rounded-t-3xl shadow-2xl border-t border-apple-border dark:border-apple-darkBorder flex flex-col z-10 overflow-hidden transform animate-slideUp">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mt-3" />

            {/* Header */}
            <div className="px-5 py-3 border-b border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  选择收容档案系列
                </h3>
                <p className="text-xs text-neutral-400">已完整索引 12,400+ 篇官方收容名录</p>
              </div>
              <button
                onClick={() => setIsMobileSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-neutral-700 flex items-center justify-center text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Series Options Grid/List in Drawer */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Group 1: 特辑 */}
              <div>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                  精选与特辑
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onSelectSeries("featured");
                      setIsMobileSheetOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      currentSeries === "featured"
                        ? "bg-apple-blue/10 border-apple-blue text-apple-blue font-semibold"
                        : "bg-white/70 dark:bg-neutral-800/70 border-apple-border dark:border-apple-darkBorder text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="text-sm">精选经典</div>
                        <div className="text-[10px] text-neutral-400">里程碑档案</div>
                      </div>
                    </div>
                    {currentSeries === "featured" && <Check className="w-4 h-4 text-apple-blue" />}
                  </button>

                  <button
                    onClick={() => {
                      onSelectSeries("joke");
                      setIsMobileSheetOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      currentSeries === "joke"
                        ? "bg-apple-blue/10 border-apple-blue text-apple-blue font-semibold"
                        : "bg-white/70 dark:bg-neutral-800/70 border-apple-border dark:border-apple-darkBorder text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-emerald-500" />
                      <div>
                        <div className="text-sm">搞笑特辑 -J</div>
                        <div className="text-[10px] text-neutral-400">403 篇</div>
                      </div>
                    </div>
                    {currentSeries === "joke" && <Check className="w-4 h-4 text-apple-blue" />}
                  </button>
                </div>
              </div>

              {/* Group 2: 主站 Series I ~ IX */}
              <div>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                  <span>主站系列 (SCP-001 ~ SCP-8999)</span>
                  <span className="text-apple-blue">共 9 大千位系列</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EN_SERIES_OPTIONS.map((opt) => {
                    const active = currentSeries === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          onSelectSeries(opt.key);
                          setIsMobileSheetOpen(false);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          active
                            ? "bg-apple-blue/10 border-apple-blue text-apple-blue font-semibold"
                            : "bg-white/70 dark:bg-neutral-800/70 border-apple-border dark:border-apple-darkBorder text-neutral-800 dark:text-neutral-200"
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">{opt.range}</div>
                        </div>
                        {active && <Check className="w-4 h-4 text-apple-blue shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group 3: CN 原创分部 */}
              <div>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                  <span>CN 原创分部 (SCP-CN-001 ~ SCP-CN-2999)</span>
                  <span className="text-amber-500">共 3 大千位系列</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CN_SERIES_OPTIONS.map((opt) => {
                    const active = currentSeries === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          onSelectSeries(opt.key);
                          setIsMobileSheetOpen(false);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          active
                            ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                            : "bg-white/70 dark:bg-neutral-800/70 border-apple-border dark:border-apple-darkBorder text-neutral-800 dark:text-neutral-200"
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">{opt.range}</div>
                        </div>
                        {active && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
