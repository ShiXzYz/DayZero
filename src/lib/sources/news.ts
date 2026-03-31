import { Incident, NewsArticle } from "@/types";

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source?: string;
}

const RSS_FEEDS = [
  { name: "DataBreaches", url: "https://www.databreaches.net/feed/" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews" },
  { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml" },
  { name: "SecurityWeek", url: "https://www.securityweek.com/feed/" },
];

const BREACH_KEYWORDS = [
  "breach", "data breach", "ransomware", "cyberattack", "data leak",
  "exposed", "compromised", "hack", "unauthorized access", "incident",
  "malware", "phishing", "credential stuffing", "data theft"
];

const COMPANY_EXTractors = [
  /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:discloses|reports|confirms|investigates|hit by|affected by|breached)/gi,
  /(?:Affected|Impacted):\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/gi,
  /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:user|customer|employee|data)/gi,
];

export async function fetchRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

export async function fetchAllNewsFeeds(): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  const feedPromises = RSS_FEEDS.map(async feed => {
    const items = await fetchRSSFeed(feed.url);
    return items.map(item => ({
      id: `${feed.name}-${Buffer.from(item.link).toString("base64").slice(0, 12)}`,
      title: item.title,
      source: feed.name,
      url: item.link,
      publishedAt: item.pubDate,
      summary: stripHtml(item.description || "").slice(0, 300),
      relatedCompanies: extractCompanyNames(item.title + " " + item.description),
      tags: extractTags(item.title + " " + item.description),
    }));
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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBreachRelated(article: NewsArticle): boolean {
  const content = (article.title + " " + article.summary).toLowerCase();
  return BREACH_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
}

function extractCompanyNames(text: string): string[] {
  const companies = new Set<string>();
  
  for (const regex of COMPANY_EXTractors) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 50 && !isCommonWord(company)) {
        companies.add(company);
      }
    }
  }

  return Array.from(companies);
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

  return tags;
}

function determineSeverity(summary: string): "Critical" | "High" | "Medium" | "Low" {
  const critical = ["ransomware", "million records", "mass breach", "critical vulnerability", "data exfiltration"];
  const high = ["breach", "compromised", "unauthorized", "cyberattack", "exposed"];
  const medium = ["leak", "vulnerability", "incident", "hack"];

  const lower = summary.toLowerCase();

  if (critical.some(term => lower.includes(term))) return "Critical";
  if (high.some(term => lower.includes(term))) return "High";
  if (medium.some(term => lower.includes(term))) return "Medium";
  return "Low";
}

function isCommonWord(word: string): boolean {
  const common = [
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
    "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
    "how", "its", "may", "new", "now", "old", "see", "two", "way", "who",
    "boy", "did", "man", "use", "data", "users", "company", "security"
  ];
  return common.includes(word.toLowerCase());
}

export async function searchNewsByCompany(companyName: string): Promise<NewsArticle[]> {
  const allNews = await fetchAllNewsFeeds();
  
  return allNews.filter(article => 
    article.title.toLowerCase().includes(companyName.toLowerCase()) ||
    article.summary.toLowerCase().includes(companyName.toLowerCase())
  );
}
