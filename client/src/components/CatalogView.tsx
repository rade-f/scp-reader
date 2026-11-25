import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight, Search, Filter, RefreshCw } from "lucide-react";
import type { CatalogItem } from "../types";

interface CatalogViewProps {
  seriesKey: string;
  onSelectDoc: (slug: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ seriesKey, onSelectDoc }) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      // 1. Try local server API
      let res = await fetch(`http://localhost:3001/api/catalog/${seriesKey}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        return;
      }

      // 2. Fallback to bundled offline data
      const offlineRes = await fetch(`./offline_data/catalog_${seriesKey}.json`);
      if (offlineRes.ok) {
        const offlineData = await offlineRes.json();
        setItems(offlineData.items || []);
        return;
      }
    } catch (err) {
      console.error("Failed to load catalog", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchQuery("");
    setSelectedRange("all");
    fetchCatalog();
  }, [seriesKey]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`http://localhost:3001/api/catalog/${seriesKey}/sync`, { method: "POST" });
      await fetchCatalog();
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const seriesMeta: Record<string, { title: string; desc: string }> = {
    featured: { title: "精选经典档案", desc: "基金会社区传阅度最高、设定最深远的里程碑式收容文档" },
    "series-1": { title: "主站 Series I · 001 - 999", desc: "基金会宇宙基石系列，纯正的冷战绝密档案质感，已全量同步收录" },
    "series-2": { title: "主站 Series II · 1000 - 1999", desc: "宇宙观大幅扩张，经典人形与交互收容物爆发期，已全量同步收录" },
    "series-3": { title: "主站 Series III · 2000 - 2999", desc: "跨项目关联与叙事深度探索期，包含多部知名长篇，已全量同步收录" },
    "series-4": { title: "主站 Series IV · 3000 - 3999", desc: "历史谜题、哲学思辨与复杂模因叙事，已全量同步收录" },
    "series-5": { title: "主站 Series V · 4000 - 4999", desc: "奇幻色彩与多重收容分支探索，已全量同步收录" },
    "series-6": { title: "主站 Series VI · 5000 - 5999", desc: "为什么？绝望与末日困境的终极拷问，已全量同步收录" },
    "series-7": { title: "主站 Series VII · 6000 - 6999", desc: "运用现代黑标排版、深度叙事与多重媒介的超自然记录，已全量同步收录" },
    "series-8": { title: "主站 Series VIII · 7000 - 7999", desc: "探寻深渊与高维宇宙的宏大记录，已全量同步收录" },
    "series-9": { title: "主站 Series IX · 8000 - 8999", desc: "基金会最新发布的前沿收容档案，已全量同步收录" },
    "cn-series-1": { title: "CN 原创分部 · 001 - 999", desc: "中华分部早期经典独立创作收容物，已全量同步收录" },
    "cn-series-2": { title: "CN 原创分部 · 1000 - 1999", desc: "大型世界观协同创作与宏大叙事系列，已全量同步收录" },
    "cn-series-3": { title: "CN 原创分部 · 2000 - 2999", desc: "中华分部成熟期超现实与本土化深邃档案，已全量同步收录" },
    joke: { title: "搞笑特辑 · SCP-J", desc: "脑洞大开的研究员恶作剧与官方幽默收容报告，已全量同步收录" }
  };

  const currentMeta = seriesMeta[seriesKey] || { title: "收容档案目录", desc: "基金会分级收容文件" };

  // Calculate dynamic range buckets (e.g. 0-99, 100-199...)
  const rangeBuckets = useMemo(() => {
    if (items.length <= 30) return [];
    const buckets: Array<{ id: string; label: string; min: number; max: number }> = [];

    // Find min and max numbers in this series
    let minNum = Infinity;
    let maxNum = -Infinity;
    for (const item of items) {
      const match = item.slug.match(/(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val < minNum) minNum = val;
        if (val > maxNum) maxNum = val;
      }
    }

    if (minNum === Infinity) return [];

    const startCentury = Math.floor(minNum / 100) * 100;
    const endCentury = Math.floor(maxNum / 100) * 100;

    for (let c = startCentury; c <= endCentury; c += 100) {
      const min = c;
      const max = c + 99;
      buckets.push({
        id: `${min}-${max}`,
        label: `${String(min).padStart(3, "0")}~${String(max).padStart(3, "0")}`,
        min,
        max
      });
    }

    return buckets;
  }, [items]);

  // Filtered items based on search and range
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply Range Filter
    if (selectedRange !== "all" && rangeBuckets.length > 0) {
      const bucket = rangeBuckets.find((b) => b.id === selectedRange);
      if (bucket) {
        result = result.filter((item) => {
          const match = item.slug.match(/(\d+)/);
          if (!match) return false;
          const val = parseInt(match[1], 10);
          return val >= bucket.min && val <= bucket.max;
        });
      }
    }

    // Apply Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) => item.slug.toLowerCase().includes(q) || item.title.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, selectedRange, rangeBuckets, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-3 animate-pulse" />
        <div className="h-4 w-72 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      {/* Header Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {currentMeta.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20">
              {items.length} 篇收录
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{currentMeta.desc}</p>
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-200/60 dark:bg-neutral-800/80 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "正在同步最新索引..." : "重新同步官网索引"}</span>
        </button>
      </div>

      {/* Apple Controls Bar: Filter input + Sub-range segments */}
      <div className="glass-panel rounded-2xl p-3 mb-6 space-y-3 border border-apple-border dark:border-apple-darkBorder">
        {/* In-catalog Quick Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-black/5 dark:border-white/5">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={`在当前 ${items.length} 篇档案中快速筛选编号或名称...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              清空
            </button>
          )}
        </div>

        {/* Range Segment Pills (Scrollable if many) */}
        {rangeBuckets.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" />
              分段：
            </span>

            <button
              onClick={() => setSelectedRange("all")}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                selectedRange === "all"
                  ? "bg-apple-blue text-white shadow-sm"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
            >
              全部 ({items.length})
            </button>

            {rangeBuckets.map((bucket) => {
              const active = selectedRange === bucket.id;
              return (
                <button
                  key={bucket.id}
                  onClick={() => setSelectedRange(bucket.id)}
                  className={`px-2.5 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                    active
                      ? "bg-apple-blue text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
                  }`}
                >
                  {bucket.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Cards */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center text-neutral-400 text-sm">
          未检索到符合条件的文档，请尝试其他关键词
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isCN = item.slug.includes("-cn-");
            return (
              <button
                key={item.slug}
                onClick={() => onSelectDoc(item.slug)}
                className="p-5 rounded-2xl bg-white dark:bg-apple-darkCard border border-apple-border dark:border-apple-darkBorder hover:shadow-apple-hover hover:-translate-y-0.5 transition-all duration-200 text-left flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold tracking-wider text-apple-blue uppercase">
                      {item.slug.toUpperCase()}
                    </span>
                    {isCN ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        CN
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        EN
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 line-clamp-2 group-hover:text-apple-blue transition-colors leading-snug">
                    {item.title}
                  </div>
                </div>

                <div className="flex items-center justify-end mt-4 text-xs font-medium text-neutral-400 group-hover:text-apple-blue transition-colors">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">阅读档案</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
