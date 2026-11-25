import Database from "better-sqlite3";
import { CONFIG } from "./config";

export interface ArticleRecord {
    slug: string;
    title: string;
    series: string | null;
    object_class: string | null;
    source_type: "cn_translated" | "cn_original" | "en_ai_translated";
    html_content: string;
    styles_json: string; // JSON array of <style> or <link> tags
    tags_json: string;   // JSON array of string tags
    raw_en_content: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface UserBookmark {
    slug: string;
    title: string;
    source_type?: string;
    created_at?: string;
}

export interface UserHistory {
    slug: string;
    title: string;
    source_type?: string;
    last_read_at?: string;
}

class DB {
    private db: Database.Database;

    constructor() {
        this.db = new Database(CONFIG.DB_PATH);
        this.initSchema();
    }

    private initSchema() {
        this.db.pragma("journal_mode = WAL");
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS articles (
                slug TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                series TEXT,
                object_class TEXT,
                source_type TEXT NOT NULL,
                html_content TEXT NOT NULL,
                styles_json TEXT NOT NULL,
                tags_json TEXT,
                raw_en_content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_bookmarks (
                slug TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                source_type TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_history (
                slug TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                source_type TEXT,
                last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS catalog_items (
                series_key TEXT NOT NULL,
                slug TEXT NOT NULL,
                title TEXT NOT NULL,
                item_order INTEGER NOT NULL,
                PRIMARY KEY (series_key, slug)
            );

            CREATE INDEX IF NOT EXISTS idx_catalog_series ON catalog_items(series_key, item_order);
            CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_type);
            CREATE INDEX IF NOT EXISTS idx_history_time ON user_history(last_read_at DESC);
        `);
    }

    public getArticle(slug: string): ArticleRecord | undefined {
        const stmt = this.db.prepare("SELECT * FROM articles WHERE slug = ?");
        return stmt.get(slug.toLowerCase()) as ArticleRecord | undefined;
    }

    public saveArticle(article: ArticleRecord): void {
        const stmt = this.db.prepare(`
            INSERT INTO articles (slug, title, series, object_class, source_type, html_content, styles_json, tags_json, raw_en_content, updated_at)
            VALUES (@slug, @title, @series, @object_class, @source_type, @html_content, @styles_json, @tags_json, @raw_en_content, CURRENT_TIMESTAMP)
            ON CONFLICT(slug) DO UPDATE SET
                title = excluded.title,
                series = excluded.series,
                object_class = excluded.object_class,
                source_type = excluded.source_type,
                html_content = excluded.html_content,
                styles_json = excluded.styles_json,
                tags_json = excluded.tags_json,
                raw_en_content = excluded.raw_en_content,
                updated_at = CURRENT_TIMESTAMP
        `);
        stmt.run({
            ...article,
            slug: article.slug.toLowerCase()
        });
    }

    public searchArticles(query: string, limit = 20): Array<{ slug: string; title: string; source_type: string; object_class: string | null }> {
        const q = `%${query.toLowerCase()}%`;
        const stmt = this.db.prepare(`
            SELECT slug, title, source_type, object_class
            FROM articles
            WHERE slug LIKE ? OR title LIKE ? OR tags_json LIKE ?
            ORDER BY updated_at DESC
            LIMIT ?
        `);
        return stmt.all(q, q, q, limit) as any;
    }

    public addBookmark(slug: string, title: string, source_type?: string) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO user_bookmarks (slug, title, source_type, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(slug, title, source_type || "");
    }

    public removeBookmark(slug: string) {
        this.db.prepare("DELETE FROM user_bookmarks WHERE slug = ?").run(slug);
    }

    public getBookmarks(): UserBookmark[] {
        return this.db.prepare("SELECT * FROM user_bookmarks ORDER BY created_at DESC").all() as UserBookmark[];
    }

    public saveCatalogItems(seriesKey: string, items: Array<{ slug: string; title: string }>) {
        const insert = this.db.prepare(`
            INSERT OR REPLACE INTO catalog_items (series_key, slug, title, item_order)
            VALUES (?, ?, ?, ?)
        `);
        const transaction = this.db.transaction((records: Array<{ slug: string; title: string }>) => {
            for (let i = 0; i < records.length; i++) {
                insert.run(seriesKey, records[i].slug, records[i].title, i + 1);
            }
        });
        transaction(items);
    }

    public getCatalogItems(seriesKey: string, search?: string): Array<{ slug: string; title: string }> {
        if (search && search.trim()) {
            const q = `%${search.trim().toLowerCase()}%`;
            return this.db.prepare(`
                SELECT slug, title FROM catalog_items
                WHERE series_key = ? AND (LOWER(slug) LIKE ? OR LOWER(title) LIKE ?)
                ORDER BY item_order ASC
            `).all(seriesKey, q, q) as Array<{ slug: string; title: string }>;
        }
        return this.db.prepare(`
            SELECT slug, title FROM catalog_items
            WHERE series_key = ?
            ORDER BY item_order ASC
        `).all(seriesKey) as Array<{ slug: string; title: string }>;
    }

    public hasCatalog(seriesKey: string): boolean {
        const res = this.db.prepare("SELECT 1 FROM catalog_items WHERE series_key = ? LIMIT 1").get(seriesKey);
        return !!res;
    }

    public isBookmarked(slug: string): boolean {
        const res = this.db.prepare("SELECT 1 FROM user_bookmarks WHERE slug = ?").get(slug);
        return !!res;
    }

    public addHistory(slug: string, title: string, source_type?: string) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO user_history (slug, title, source_type, last_read_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(slug, title, source_type || "");
    }

    public getHistory(limit = 30): UserHistory[] {
        return this.db.prepare("SELECT * FROM user_history ORDER BY last_read_at DESC LIMIT ?").all(limit) as UserHistory[];
    }
}

export const db = new DB();
