import { db } from "./db";
import { DocumentService } from "./documentService";
import { execSync } from "child_process";
import path from "path";

/**
 * SCP Reader Batch Offline Scraper
 * Usage:
 *   npx tsx src/batch_crawler.ts --series series-1 --limit 50
 *   npx tsx src/batch_crawler.ts --slugs scp-001,scp-002,scp-003
 *   npx tsx src/batch_crawler.ts --range 1-100
 *   npx tsx src/batch_crawler.ts --all
 */

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const args = process.argv.slice(2);
    console.log("=== SCP Reader Batch Offline Crawler ===");

    let targetSlugs: string[] = [];

    // Parse CLI parameters
    const seriesArgIdx = args.indexOf("--series");
    const limitArgIdx = args.indexOf("--limit");
    const rangeArgIdx = args.indexOf("--range");
    const slugsArgIdx = args.indexOf("--slugs");
    const allFlag = args.includes("--all");

    const limit = limitArgIdx !== -1 ? parseInt(args[limitArgIdx + 1], 10) : 0;

    if (slugsArgIdx !== -1) {
        targetSlugs = args[slugsArgIdx + 1].split(",").map((s) => s.trim().toLowerCase());
    } else if (rangeArgIdx !== -1) {
        const [start, end] = args[rangeArgIdx + 1].split("-").map((n) => parseInt(n, 10));
        for (let i = start; i <= end; i++) {
            targetSlugs.push(`scp-${String(i).padStart(3, "0")}`);
        }
    } else if (seriesArgIdx !== -1) {
        const seriesKey = args[seriesArgIdx + 1];
        const rows = db.database
            .prepare(`SELECT slug FROM catalog_items WHERE series_key = ? ORDER BY item_order ASC`)
            .all(seriesKey) as { slug: string }[];
        targetSlugs = rows.map((r) => r.slug);
    } else if (allFlag) {
        const rows = db.database
            .prepare(`SELECT slug FROM catalog_items ORDER BY series_key, item_order ASC`)
            .all() as { slug: string }[];
        targetSlugs = rows.map((r) => r.slug);
    } else {
        // Default: crawl the top classic series-1 first 50 articles
        console.log("No specific flag passed. Defaulting to first 50 of Series-1...");
        const rows = db.database
            .prepare(`SELECT slug FROM catalog_items WHERE series_key = 'series-1' ORDER BY item_order ASC LIMIT 50`)
            .all() as { slug: string }[];
        targetSlugs = rows.map((r) => r.slug);
    }

    if (limit > 0 && targetSlugs.length > limit) {
        targetSlugs = targetSlugs.slice(0, limit);
    }

    console.log(`[Batch] Total candidates to process: ${targetSlugs.length}`);

    // Filter out already cached
    const existingSet = new Set(
        (db.database.prepare(`SELECT slug FROM articles`).all() as { slug: string }[]).map((r) => r.slug)
    );

    const pending = targetSlugs.filter((s) => !existingSet.has(s));
    console.log(`[Batch] Already cached: ${targetSlugs.length - pending.length}. Remaining to scrape: ${pending.length}`);

    if (pending.length === 0) {
        console.log("All target articles are already cached in database!");
    } else {
        let successCount = 0;
        let failCount = 0;
        const total = pending.length;

        // Process in small controlled concurrency (2-3 parallel requests)
        const CONCURRENCY = 2;
        let index = 0;

        async function worker(workerId: number) {
            while (index < pending.length) {
                const currentIndex = index++;
                const slug = pending[currentIndex];
                const progress = `[${currentIndex + 1}/${total}]`;

                try {
                    console.log(`${progress} (Worker ${workerId}) Scraping: ${slug}...`);
                    const doc = await DocumentService.getDocument(slug);
                    if (doc) {
                        successCount++;
                        console.log(`✓ ${progress} Successfully saved: ${doc.title} (${doc.source_type})`);
                    } else {
                        failCount++;
                        console.warn(`✗ ${progress} Failed/Empty: ${slug}`);
                    }
                } catch (err: any) {
                    failCount++;
                    console.error(`! ${progress} Error on ${slug}:`, err.message);
                }

                // Respectful polite pause between requests to prevent Wikidot 429
                await sleep(500);
            }
        }

        const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
        await Promise.all(workers);

        console.log(`\n=== Scraping Completed ===`);
        console.log(`Success: ${successCount}, Failed: ${failCount}, Total Processed: ${total}`);
    }

    // Export bundle
    console.log("\n[Export] Generating updated offline bundles...");
    try {
        const exportScript = path.join(__dirname, "../export_offline_bundle.ts");
        execSync(`npx tsx "${exportScript}"`, { stdio: "inherit" });
        console.log("✓ Offline data export finished!");
    } catch (err: any) {
        console.error("Failed to run export_offline_bundle:", err.message);
    }
}

main().catch((err) => {
    console.error("Batch crawler fatal error:", err);
    process.exit(1);
});
