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

const DATA_EXPOSURE_PATTERNS: Array<{ pattern: RegExp; text: string }> = [
  { pattern: /password|credential|login/i, text: "Your password may have been exposed" },
  { pattern: /email|personal info/i, text: "Your email and personal information may be at risk" },
  { pattern: /credit card|payment|financial/i, text: "Your payment information could be compromised" },
  { pattern: /ssn|social security/i, text: "Your Social Security Number may have been leaked" },
  { pattern: /medical|health|patient/i, text: "Your medical records may have been exposed" },
  { pattern: /phone|mobile|contact/i, text: "Your phone number and contact info may be leaked" },
  { pattern: /address|home|physical/i, text: "Your home address may have been exposed" },
  { pattern: /driver'?s? license|state id/i, text: "Your ID number may have been compromised" },
  { pattern: /account|user data|customer/i, text: "Your account information could be at risk" },
  { pattern: /bank|account number|routing/i, text: "Your bank account details may be compromised" },
  { pattern: /ip address|ip$|location/i, text: "Your IP address and location may have been tracked" },
  { pattern: /biometric|fingerprint|face id/i, text: "Your biometric data may have been stored insecurely" },
];

const THREAT_TYPE_MAPPING: Array<{ pattern: RegExp; text: string; severity: "Critical" | "High" | "Medium" | "Low" }> = [
  { pattern: /ransomware/i, text: "Ransomware attack - hackers locked company files and demanded payment", severity: "Critical" },
  { pattern: /data breach|massive breach|million records/i, text: "Large-scale data breach affecting millions of users", severity: "Critical" },
  { pattern: /credential stuffing|password spray/i, text: "Automated attack using stolen passwords", severity: "High" },
  { pattern: /phishing|social engineering/i, text: "Phishing scam targeting employees or customers", severity: "High" },
  { pattern: /data leak|information leak/i, text: "Sensitive information was accidentally exposed online", severity: "High" },
  { pattern: /malware|trojan|spyware/i, text: "Malicious software was installed on company systems", severity: "High" },
  { pattern: /api vulnerability|security flaw/i, text: "Security vulnerability could have exposed your data", severity: "Medium" },
  { pattern: /data theft|exfiltration/i, text: "Hackers stole sensitive company data", severity: "High" },
  { pattern: /ddos|denial of service/i, text: "Service outage caused by coordinated attack", severity: "Medium" },
  { pattern: /zero.day|zero-day/i, text: "Newly discovered security flaw being exploited by hackers", severity: "Critical" },
  { pattern: /supply chain|third.party/i, text: "Breach occurred through a partner company", severity: "Medium" },
  { pattern: /insider threat|employee/i, text: "Data was accessed by someone inside the company", severity: "Medium" },
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

  const tagPatterns = [
    { pattern: /ransomware/i, tag: "Ransomware" },
    { pattern: /phishing/i, tag: "Phishing" },
    { pattern: /data breach|breach/i, tag: "Data Breach" },
    { pattern: /credential/i, tag: "Credential Leak" },
    { pattern: /malware/i, tag: "Malware" },
    { pattern: /ddos/i, tag: "DDoS Attack" },
    { pattern: /api|vulnerability/i, tag: "Security Vulnerability" },
    { pattern: /zero.day/i, tag: "Zero-Day Exploit" },
    { pattern: /password/i, tag: "Password Issue" },
    { pattern: /泄露|leak/i, tag: "Data Leak" },
    { pattern: /exposed|exposure/i, tag: "Data Exposure" },
  ];

  for (const { pattern, tag } of tagPatterns) {
    if (pattern.test(lowerText)) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)];
}

function getConsumerFriendlySummary(title: string, content: string): { summary: string; exposedTypes: string[]; threatType: string } {
  const text = title + " " + content;
  const exposedTypes: string[] = [];
  let threatType = "Security incident reported";

  for (const { pattern, text } of DATA_EXPOSURE_PATTERNS) {
    if (pattern.test(text)) {
      exposedTypes.push(text);
    }
  }

  for (const { pattern, text } of THREAT_TYPE_MAPPING) {
    if (pattern.test(text)) {
      threatType = text;
      break;
    }
  }

  let summary = threatType;
  if (exposedTypes.length > 0) {
    summary += ". " + exposedTypes.slice(0, 2).join(". ") + ".";
  }

  return { summary, exposedTypes: exposedTypes.slice(0, 4), threatType };
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
      return items.map(item => {
        const { summary, exposedTypes } = getConsumerFriendlySummary(item.title, item.description);
        
        return {
          id: `${feed.name}-${Buffer.from(item.link || item.title).toString("base64").slice(0, 12)}`,
          title: item.title,
          source: feed.name,
          url: item.link,
          publishedAt: item.pubDate,
          summary: summary,
          relatedCompanies: [] as string[],
          tags: extractTags(item.title + " " + item.description),
          exposedTypes,
        };
      });
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
    description: `${article.source} reports: ${article.summary}`,
    severity,
    status: "investigating",
    sources: [{
      type: "news",
      sourceName: article.source,
      url: article.url,
      confidence: 0.7,
      discoveredAt: article.publishedAt,
    }],
    exposedData: (article.exposedTypes || []).map((type: string) => ({
      category: type.includes("password") ? "credentials" as const :
                type.includes("payment") || type.includes("credit card") ? "financial" as const :
                type.includes("medical") || type.includes("health") ? "medical" as const :
                type.includes("email") || type.includes("contact") ? "personal" as const :
                "other" as const,
      types: [type],
    })),
    discoveredAt: article.publishedAt,
    reportedAt: article.publishedAt,
  };
}

function determineSeverity(summary: string): "Critical" | "High" | "Medium" | "Low" {
  const lower = summary.toLowerCase();

  if (/ransomware|million records|massive|critical|zero.day/.test(lower)) return "Critical";
  if (/breach|compromised|unauthorized|cyberattack|exposed|leaked|stolen/.test(lower)) return "High";
  if (/vulnerability|incident|hack|attack|malware/.test(lower)) return "Medium";
  return "Low";
}

export async function searchNewsByCompany(companyName: string): Promise<NewsArticle[]> {
  const allNews = await fetchAllNewsFeeds();
  
  return allNews.filter(article => 
    article.title.toLowerCase().includes(companyName.toLowerCase()) ||
    article.summary.toLowerCase().includes(companyName.toLowerCase())
  );
}
