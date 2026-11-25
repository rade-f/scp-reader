import { useState, useEffect } from "react";
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

  // Sync dark class to <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("scp_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("scp_theme", "light");
    }
  }, [isDark]);

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
      <main className="flex-1">
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
