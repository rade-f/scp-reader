import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

TEST_TARGETS = [
    {
        "id": "scp-173",
        "name": "经典经典文档 (SCP-173)",
        "source": "cn",
        "url": "https://scp-wiki-cn.wikidot.com/scp-173"
    },
    {
        "id": "scp-cn-2000",
        "name": "中文原创大型文档 (SCP-CN-2000)",
        "source": "cn",
        "url": "https://scp-wiki-cn.wikidot.com/scp-cn-2000"
    },
    {
        "id": "scp-6000",
        "name": "现代BHL/ACS样式文档 (SCP-6000)",
        "source": "cn",
        "url": "https://scp-wiki-cn.wikidot.com/scp-6000"
    },
    {
        "id": "scp-non-existent-test",
        "name": "不存在的CN测试 (用于验证Fallback)",
        "source": "cn",
        "url": "https://scp-wiki-cn.wikidot.com/scp-8999-not-translated-yet"
    }
]

def fetch_and_analyze(target):
    url = target["url"]
    print(f"\n==========================================")
    print(f"Testing: {target['name']} -> {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=12)
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 404:
            print("Result: 404 Not Found (Eligible for EN Fallback)")
            return {"status": 404, "target": target}
            
        if resp.status_code != 200:
            print(f"Failed with status: {resp.status_code}")
            return {"status": resp.status_code, "target": target}
            
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Check if it's Wikidot's pseudo 404 page (page doesn't exist message)
        page_title = soup.find(id="page-title")
        title_text = page_title.get_text(strip=True) if page_title else "No Title"
        
        page_content = soup.find(id="page-content")
        if not page_content:
            print("Error: #page-content not found!")
            return {"status": "no_content", "target": target}
            
        # Detect Wikidot's "This page does not exist yet"
        content_text = page_content.get_text()
        if "此页面尚未存在" in content_text or "This page does not exist yet" in content_text:
            print("Result: Wikidot 'page does not exist' detected! (Eligible for EN Fallback)")
            return {"status": 404, "target": target}
            
        # Extract metadata
        tags = [a.get_text(strip=True) for a in soup.select(".page-tags a")]
        
        # Collect external CSS
        stylesheets = []
        for link in soup.find_all("link", rel=lambda r: r and "stylesheet" in r):
            href = link.get("href")
            if href:
                stylesheets.append(urljoin(url, href))
                
        # Collect inline <style> modules
        styles = soup.find_all("style")
        inline_css_count = len(styles)
        
        # Check components
        has_collapsible = len(page_content.select(".collapsible-block")) > 0
        has_tabview = len(page_content.select(".yui-navset")) > 0
        has_acs = len(page_content.select(".anomalous-item, .heritage-badge, .anom-bar-container, [class*='acs']")) > 0
        images = page_content.find_all("img")
        
        print(f"Title: {title_text}")
        print(f"Tags: {tags}")
        print(f"Stylesheets count: {len(stylesheets)}")
        print(f"Inline styles count: {inline_css_count}")
        print(f"Collapsible blocks: {has_collapsible}")
        print(f"Tab views: {has_tabview}")
        print(f"ACS/Badge components: {has_acs}")
        print(f"Image count: {len(images)}")
        
        return {
            "status": 200,
            "target": target,
            "title": title_text,
            "tags": tags,
            "stylesheets": stylesheets,
            "page_content": page_content,
            "resp_text": resp.text,
            "soup": soup
        }
        
    except Exception as e:
        print(f"Exception during fetch: {e}")
        return {"status": "error", "error": str(e), "target": target}

if __name__ == "__main__":
    for t in TEST_TARGETS:
        fetch_and_analyze(t)
