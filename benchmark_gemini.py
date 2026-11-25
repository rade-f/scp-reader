import requests
import json

API_KEY = "AIzaSyBjiQsuYJNixPjEx2jjEHplMyGL9Ild2uM"

test_models = [
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3-flash-preview"
]

for m in test_models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={API_KEY}"
    payload = {"contents": [{"parts": [{"text": "Hello! Reply with 'OK - ' followed by your model name."}]}]}
    print(f"\nTesting {m}...")
    try:
        r = requests.post(url, json=payload, timeout=25)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            print(f"Response: {text}")
        else:
            print(f"Error: {r.text[:200]}")
    except Exception as e:
        print(f"Failed with exception: {e}")
