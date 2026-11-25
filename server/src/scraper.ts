import axios from "axios";
import * as cheerio from "cheerio";
import { CONFIG } from "./config";

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

export interface ScrapedPage {
    slug: string;
    title: string;
    object_class: string | null;
    tags: string[];
    html_content: string;
    styles: string[];
    is_cn: boolean;
}

export class WikidotScraper {
    public static async fetchPage(slug: string, site: "cn" | "en" = "cn"): Promise<ScrapedPage | null> {
        const cleanSlug = slug.toLowerCase().trim();
        const domain = site === "cn" ? CONFIG.CN_DOMAIN : CONFIG.EN_DOMAIN;
        const url = `${domain}/${cleanSlug}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const resp = await fetch(url, {
                headers: HEADERS,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (resp.status === 404) {
                return null;
            }

            if (!resp.ok) {
                console.warn(`[Scraper] Unexpected status ${resp.status} for ${url}`);
                return null;
            }

            const html = await resp.text();
            const $ = cheerio.load(html);

            // Check Wikidot's "Page does not exist yet"
            const pageContentElem = $("#page-content");
            if (!pageContentElem || pageContentElem.length === 0) {
                return null;
            }

            const rawText = pageContentElem.text();
            if (rawText.includes("此页面尚未存在") || rawText.includes("This page does not exist yet") || rawText.includes("创建页面")) {
                return null;
            }

            // Extract Title
            const titleElem = $("#page-title");
            const title = titleElem.text().trim() || cleanSlug.toUpperCase();

            // Extract Tags
            const tags: string[] = [];
            $(".page-tags a").each((_, el) => {
                const tag = $(el).text().trim();
                if (tag) tags.push(tag);
            });

            // Extract Object Class from tags or text
            let objectClass: string | null = null;
            const knownClasses = ["safe", "euclid", "keter", "thaumiel", "apollyon", "archon", "neutralized", "explained", "pending", "机密"];
            for (const t of tags) {
                if (knownClasses.includes(t.toLowerCase())) {
                    objectClass = t.toUpperCase();
                    break;
                }
            }
            if (!objectClass) {
                const match = rawText.match(/(?:项目等级|Object Class)[：:]\s*([a-zA-Z\u4e00-\u9fa5]+)/i);
                if (match && match[1]) {
                    objectClass = match[1].trim();
                }
            }

            // Clean unwanted Wikidot UI elements
            pageContentElem.find(".page-rate-widget-box").remove();
            pageContentElem.find("#action-area").remove();
            pageContentElem.find(".comments-box").remove();
            pageContentElem.find("#page-options-container").remove();
            pageContentElem.find(".creditButton").remove();

            // Collect all stylesheets (<style> and <link rel="stylesheet">)
            const styles: string[] = [];
            $("style").each((_, el) => {
                styles.push($.html(el));
            });
            $("link[rel*='stylesheet']").each((_, el) => {
                const href = $(el).attr("href");
                if (href) {
                    const absHref = href.startsWith("http") ? href : new URL(href, domain).href;
                    styles.push(`<link rel="stylesheet" href="${absHref}">`);
                }
            });

            // Fix relative assets (images, audios, links)
            pageContentElem.find("img").each((_, el) => {
                let src = $(el).attr("src");
                if (src) {
                    if (src.startsWith("http://")) {
                        src = src.replace("http://", "https://");
                    } else if (!src.startsWith("https://") && !src.startsWith("data:")) {
                        src = new URL(src, domain).href.replace("http://", "https://");
                    }
                    $(el).attr("src", src);
                }
            });

            pageContentElem.find("a").each((_, el) => {
                const href = $(el).attr("href");
                if (href && !href.startsWith("http") && !href.startsWith("#") && !href.startsWith("javascript:")) {
                    const cleanHref = href.replace(/^\/+/, "");
                    // Point to app internal reader route
                    $(el).attr("href", `#/read/${cleanHref}`);
                }
            });

            return {
                slug: cleanSlug,
                title,
                object_class: objectClass,
                tags,
                html_content: pageContentElem.html() || "",
                styles,
                is_cn: site === "cn"
            };

        } catch (err: any) {
            console.error(`[Scraper] Error fetching ${url}:`, err.message);
            return null;
        }
    }
}
