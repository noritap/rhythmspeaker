#!/usr/bin/env python3
"""Sync published Hatena RSS entries to the static Shoten editorial feed."""
import datetime as dt
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FEED = "https://rhythmspeaker.hatenablog.com/rss"
BLOG_PREFIX = "https://rhythmspeaker.hatenablog.com/entry/"
PRODUCT_PATTERN = re.compile(r"(?:https://noritap.github.io/rhythmspeaker/shoten/)?#/product/(RS-P\\d{4,})")
TAG_RE = re.compile(r"<[^>]*>")

def parse_feed(xml_bytes, valid_ids):
    root = ET.fromstring(xml_bytes)
    entries = []
    seen = set()
    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        url = (item.findtext("link") or "").strip()
        if not title or not url.startswith(BLOG_PREFIX) or url in seen:
            continue
        seen.add(url)
        desc = item.findtext("description") or ""
        content = item.findtext("{http://purl.org/rss/1.0/modules/content/}encoded") or ""
        body = html.unescape(desc + " " + content)
        product_ids = sorted(set(PRODUCT_PATTERN.findall(body)) & valid_ids)
        summary = re.sub(r"\\s+", " ", html.unescape(TAG_RE.sub(" ", desc))).strip()[:160]
        published = (item.findtext("pubDate") or "").strip()
        entries.append({"title":title[:180],"url":url,"summary":summary,"published":published,"product_ids":product_ids})
        if len(entries)>=40:
            break
    return entries

def main():
    products = json.loads((ROOT/"shoten/catalog.json").read_text(encoding="utf-8"))["products"]
    ids = {p["product_id"] for p in products}
    req = urllib.request.Request(FEED, headers={"User-Agent":"RhythmSpeakerStoreJournal/1.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        data = response.read(3_000_000)
    entries = parse_feed(data, ids)
    if not entries:
        raise ValueError("RSS has no published articles; keeping previous snapshot")
    target = ROOT/"shoten/blog-feed.json"
    old = json.loads(target.read_text(encoding="utf-8"))
    # Avoid needless commits when the RSS contains no new content.
    if old.get("entries")==entries:
        print("No changes")
        return
    payload={"schema_version":1,"source":FEED,"updated_at":dt.datetime.now(dt.timezone.utc).isoformat(),"entries":entries}
    target.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    print(f"Updated {len(entries)} blog entries")

if __name__=="__main__":
    main()
