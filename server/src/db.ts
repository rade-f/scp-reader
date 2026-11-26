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

export interface ScpRelationItem {
    slug: string;
    title: string;
    mention_count: number;
    snippet: string;
}

export interface DocumentRelations {
    references: ScpRelationItem[];    // 本文提及的项目 (Outgoing)
    referenced_by: ScpRelationItem[]; // 被提及于 / 交叉实验与收容记录 (Incoming)
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

            CREATE TABLE IF NOT EXISTS scp_relations (
                source_slug TEXT NOT NULL,
                target_slug TEXT NOT NULL,
                mention_count INTEGER NOT NULL DEFAULT 1,
                context_snippet TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (source_slug, target_slug)
            );

            CREATE INDEX IF NOT EXISTS idx_catalog_series ON catalog_items(series_key, item_order);
            CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_type);
            CREATE INDEX IF NOT EXISTS idx_history_time ON user_history(last_read_at DESC);
            CREATE INDEX IF NOT EXISTS idx_relations_source ON scp_relations(source_slug);
            CREATE INDEX IF NOT EXISTS idx_relations_target ON scp_relations(target_slug);
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

        // Automatically maintain cross-document relation graph
        try {
            this.extractAndSaveRelations(article.slug, article.html_content);
        } catch (e) {
            console.warn(`[DB] Relation extraction failed for ${article.slug}:`, e);
        }
    }

    public extractAndSaveRelations(slug: string, htmlContent: string): void {
        const cleanSlug = slug.toLowerCase().trim();
        // Remove footer pagination, licenses, scripts and style tags to avoid false relations
        const strippedHtml = htmlContent
            .replace(/<div class=['"]footer-wikiwalk-nav['"][\s\S]*?<\/div>/gi, ' ')
            .replace(/<div class=['"]licensebox['"][\s\S]*?<\/div>/gi, ' ')
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ');

        const cleanText = strippedHtml.replace(/<[^>]+>/g, ' ');
        const regex = /\bSCP-(?:CN-)?(?:\d+|[A-Z0-9]+(?:-J|-EX|-ARC)?)\b/gi;

        const counts = new Map<string, number>();
        const snippets = new Map<string, string>();

        let match: RegExpExecArray | null;
        while ((match = regex.exec(cleanText)) !== null) {
            const rawTarget = match[0];
            const targetSlug = rawTarget.toLowerCase();
            if (targetSlug === cleanSlug) continue;

            counts.set(targetSlug, (counts.get(targetSlug) || 0) + 1);

            if (!snippets.has(targetSlug)) {
                const idx = match.index;
                const start = Math.max(0, idx - 35);
                const end = Math.min(cleanText.length, idx + match[0].length + 45);
                let snippet = cleanText.substring(start, end).replace(/\s+/g, ' ').trim();
                if (start > 0) snippet = '...' + snippet;
                if (end < cleanText.length) snippet = snippet + '...';
                snippets.set(targetSlug, snippet);
            }
        }

        // Delete existing outgoing relations for this document
        this.db.prepare("DELETE FROM scp_relations WHERE source_slug = ?").run(cleanSlug);

        // Filter valid targets against catalog_items so only actual SCP docs are preserved
        const checkCatalog = this.db.prepare("SELECT title FROM catalog_items WHERE slug = ? LIMIT 1");
        const insertStmt = this.db.prepare(`
            INSERT OR REPLACE INTO scp_relations (source_slug, target_slug, mention_count, context_snippet, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        const insertMany = this.db.transaction((entries: Array<[string, number, string]>) => {
            for (const [targetSlug, count, snippet] of entries) {
                insertStmt.run(cleanSlug, targetSlug, count, snippet);
            }
        });

        const validEntries: Array<[string, number, string]> = [];
        for (const [targetSlug, count] of counts.entries()) {
            const inCatalog = checkCatalog.get(targetSlug);
            if (inCatalog) {
                validEntries.push([targetSlug, count, snippets.get(targetSlug) || ""]);
            }
        }

        if (validEntries.length > 0) {
            insertMany(validEntries);
        }
    }

    public getDocumentRelations(slug: string): DocumentRelations {
        const cleanSlug = slug.toLowerCase().trim();

        // 1. Outgoing references (本文提及的项目)
        const refRows = this.db.prepare(`
            SELECT r.target_slug as slug, COALESCE(c.title, UPPER(r.target_slug)) as title, r.mention_count, r.context_snippet as snippet
            FROM scp_relations r
            LEFT JOIN (SELECT slug, title FROM catalog_items GROUP BY slug) c ON r.target_slug = c.slug
            WHERE r.source_slug = ?
            ORDER BY r.mention_count DESC, r.target_slug ASC
        `).all(cleanSlug) as Array<{ slug: string; title: string; mention_count: number; snippet: string }>;

        // 2. Incoming referenced_by (被提及于 / 交叉实验与收容记录)
        const byRows = this.db.prepare(`
            SELECT r.source_slug as slug, COALESCE(c.title, UPPER(r.source_slug)) as title, r.mention_count, r.context_snippet as snippet
            FROM scp_relations r
            LEFT JOIN (SELECT slug, title FROM catalog_items GROUP BY slug) c ON r.source_slug = c.slug
            WHERE r.target_slug = ?
            ORDER BY r.mention_count DESC, r.source_slug ASC
        `).all(cleanSlug) as Array<{ slug: string; title: string; mention_count: number; snippet: string }>;

        return {
            references: refRows.map(r => ({
                slug: r.slug,
                title: r.title,
                mention_count: r.mention_count,
                snippet: r.snippet
            })),
            referenced_by: byRows.map(r => ({
                slug: r.slug,
                title: r.title,
                mention_count: r.mention_count,
                snippet: r.snippet
            }))
        };
    }

    public buildAllRelations(): number {
        const articles = this.db.prepare("SELECT slug, html_content FROM articles").all() as Array<{ slug: string; html_content: string }>;
        let indexed = 0;
        for (const a of articles) {
            this.extractAndSaveRelations(a.slug, a.html_content);
            indexed++;
        }
        const count = this.db.prepare("SELECT count(*) as c FROM scp_relations").get() as { c: number };
        console.log(`[DB] Relation graph built: indexed ${indexed} articles, found ${count.c} cross-references.`);
        return count.c;
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
    public get database(): Database.Database {
        return this.db;
    }
}

export const db = new DB();
