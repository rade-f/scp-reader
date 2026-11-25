import Fastify from "fastify";
import cors from "@fastify/cors";
import { CONFIG } from "./config";
import { db } from "./db";
import { DocumentService } from "./documentService";

const app = Fastify({
    logger: true
});

// Register CORS
app.register(cors, {
    origin: true
});

// Minimal runtime JS for collapsibles, tabs, etc.
const WIKIDOT_INJECTED_RUNTIME = `
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 1. Collapsible blocks
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
            });
        });
    });

    // 2. YUI Tabs
    document.querySelectorAll('.yui-navset').forEach(function(navset) {
        var tabs = navset.querySelectorAll('.yui-nav li');
        var contents = navset.querySelectorAll('.yui-content > div');
        tabs.forEach(function(tab, index) {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                tabs.forEach(function(t) { t.classList.remove('selected'); });
                contents.forEach(function(c) { c.style.display = 'none'; });
                tab.classList.add('selected');
                if (contents[index]) contents[index].style.display = 'block';
            });
        });
    });

    // 3. Post height message to parent frame
    function reportHeight() {
        var height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'SCP_RESIZE', height: height }, '*');
    }
    window.addEventListener('load', reportHeight);
    window.addEventListener('resize', reportHeight);
    setTimeout(reportHeight, 500);
    setTimeout(reportHeight, 2000);
});
</script>
`;

// Default reader CSS inside iframe
const IFRAME_BASE_STYLE = `
<style>
body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    color: #1d1d1f;
    background-color: transparent;
    line-height: 1.6;
}
#page-content {
    padding: 8px 0;
    overflow-x: hidden;
}
img {
    max-width: 100% !important;
    height: auto !important;
}
/* Smooth transitions */
.collapsible-block-unfolded {
    transition: all 0.2s ease-in-out;
}
</style>
`;

// Routes
// 1. Get Document (JSON)
app.get("/api/documents/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { refresh } = request.query as { refresh?: string };
    const forceRefresh = refresh === "true";

    try {
        const doc = await DocumentService.getDocument(slug, forceRefresh);
        if (!doc) {
            return reply.status(404).send({ error: "Document not found" });
        }
        return {
            ...doc,
            styles: JSON.parse(doc.styles_json),
            tags: doc.tags_json ? JSON.parse(doc.tags_json) : []
        };
    } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({ error: "Internal server error", message: err.message });
    }
});

// 2. Standalone Raw Isolated HTML Preview (For Apple-styled Iframe Embedding)
app.get("/api/raw-preview/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const doc = await DocumentService.getDocument(slug);
    if (!doc) {
        reply.type("text/html; charset=utf-8");
        return `<!DOCTYPE html><html><body><h2 style="font-family:sans-serif;text-align:center;color:#888;margin-top:40px;">文档未收录或不存在</h2></body></html>`;
    }

    const stylesArray: string[] = JSON.parse(doc.styles_json);
    const stylesCombined = stylesArray.join("\n");

    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title}</title>
    ${stylesCombined}
    ${IFRAME_BASE_STYLE}
</head>
<body>
    <div id="page-content">
        ${doc.html_content}
    </div>
    ${WIKIDOT_INJECTED_RUNTIME}
</body>
</html>`;

    reply.type("text/html; charset=utf-8");
    return fullHtml;
});

// 3. Catalog by series
app.get("/api/catalog/:seriesKey", async (request) => {
    const { seriesKey } = request.params as { seriesKey: string };
    const { search } = request.query as { search?: string };
    const items = await DocumentService.getCatalog(seriesKey, search);
    return { seriesKey, count: items.length, items };
});

// Sync Catalog on demand
app.post("/api/catalog/:seriesKey/sync", async (request) => {
    const { seriesKey } = request.params as { seriesKey: string };
    const count = await DocumentService.syncCatalog(seriesKey);
    return { success: true, seriesKey, count };
});

// 4. Search
app.get("/api/search", async (request) => {
    const { q } = request.query as { q?: string };
    if (!q || !q.trim()) return [];
    return db.searchArticles(q.trim());
});

// 5. Bookmarks
app.get("/api/user/bookmarks", async () => {
    return db.getBookmarks();
});

app.post("/api/user/bookmarks", async (request) => {
    const { slug, title, source_type, action } = request.body as any;
    if (action === "remove") {
        db.removeBookmark(slug);
        return { success: true, is_bookmarked: false };
    } else {
        db.addBookmark(slug, title, source_type);
        return { success: true, is_bookmarked: true };
    }
});

// 6. History
app.get("/api/user/history", async () => {
    return db.getHistory();
});

// Start Server
const start = async () => {
    try {
        await app.listen({ port: CONFIG.PORT, host: "0.0.0.0" });
        console.log(`🚀 SCP-Reader Server running on http://localhost:${CONFIG.PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
