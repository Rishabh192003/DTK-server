import requests
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Store your key in .env or as an environment variable

def ask_gemini(prompt, context=None):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    if context:
        data["contents"][0]["parts"].append({"text": context})
    params = {"key": GEMINI_API_KEY}
    response = requests.post(url, headers=headers, params=params, json=data)
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]

