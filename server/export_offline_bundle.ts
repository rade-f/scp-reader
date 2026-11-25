import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.join(__dirname, "scp_cache.db");
const OUTPUT_DIR = path.join(__dirname, "../client/public/offline_data");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const db = new Database(DB_PATH);

console.log("=== Exporting Offline Bundle from SQLite ===");

// 1. Export Catalogs
const seriesKeys = [
    "featured",
    "series-1",
    "series-2",
    "series-3",
    "series-4",
    "series-5",
    "series-6",
    "series-7",
    "series-8",
    "series-9",
    "cn-series-1",
    "cn-series-2",
    "cn-series-3",
    "joke"
];

const allCatalogs: Record<string, any[]> = {};
let totalCatalogCount = 0;

for (const key of seriesKeys) {
    let items: any[] = [];
    if (key === "featured") {
        items = [
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
    } else {
        items = db.prepare(`SELECT slug, title FROM catalog_items WHERE series_key = ? ORDER BY item_order ASC`).all(key) as any[];
    }
    allCatalogs[key] = items;
    totalCatalogCount += items.length;

    // Write individual series catalog file
    fs.writeFileSync(
        path.join(OUTPUT_DIR, `catalog_${key}.json`),
        JSON.stringify({ seriesKey: key, count: items.length, items }, null, 2),
        "utf-8"
    );
}

fs.writeFileSync(
    path.join(OUTPUT_DIR, "catalogs.json"),
    JSON.stringify(allCatalogs),
    "utf-8"
);
console.log(`[Export] Exported ${totalCatalogCount} catalog entries across ${seriesKeys.length} series.`);

// 2. Export Cached Articles
const articles = db.prepare(`SELECT * FROM articles`).all() as any[];
const articleMap: Record<string, any> = {};

for (const a of articles) {
    articleMap[a.slug] = {
        slug: a.slug,
        title: a.title,
        series: a.series,
        object_class: a.object_class,
        source_type: a.source_type,
        html_content: a.html_content,
        styles: JSON.parse(a.styles_json || "[]"),
        tags: a.tags_json ? JSON.parse(a.tags_json) : [],
        raw_en_content: a.raw_en_content
    };
}

fs.writeFileSync(
    path.join(OUTPUT_DIR, "articles.json"),
    JSON.stringify(articleMap),
    "utf-8"
);

console.log(`[Export] Exported ${articles.length} cached full-text articles into offline_data/articles.json.`);

// 3. Export Manifest
const manifest = {
    exported_at: new Date().toISOString(),
    total_catalogs: totalCatalogCount,
    total_articles: articles.length,
    cached_slugs: articles.map(a => a.slug)
};

fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
);

console.log("=== Export Complete! ===");
