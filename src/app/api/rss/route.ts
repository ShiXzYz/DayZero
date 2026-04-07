import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FEEDS = [
  "https://www.databreaches.net/feed/",
  "https://www.bleepingcomputer.com/feed/",
  "https://krebsonsecurity.com/feed/",
  "https://feeds.feedburner.com/TheHackersNews",
  "https://www.darkreading.com/rss.xml",
  "https://www.securityweek.com/feed/",
];

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedUrl = searchParams.get("url");

  if (!feedUrl) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  if (!ALLOWED_FEEDS.some(allowed => feedUrl.startsWith(allowed))) {
    return NextResponse.json({ error: "Feed not allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "DayZero/1.0 (contact@dayzero.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch feed" }, { status: 502 });
    }

    const xml = await response.text();
    const items = parseRSS(xml);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("RSS proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch RSS feed" }, { status: 500 });
  }
}

function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[1];
    
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = extractCDATA(itemXml, "description") || extractTag(itemXml, "description");
    const pubDate = extractTag(itemXml, "pubDate") || extractTag(itemXml, "dc:date");

    if (title) {
      items.push({
        title: title.trim(),
        link: link?.trim() || "",
        description: description?.trim() || "",
        pubDate: pubDate?.trim() || new Date().toISOString(),
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1];
}

function extractCDATA(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1];
}
