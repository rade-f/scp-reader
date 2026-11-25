import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Sparkles,
  Shield,
  Star,
  ExternalLink
} from "lucide-react";
import type { Article } from "../types";

interface ReaderViewProps {
  slug: string;
  onBack: () => void;
  onSelectDoc?: (slug: string) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ slug, onBack }) => {
  const [doc, setDoc] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(800);
  const [readerTheme, setReaderTheme] = useState<"light" | "sepia" | "dark" | "oled">("light");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch document
  const fetchDoc = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      let data: Article | null = null;

      // 1. Try local server API
      if (!forceRefresh) {
        try {
          const resp = await fetch(`http://localhost:3001/api/documents/${slug}`);
          if (resp.ok) {
            data = await resp.json();
          }
        } catch {
          // Server offline, fall through to offline bundle
        }
      }

      // 2. Fallback to bundled offline articles
      if (!data) {
        try {
          const offlineRes = await fetch("./offline_data/articles.json");
          if (offlineRes.ok) {
            const articleMap = await offlineRes.json();
            if (articleMap[slug]) {
              data = articleMap[slug];
            }
          }
        } catch {
          // Offline fetch error
        }
      }

      if (!data) {
        throw new Error("档案未缓存且未连接到后端服务，请联网或搜索其他收录文档");
      }

      setDoc(data);

      // Check bookmark status from localStorage as fallback
      try {
        const bResp = await fetch("http://localhost:3001/api/user/bookmarks");
        if (bResp.ok) {
          const bookmarks = await bResp.json();
          setIsBookmarked(bookmarks.some((b: any) => b.slug === slug));
        }
      } catch {
        const localBookmarks = JSON.parse(localStorage.getItem("scp_local_bookmarks") || "[]");
        setIsBookmarked(localBookmarks.includes(slug));
      }
    } catch (err: any) {
      setError(err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  // Listen to iframe auto-resize message
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "SCP_RESIZE" && typeof e.data.height === "number") {
        const rawHeight = Math.ceil(e.data.height);
        setIframeHeight((prev) => {
          // If within 6px difference, do not update to avoid feedback jitter
          if (Math.abs(prev - rawHeight) < 6) return prev;
          return Math.max(rawHeight + 16, 400);
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Toggle Bookmark
  const toggleBookmark = async () => {
    if (!doc) return;
    const action = isBookmarked ? "remove" : "add";
    try {
      await fetch("http://localhost:3001/api/user/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: doc.slug,
          title: doc.title,
          source_type: doc.source_type,
          action
        })
      });
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error("Bookmark toggle failed", err);
    }
  };

  // Helper for Object Class badge color
  const getClassBadge = (objClass: string | null) => {
    if (!objClass) return null;
    const c = objClass.toLowerCase();
    if (c.includes("safe")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (c.includes("euclid")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (c.includes("keter")) return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    if (c.includes("thaumiel")) return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
    if (c.includes("apollyon")) return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    return "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/20";
  };

  // Generate standalone HTML in memory for offline srcDoc embedding
  const standaloneHtml = useMemo(() => {
    if (!doc) return "";
    const stylesCombined = (doc.styles || []).join("\n");
    const isDark = readerTheme === "dark" || readerTheme === "oled";
    const defaultColor = isDark ? "#f5f5f7" : "#1d1d1f";

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title}</title>
    ${stylesCombined}
    <style>
      html, body {
          height: auto !important;
          min-height: 0 !important;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
          color: ${defaultColor};
          background-color: transparent;
          line-height: 1.6;
          overflow-y: hidden;
      }
      #page-content { padding: 8px 0; overflow-x: hidden; height: auto !important; }
      img { max-width: 100% !important; height: auto !important; }
      .collapsible-block-unfolded { transition: all 0.2s ease-in-out; }
    </style>
</head>
<body>
    <div id="page-content">
        ${doc.html_content}
    </div>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var pageContent = document.getElementById('page-content');
        var lastSentHeight = 0;

        function reportHeight() {
            if (!pageContent) return;
            var h = Math.ceil(pageContent.getBoundingClientRect().height || pageContent.scrollHeight);
            if (h > 0 && Math.abs(h - lastSentHeight) > 4) {
                lastSentHeight = h;
                window.parent.postMessage({ type: 'SCP_RESIZE', height: h }, '*');
            }
        }

        document.querySelectorAll('.collapsible-block').forEach(function(block) {
            var folded = block.querySelector('.collapsible-block-folded');
            var unfolded = block.querySelector('.collapsible-block-unfolded');
            var foldLinks = block.querySelectorAll('.collapsible-block-link');
            foldLinks.forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (folded.style.display === 'none') {
                        folded.style.display = 'block';
                        unfolded.style.display = 'none';
                    } else {
                        folded.style.display = 'none';
                        unfolded.style.display = 'block';
                    }
                    setTimeout(reportHeight, 50);
                });
            });
        });

        if (window.ResizeObserver && pageContent) {
            var ro = new ResizeObserver(function() {
                reportHeight();
            });
            ro.observe(pageContent);
        }

        window.addEventListener('load', reportHeight);
        setTimeout(reportHeight, 200);
        setTimeout(reportHeight, 800);
    });
    </script>
</body>
</html>`;
  }, [doc, readerTheme]);

  // Background style based on readerTheme
  const themeContainerBg = {
    light: "bg-white dark:bg-apple-darkCard",
    sepia: "bg-[#fbf0d9] text-[#5f4b32] dark:bg-[#2b251f] dark:text-[#d7c4b7]",
    dark: "bg-[#1c1c1e] text-[#f5f5f7]",
    oled: "bg-black text-[#e5e5e7]"
  }[readerTheme];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
        <div className="h-12 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        <div className="h-96 w-full bg-neutral-200 dark:bg-neutral-800 rounded-3xl" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xl">
          !
        </div>
        <h2 className="text-xl font-semibold">无法调取档案</h2>
        <p className="text-sm text-neutral-500">{error || "该项目编号在中文分部及主站均未检索到有效记录。"}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-sm font-medium hover:bg-neutral-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回目录</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 animate-fadeIn">
      {/* Top Breadcrumb & Metadata Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-4 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回目录</span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {doc.title}
            </h1>
            <div className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">{doc.slug}</div>
          </div>

          <div className="flex items-center gap-2">
            {/* Source Type Badge */}
            {doc.source_type === "cn_original" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                CN 中文原创
              </span>
            )}
            {doc.source_type === "cn_translated" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Shield className="w-3.5 h-3.5" />
                官方人工精校
              </span>
            )}
            {doc.source_type === "en_ai_translated" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini 3 Flash 译制
              </span>
            )}

            {/* Object Class Badge */}
            {doc.object_class && (
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getClassBadge(
                  doc.object_class
                )}`}
              >
                {doc.object_class}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Reader Canvas (Isolated Sandboxed Frame) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div
          className={`rounded-3xl border border-apple-border dark:border-apple-darkBorder shadow-apple transition-colors duration-300 p-4 sm:p-8 min-h-[70vh] ${themeContainerBg}`}
        >
          <iframe
            ref={iframeRef}
            srcDoc={standaloneHtml}
            title={doc.title}
            className="w-full border-none transition-all duration-300"
            style={{
              height: `${iframeHeight}px`,
              filter: readerTheme === "oled" || readerTheme === "dark" ? "none" : undefined
            }}
          />
        </div>
      </div>

      {/* Apple Floating Dynamic Capsule Toolbar (Bottom Floating) */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 px-4 pointer-events-none">
        <div className="glass-pill rounded-full border border-black/10 dark:border-white/15 px-3 py-2 flex items-center gap-1 sm:gap-2 pointer-events-auto shadow-2xl transition-all duration-200">
          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            title={isBookmarked ? "已收藏" : "加入书签"}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isBookmarked
                ? "bg-amber-500 text-white"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          <div className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

          {/* Theme Palette Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setReaderTheme("light")}
              title="明亮模式"
              className={`w-6 h-6 rounded-full border border-neutral-300 bg-white transition-transform ${
                readerTheme === "light" ? "scale-110 ring-2 ring-apple-blue" : "hover:scale-105"
              }`}
            />
            <button
              onClick={() => setReaderTheme("sepia")}
              title="羊皮纸模式"
              className={`w-6 h-6 rounded-full border border-neutral-400 bg-[#fbf0d9] transition-transform ${
                readerTheme === "sepia" ? "scale-110 ring-2 ring-amber-500" : "hover:scale-105"
              }`}
            />
            <button
              onClick={() => setReaderTheme("dark")}
              title="夜间深灰"
              className={`w-6 h-6 rounded-full border border-neutral-600 bg-[#1c1c1e] transition-transform ${
                readerTheme === "dark" ? "scale-110 ring-2 ring-apple-blue" : "hover:scale-105"
              }`}
            />
            <button
              onClick={() => setReaderTheme("oled")}
              title="极致纯黑"
              className={`w-6 h-6 rounded-full border border-neutral-700 bg-black transition-transform ${
                readerTheme === "oled" ? "scale-110 ring-2 ring-apple-blue" : "hover:scale-105"
              }`}
            />
          </div>

          <div className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

          {/* Force Refresh / Re-translate */}
          <button
            onClick={() => fetchDoc(true)}
            title="强制刷新并重新抓取/翻译"
            className="p-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* External Wiki Source Link */}
          <a
            href={
              doc.source_type === "en_ai_translated"
                ? `https://scp-wiki.wikidot.com/${doc.slug}`
                : `https://scp-wiki-cn.wikidot.com/${doc.slug}`
            }
            target="_blank"
            rel="noreferrer"
            title="在官方 Wikidot 官网中打开"
            className="p-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
