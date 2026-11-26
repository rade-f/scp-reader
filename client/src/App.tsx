import { useState, useEffect } from "react";
import { SystemBars, SystemBarsStyle, Capacitor } from "@capacitor/core";
import { Navbar } from "./components/Navbar";
import { CatalogView } from "./components/CatalogView";
import { ReaderView } from "./components/ReaderView";
import { SearchModal } from "./components/SearchModal";
import { BookmarksDrawer } from "./components/BookmarksDrawer";

export function App() {
  const [currentSeries, setCurrentSeries] = useState("featured");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("scp_theme") === "dark" ||
      (!localStorage.getItem("scp_theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // Sync dark class to <html> and native SystemBars
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("scp_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("scp_theme", "light");
    }

    if (Capacitor.isNativePlatform()) {
      try {
        SystemBars.setStyle({
          style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light
        });
      } catch (err) {
        console.warn("[App] Failed to set native system bars style:", err);
      }
    }
  }, [isDark]);

  // Synchronize native Android/iOS safe-area insets
  useEffect(() => {
    const syncNativeInsets = () => {
      const win = window as any;
      if (win.AndroidSafeArea && typeof win.AndroidSafeArea.getInsets === "function") {
        try {
          const raw = win.AndroidSafeArea.getInsets();
          const insets = JSON.parse(raw);
          if (typeof insets.top === "number" && insets.top > 0) {
            document.documentElement.style.setProperty("--safe-area-inset-top", `${insets.top}px`);
          }
          if (typeof insets.bottom === "number" && insets.bottom > 0) {
            document.documentElement.style.setProperty("--safe-area-inset-bottom", `${insets.bottom}px`);
          }
          if (typeof insets.left === "number" && insets.left > 0) {
            document.documentElement.style.setProperty("--safe-area-inset-left", `${insets.left}px`);
          }
          if (typeof insets.right === "number" && insets.right > 0) {
            document.documentElement.style.setProperty("--safe-area-inset-right", `${insets.right}px`);
          }
        } catch (e) {
          console.warn("[App] Failed to parse AndroidSafeArea insets:", e);
        }
      }
    };

    syncNativeInsets();
    const t1 = setTimeout(syncNativeInsets, 300);
    const t2 = setTimeout(syncNativeInsets, 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Handle URL hash changes (#/read/scp-173)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/read\/([a-zA-Z0-9\-_]+)$/);
      if (match && match[1]) {
        setActiveSlug(match[1]);
      } else {
        setActiveSlug(null);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleSelectDoc = (slug: string) => {
    window.location.hash = `#/read/${slug}`;
  };

  const handleBackToCatalog = () => {
    window.location.hash = "";
    setActiveSlug(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-apple-bg dark:bg-apple-darkBg text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* Apple Frosted Glass Top Navigation */}
      <Navbar
        currentSeries={currentSeries}
        onSelectSeries={(key) => {
          setCurrentSeries(key);
          if (activeSlug) handleBackToCatalog();
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onGoHome={handleBackToCatalog}
      />

      {/* Main View Area */}
      <main className="flex-1" style={{ paddingBottom: "var(--sab)" }}>
        {activeSlug ? (
          <ReaderView
            slug={activeSlug}
            onBack={handleBackToCatalog}
            onSelectDoc={handleSelectDoc}
          />
        ) : (
          <CatalogView
            seriesKey={currentSeries}
            onSelectDoc={handleSelectDoc}
          />
        )}
      </main>

      {/* Spotlight Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectDoc={handleSelectDoc}
      />

      {/* Bookmarks & Reading History Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        onSelectDoc={handleSelectDoc}
      />
    </div>
  );
}

export default App;
