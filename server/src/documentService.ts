import { db, ArticleRecord } from "./db";
import { WikidotScraper } from "./scraper";
import { GeminiTranslator } from "./translator";

export class DocumentService {
    public static async getDocument(slug: string, forceRefresh = false): Promise<ArticleRecord | null> {
        const cleanSlug = slug.toLowerCase().trim();

        // 1. Check local SQLite cache if not forcing refresh
        if (!forceRefresh) {
            const cached = db.getArticle(cleanSlug);
            if (cached) {
                console.log(`[DocumentService] Cache HIT for ${cleanSlug} (${cached.source_type})`);
                db.addHistory(cached.slug, cached.title, cached.source_type);
                return cached;
            }
        }

        console.log(`[DocumentService] Cache MISS for ${cleanSlug}. Fetching from CN Wiki...`);

        // 2. Step 1: Probe CN Wiki (scp-wiki-cn.wikidot.com)
        const cnPage = await WikidotScraper.fetchPage(cleanSlug, "cn");
        if (cnPage) {
            const isOriginalCN = cleanSlug.startsWith("scp-cn-") || cleanSlug.startsWith("cn-");
            const sourceType = isOriginalCN ? "cn_original" : "cn_translated";
            const series = this.inferSeries(cleanSlug);

            const article: ArticleRecord = {
                slug: cleanSlug,
                title: cnPage.title,
                series,
                object_class: cnPage.object_class,
                source_type: sourceType,
                html_content: cnPage.html_content,
                styles_json: JSON.stringify(cnPage.styles),
                tags_json: JSON.stringify(cnPage.tags),
                raw_en_content: null
            };

            db.saveArticle(article);
            db.addHistory(article.slug, article.title, article.source_type);
            console.log(`[DocumentService] Successfully scraped & cached from CN Wiki: ${cleanSlug}`);
            return article;
        }

        // 3. Step 2: Fallback to EN Wiki (scp-wiki.wikidot.com)
        console.log(`[DocumentService] CN Wiki 404 for ${cleanSlug}. Falling back to EN Wiki...`);
        const enPage = await WikidotScraper.fetchPage(cleanSlug, "en");
        if (enPage) {
            console.log(`[DocumentService] EN Wiki found for ${cleanSlug}. Performing AI Translation...`);
            const rawEnHtml = enPage.html_content;
            const translatedHtml = await GeminiTranslator.translateHtml(rawEnHtml);
            const series = this.inferSeries(cleanSlug);

            const article: ArticleRecord = {
                slug: cleanSlug,
                title: enPage.title,
                series,
                object_class: enPage.object_class,
                source_type: "en_ai_translated",
                html_content: translatedHtml,
                styles_json: JSON.stringify(enPage.styles),
                tags_json: JSON.stringify(enPage.tags),
                raw_en_content: rawEnHtml
            };

            db.saveArticle(article);
            db.addHistory(article.slug, article.title, article.source_type);
            console.log(`[DocumentService] Successfully translated & cached EN document: ${cleanSlug}`);
            return article;
        }

        // 4. Not found on either site
        console.warn(`[DocumentService] Document ${cleanSlug} not found on both CN and EN wikis.`);
        return null;
    }

    private static inferSeries(slug: string): string {
        const matchCN = slug.match(/scp-cn-(\d+)/i);
        if (matchCN) {
            const num = parseInt(matchCN[1], 10);
            const seriesIdx = Math.floor(num / 1000) + 1;
            return `cn-series-${seriesIdx}`;
        }

        const matchEN = slug.match(/scp-(\d+)/i);
        if (matchEN) {
            const num = parseInt(matchEN[1], 10);
            const seriesIdx = Math.floor(num / 1000) + 1;
            return `series-${seriesIdx}`;
        }

        if (slug.includes("-j")) return "joke";
        return "other";
    }

    public static async getCatalog(seriesKey: string, search?: string): Promise<Array<{ slug: string; title: string }>> {
        if (seriesKey === "featured") {
            const list = [
                { slug: "scp-173", title: "SCP-173 - 雕像 - 最初之作" },
                { slug: "scp-096", title: "SCP-096 - “羞涩”的人" },
                { slug: "scp-682", title: "SCP-682 - 不灭孽蜥" },
                { slug: "scp-049", title: "SCP-049 - 疫医" },
                { slug: "scp-087", title: "SCP-087 - 楼梯间" },
                { slug: "scp-999", title: "SCP-999 - 痒痒怪" },
                { slug: "scp-5000", title: "SCP-5000 - 为什么？" },
                { slug: "scp-6000", title: "SCP-6000 - 毒蛇、恶徒与放逐者之图书馆" },
                { slug: "scp-cn-2000", title: "SCP-CN-2000 - 混沌理论" },
                { slug: "scp-cn-1000", title: "SCP-CN-1000 - 流星之誓" },
                { slug: "scp-cn-001", title: "SCP-CN-001 - 监督者议会提案集" }
            ];
            if (search && search.trim()) {
                const q = search.toLowerCase();
                return list.filter(i => i.slug.includes(q) || i.title.toLowerCase().includes(q));
            }
            return list;
        }

        // Check if catalog already exists in SQLite
        if (!db.hasCatalog(seriesKey)) {
            console.log(`[DocumentService] Catalog for ${seriesKey} not cached yet. Scraping from Wikidot...`);
            await this.syncCatalog(seriesKey);
        }

        return db.getCatalogItems(seriesKey, search);
    }

    public static async syncCatalog(seriesKey: string): Promise<number> {
        const urlMap: Record<string, string> = {
            "cn-series-1": "https://scp-wiki-cn.wikidot.com/scp-series-cn",
            "cn-series-2": "https://scp-wiki-cn.wikidot.com/scp-series-cn-2",
            "cn-series-3": "https://scp-wiki-cn.wikidot.com/scp-series-cn-3",
            "cn-series-4": "https://scp-wiki-cn.wikidot.com/scp-series-cn-4",
            "series-1": "https://scp-wiki-cn.wikidot.com/scp-series",
            "series-2": "https://scp-wiki-cn.wikidot.com/scp-series-2",
            "series-3": "https://scp-wiki-cn.wikidot.com/scp-series-3",
            "series-4": "https://scp-wiki-cn.wikidot.com/scp-series-4",
            "series-5": "https://scp-wiki-cn.wikidot.com/scp-series-5",
            "series-6": "https://scp-wiki-cn.wikidot.com/scp-series-6",
            "series-7": "https://scp-wiki-cn.wikidot.com/scp-series-7",
            "series-8": "https://scp-wiki-cn.wikidot.com/scp-series-8",
            "series-9": "https://scp-wiki-cn.wikidot.com/scp-series-9",
            "joke": "https://scp-wiki-cn.wikidot.com/joke-scps"
        };

        const targetUrl = urlMap[seriesKey];
        if (!targetUrl) return 0;

        try {
            const axios = (await import("axios")).default;
            const cheerio = await import("cheerio");
            const resp = await axios.get(targetUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                timeout: 15000
            });

            const $ = cheerio.load(resp.data);
            const items: Array<{ slug: string; title: string }> = [];

            $("#page-content li").each((_, li) => {
                const a = $(li).find("a").first();
                const href = a.attr("href");
                if (!href) return;

                const slug = href.replace(/^\/+/, "").toLowerCase().trim();
                const text = $(li).text().trim().replace(/\s+/g, " ");

                // Filter out meta pages
                if (
                    slug.startsWith("scp-") &&
                    !slug.includes("tales") &&
                    !slug.includes("removed") &&
                    !slug.includes("ex") &&
                    !slug.includes("series") &&
                    !slug.includes("heritage")
                ) {
                    items.push({
                        slug,
                        title: text || a.text().trim() || slug.toUpperCase()
                    });
                }
            });

            if (items.length > 0) {
                db.saveCatalogItems(seriesKey, items);
                console.log(`[DocumentService] Synced ${items.length} items for series ${seriesKey}`);
            }

            return items.length;
        } catch (err: any) {
            console.error(`[DocumentService] Failed to sync catalog for ${seriesKey}:`, err.message);
            return 0;
        }
    }
}
