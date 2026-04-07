import { Incident, NewsArticle } from "@/types";

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source?: string;
}

const RSS_FEEDS = [
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
  { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml" },
  { name: "SecurityWeek", url: "https://www.securityweek.com/feed/" },
  { name: "DataBreaches", url: "https://www.databreaches.net/feed/" },
];

const BREACH_KEYWORDS = [
  "breach", "data breach", "ransomware", "cyberattack", "data leak",
  "exposed", "compromised", "hack", "unauthorized access", "incident",
  "malware", "phishing", "credential stuffing", "data theft"
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBreachRelated(article: { title: string; summary: string }): boolean {
  const content = (article.title + " " + article.summary).toLowerCase();
  return BREACH_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes("ransomware")) tags.push("Ransomware");
  if (lowerText.includes("phishing")) tags.push("Phishing");
  if (lowerText.includes("data breach") || lowerText.includes("breach")) tags.push("Data Breach");
  if (lowerText.includes("credential")) tags.push("Credential Leak");
  if (lowerText.includes("malware")) tags.push("Malware");
  if (lowerText.includes("ddos")) tags.push("DDoS");
  if (lowerText.includes("api")) tags.push("API Security");
  if (lowerText.includes("zero-day") || lowerText.includes("zero day")) tags.push("Zero-Day");
  if (lowerText.includes("vulnerability")) tags.push("Vulnerability");
  if (lowerText.includes("data leak") || lowerText.includes("leak")) tags.push("Data Leak");

  return tags;
}

function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[1];
    
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link") || extractCDATALink(itemXml);
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

function extractCDATALink(xml: string): string | undefined {
  const regex = /<link[^>]*><!\[CDATA\[([^\]]*)\]\]><\/link>/i;
  const match = xml.match(regex);
  return match?.[1];
}

export async function fetchRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "DayZero App contact@dayzero.app",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${feedUrl}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseRSS(xml);
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

export async function fetchAllNewsFeeds(): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  const feedPromises = RSS_FEEDS.map(async feed => {
    try {
      const items = await fetchRSSFeed(feed.url);
      return items.map(item => ({
        id: `${feed.name}-${Buffer.from(item.link || item.title).toString("base64").slice(0, 12)}`,
        title: item.title,
        source: feed.name,
        url: item.link,
        publishedAt: item.pubDate,
        summary: stripHtml(item.description || "").slice(0, 300),
        relatedCompanies: [] as string[],
        tags: extractTags(item.title + " " + item.description),
      }));
    } catch (error) {
      console.error(`Error processing feed ${feed.name}:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(feedPromises);
  
  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  return articles
    .filter(article => isBreachRelated(article))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function newsToIncident(article: NewsArticle): Partial<Incident> {
  const severity = determineSeverity(article.summary);

  return {
    title: article.title,
    summary: article.summary,
    description: `Reported by ${article.source}. ${article.summary}`,
    severity,
    status: "investigating",
    sources: [{
      type: "news",
      sourceName: article.source,
      url: article.url,
      confidence: 0.7,
      discoveredAt: article.publishedAt,
    }],
    exposedData: [{
      category: "other",
      types: article.tags,
    }],
    discoveredAt: article.publishedAt,
    reportedAt: article.publishedAt,
  };
}

function determineSeverity(summary: string): "Critical" | "High" | "Medium" | "Low" {
  const critical = ["ransomware", "million records", "critical vulnerability", "data exfiltration"];
  const high = ["breach", "compromised", "unauthorized", "cyberattack", "exposed"];
  const medium = ["leak", "vulnerability", "incident", "hack"];

  const lower = summary.toLowerCase();

  if (critical.some(term => lower.includes(term))) return "Critical";
  if (high.some(term => lower.includes(term))) return "High";
  if (medium.some(term => lower.includes(term))) return "Medium";
  return "Low";
}

export async function searchNewsByCompany(companyName: string): Promise<NewsArticle[]> {
  const allNews = await fetchAllNewsFeeds();
  
  return allNews.filter(article => 
    article.title.toLowerCase().includes(companyName.toLowerCase()) ||
    article.summary.toLowerCase().includes(companyName.toLowerCase())
  );
}
