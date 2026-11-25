import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "preview")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Minimal Wikidot interaction script for client-side functionality:
# 1. Collapsible blocks toggling
# 2. Footnotes popups or anchors
# 3. YUI tabview tabs
WIKIDOT_RUNTIME_JS = """
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
});
</script>
"""

READER_CONTAINER_STYLE = """
<style>
/* Reader container reset & centering */
body {
    margin: 0;
    padding: 0;
    background-color: #f7f7f7;
    font-family: verdana, arial, helvetica, sans-serif;
    color: #333;
}
.reader-wrapper {
    max-width: 900px;
    margin: 20px auto;
    padding: 24px 32px;
    background: #fff;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    border-radius: 8px;
    min-height: 80vh;
}
/* Ensure images fit within the container */
#page-content img {
    max-width: 100%;
    height: auto;
}
/* Hide edit buttons or Wikidot junk if any leaked through */
.page-rate-widget-box, #action-area {
    user-select: none;
}
</style>
"""

def extract_and_package(slug, site="cn"):
    domain = "https://scp-wiki-cn.wikidot.com" if site == "cn" else "https://scp-wiki.wikidot.com"
    url = f"{domain}/{slug}"
    print(f"Fetching {slug} from {url}...")
    
    resp = requests.get(url, headers=HEADERS, timeout=15)
    if resp.status_code != 200:
        print(f"Failed to fetch {slug}: {resp.status_code}")
        return None
        
    soup = BeautifulSoup(resp.text, "html.parser")
    page_content = soup.find(id="page-content")
    if not page_content:
        print(f"Error: #page-content not found for {slug}")
        return None
        
    page_title_elem = soup.find(id="page-title")
    title_text = page_title_elem.get_text(strip=True) if page_title_elem else slug.upper()
    
    # Collect all <style> tags from the entire document (head and body)
    styles = soup.find_all("style")
    style_html = "\n".join([str(s) for s in styles])
    
    # Collect external stylesheets if any
    links = soup.find_all("link", rel=lambda r: r and "stylesheet" in r)
    link_html = "\n".join([str(l) for l in links])
    
    # Rewrite relative paths in #page-content to absolute URLs
    for img in page_content.find_all("img"):
        src = img.get("src")
        if src and not src.startswith("http") and not src.startswith("data:"):
            img["src"] = urljoin(domain, src)
            
    for a in page_content.find_all("a"):
        href = a.get("href")
        if href and not href.startswith("http") and not href.startswith("#") and not href.startswith("javascript:"):
            a["href"] = urljoin(domain, href)
            
    # Assemble standalone HTML document
    html_output = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title_text} - SCP Reader</title>
    {link_html}
    {style_html}
    {READER_CONTAINER_STYLE}
</head>
<body>
    <div class="reader-wrapper">
        <h1 id="page-title" style="margin-top:0;">{title_text}</h1>
        <div id="page-content">
            {str(page_content)}
        </div>
    </div>
    {WIKIDOT_RUNTIME_JS}
</body>
</html>
"""
    file_path = os.path.join(OUTPUT_DIR, f"{slug}.html")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html_output)
        
    print(f"Successfully generated: {file_path} ({len(html_output)} bytes)")
    return file_path

if __name__ == "__main__":
    slugs = ["scp-173", "scp-cn-2000", "scp-6000"]
    for s in slugs:
        extract_and_package(s)
