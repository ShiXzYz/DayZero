import { Incident } from "@/types";
import { fetchRecent8KFilings } from "./sec-edgar";
import { fetchAllNewsFeeds } from "./news";

export interface SourceConfig {
  secEdgar: boolean;
  news: boolean;
}

export async function aggregateIncidents(config: Partial<SourceConfig> = {}): Promise<Incident[]> {
  const {
    secEdgar = true,
    news = true,
  } = config;

  const incidents: Incident[] = [];

  const results = await Promise.allSettled([
    secEdgar ? fetchSECIncidents() : Promise.resolve([]),
    news ? fetchNewsIncidents() : Promise.resolve([]),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      incidents.push(...result.value);
    }
  }

  return incidents.sort(
    (a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
  );
}

async function fetchSECIncidents(): Promise<Incident[]> {
  try {
    const filings = await fetchRecent8KFilings();
    
    return filings.map(filing => ({
      id: `sec-${filing.accessionNumber}`,
      companyId: "",
      companyName: filing.companyName,
      companyDomain: `${filing.ticker.toLowerCase()}.com`,
      title: `SEC 8-K Filing: ${filing.companyName}`,
      summary: `${filing.formType} filed on ${filing.filedDate}`,
      description: "Material cybersecurity incident disclosure filed with SEC under new 4-day disclosure rules.",
      severity: determineSeverityFromSEC(filing.content || filing.formType),
      status: "investigating" as const,
      sources: [{
        type: "sec_filing" as const,
        sourceName: "SEC EDGAR",
        url: filing.documentUrl,
        confidence: 0.95,
        discoveredAt: filing.filedDate,
      }],
      exposedData: [],
      breachDate: filing.filedDate,
      discoveredAt: filing.filedDate,
      reportedAt: filing.filedDate,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching SEC incidents:", error);
    return [];
  }
}

function determineSeverityFromSEC(content: string): "Critical" | "High" | "Medium" | "Low" {
  const criticalKeywords = ["ransomware", "material breach", "significant unauthorized", "substantial data"];
  const highKeywords = ["cybersecurity incident", "security breach", "unauthorized access", "data compromise"];
  
  const lowerContent = content.toLowerCase();
  
  if (criticalKeywords.some(k => lowerContent.includes(k))) return "Critical";
  if (highKeywords.some(k => lowerContent.includes(k))) return "High";
  return "Medium";
}

async function fetchNewsIncidents(): Promise<Incident[]> {
  try {
    const articles = await fetchAllNewsFeeds();
    
    return articles.slice(0, 50).map(article => ({
      id: `news-${article.id}`,
      companyId: "",
      companyName: article.relatedCompanies[0] || article.source,
      companyDomain: "",
      title: article.title,
      summary: article.summary,
      description: `${article.source}: ${article.summary}`,
      severity: determineSeverityFromNews(article.summary, article.tags),
      status: "investigating" as const,
      sources: [{
        type: "news" as const,
        sourceName: article.source,
        url: article.url,
        confidence: 0.7,
        discoveredAt: article.publishedAt,
      }],
      exposedData: [{
        category: "other" as const,
        types: article.tags,
      }],
      discoveredAt: article.publishedAt,
      reportedAt: article.publishedAt,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching news incidents:", error);
    return [];
  }
}

function determineSeverityFromNews(summary: string, tags: string[]): "Critical" | "High" | "Medium" | "Low" {
  const criticalTerms = ["ransomware", "million records", "critical", "data exfiltration", "catastrophic"];
  const highTerms = ["breach", "compromised", "unauthorized", "cyberattack", "exposed", "leak"];
  const mediumTerms = ["vulnerability", "incident", "hack", "attack"];

  const lower = (summary + " " + tags.join(" ")).toLowerCase();

  if (criticalTerms.some(t => lower.includes(t))) return "Critical";
  if (highTerms.some(t => lower.includes(t))) return "High";
  if (mediumTerms.some(t => lower.includes(t))) return "Medium";
  return "Low";
}

export function searchIncidentsByCompany(incidents: Incident[], companyName: string): Incident[] {
  const lowerName = companyName.toLowerCase();
  return incidents.filter(
    i =>
      i.companyName.toLowerCase().includes(lowerName) ||
      i.title.toLowerCase().includes(lowerName) ||
      i.summary.toLowerCase().includes(lowerName)
  );
}

export function filterIncidentsBySeverity(incidents: Incident[], severity: string): Incident[] {
  if (severity === "All") return incidents;
  return incidents.filter(i => i.severity === severity);
}

export function getIncidentStats(incidents: Incident[]) {
  return {
    total: incidents.length,
    critical: incidents.filter(i => i.severity === "Critical").length,
    high: incidents.filter(i => i.severity === "High").length,
    medium: incidents.filter(i => i.severity === "Medium").length,
    low: incidents.filter(i => i.severity === "Low").length,
    bySource: {
      sec_filing: incidents.filter(i => i.sources[0]?.type === "sec_filing").length,
      news: incidents.filter(i => i.sources[0]?.type === "news").length,
    },
  };
}
