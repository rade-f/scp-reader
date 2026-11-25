import requests

API_KEY = "AIzaSyBjiQsuYJNixPjEx2jjEHplMyGL9Ild2uM"
MODEL = "gemini-3-flash-preview"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

sample_html = """
<div class="anom-bar-container">
    <div class="anom-bar">
        <span class="item-number">Item #: SCP-9999</span>
        <span class="class-tag danger">Object Class: Keter</span>
    </div>
</div>
<p><strong>Special Containment Procedures:</strong> SCP-9999 is to be kept in a vacuum-sealed reinforced containment cube at Site-42. Under no circumstances should personnel under clearance Level 3 make direct eye contact with the artifact.</p>
<div class="collapsible-block">
    <div class="collapsible-block-folded"><a class="collapsible-block-link" href="#">+ Open Addendum 9999.1</a></div>
</div>
"""

prompt = f"""You are a professional translator for the SCP Foundation Chinese Branch.
Translate the following English SCP document fragment into Simplified Chinese (zh-CN).
CRITICAL RULES:
1. Preserve ALL HTML tags, attributes, class names, IDs, and structure EXACTLY as they are.
2. Only translate the human-readable text contents.
3. Keep standard SCP terminology:
   - 'Item #:' -> '项目编号：'
   - 'Object Class:' -> '项目等级：'
   - 'Special Containment Procedures:' -> '特殊收容措施：'
   - 'Description:' -> '描述：'
   - 'Safe' -> 'Safe', 'Euclid' -> 'Euclid', 'Keter' -> 'Keter', 'Thaumiel' -> 'Thaumiel', 'Apollyon' -> 'Apollyon'
   - 'Site-XX' -> 'Site-XX'
   - 'Level X' -> 'Level X'
4. Return ONLY the translated HTML without markdown backticks or commentary.

HTML to translate:
{sample_html}"""

payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {
        "temperature": 0.2
    }
}

resp = requests.post(URL, json=payload, timeout=20)
print(f"Status Code: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    result = data["candidates"][0]["content"]["parts"][0]["text"]
    print("\n--- Translation Result ---")
    print(result.strip())
else:
    print(f"Error Response: {resp.text}")
