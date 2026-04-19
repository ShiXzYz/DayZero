import { Incident } from "@/types";
import { fetchRecent8KFilings, filingToIncident } from "./sec-edgar";
import { fetchAllNewsFeeds } from "./news";
import { getCachedIncidents, setCachedIncidents } from "@/lib/cache/incidents";
import { getSupabaseClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export interface RiskScore {
  overall: number;
  severity: number;
  dataExposure: number;
  reach: number;
  recency: number;
  label: "Critical" | "High" | "Medium" | "Low";
}

export function calculateRiskScore(incident: Partial<Incident>): RiskScore {
  let severity = 0;
  let dataExposure = 0;
  let reach = 0;
  let recency = 0;

  switch (incident.severity) {
    case "Critical": severity = 40; break;
    case "High": severity = 30; break;
    case "Medium": severity = 15; break;
    case "Low": severity = 5; break;
    default: severity = 10;
  }

  const exposed = incident.exposedData || [];
  const exposedCategories = exposed.map(e => e.category);
  const exposedTypes = exposed.flatMap(e => e.types);
  
  if (exposedCategories.includes("credentials")) dataExposure += 25;
  if (exposedCategories.includes("financial")) dataExposure += 25;
  if (exposedCategories.includes("medical")) dataExposure += 20;
  if (exposedTypes.some(t => t.toLowerCase().includes("ssn") || t.toLowerCase().includes("social security"))) dataExposure += 30;
  if (exposedCategories.includes("personal")) dataExposure += 15;

  if (incident.sources?.[0]?.type === "sec_filing") reach += 15;
  
  const companyName = incident.companyName?.toLowerCase() || "";
  const bigTech = ["microsoft", "apple", "google", "amazon", "meta", "facebook", "tesla", "nvidia", "uber", "netflix"];
  if (bigTech.some(t => companyName.includes(t))) reach += 10;

  const discoveredAt = incident.discoveredAt ? new Date(incident.discoveredAt).getTime() : Date.now();
  const daysSince = (Date.now() - discoveredAt) / (1000 * 60 * 60 * 24);
  
  if (daysSince < 1) recency = 20;
  else if (daysSince < 7) recency = 15;
  else if (daysSince < 30) recency = 10;
  else recency = 5;

  const overall = Math.min(100, severity + dataExposure + reach + recency);

  let label: RiskScore["label"];
  if (overall >= 75) label = "Critical";
  else if (overall >= 50) label = "High";
  else if (overall >= 25) label = "Medium";
  else label = "Low";

  return { overall, severity, dataExposure, reach, recency, label };
}

export interface SourceConfig {
  secEdgar: boolean;
  news: boolean;
}

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "mock-1",
    companyId: "",
    companyName: "TechCorp Inc.",
    companyDomain: "techcorp.com",
    title: "Data Breach Affects 2.5 Million Users",
    summary: "TechCorp Inc. disclosed a data breach affecting approximately 2.5 million users. The breach exposed names, email addresses, and hashed passwords.",
    description: "TechCorp Inc. filed an 8-K with the SEC disclosing a material cybersecurity incident. The company discovered unauthorized access to user data on March 28, 2026.",
    severity: "High",
    status: "investigating",
    sources: [{
      type: "sec_filing",
      sourceName: "Demo SEC Filing",
      url: "https://www.sec.gov/edgar/search/",
      confidence: 0.95,
      discoveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    }],
    exposedData: [
      { category: "credentials", types: ["Email Addresses", "Password Hashes"] },
      { category: "personal", types: ["Names"] },
    ],
    discoveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-2",
    companyId: "",
    companyName: "GlobalBank",
    companyDomain: "globalbank.com",
    title: "Ransomware Attack Disrupts Operations",
    summary: "GlobalBank experienced a ransomware attack that disrupted banking operations across 12 states. No customer data was confirmed compromised.",
    description: "GlobalBank disclosed a ransomware incident that affected internal systems. The attack was detected on April 1, 2026, and the company is working with cybersecurity firms to restore systems.",
    severity: "Critical",
    status: "investigating",
    sources: [{
      type: "news",
      sourceName: "BleepingComputer",
      url: "https://www.bleepingcomputer.com/news/security/",
      confidence: 0.85,
      discoveredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    }],
    exposedData: [],
    discoveredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-3",
    companyId: "",
    companyName: "HealthFirst Medical",
    companyDomain: "healthfirst.com",
    title: "Patient Data Exposed in Third-Party Breach",
    summary: "HealthFirst Medical notified patients that their data may have been exposed through a breach at a third-party billing vendor.",
    description: "HealthFirst Medical discovered that a security incident at their billing processing vendor may have exposed patient names, dates of birth, and insurance information for approximately 450,000 patients.",
    severity: "High",
    status: "investigating",
    sources: [{
      type: "news",
      sourceName: "DataBreaches.net",
      url: "https://www.databreaches.net/",
      confidence: 0.8,
      discoveredAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    }],
    exposedData: [
      { category: "personal", types: ["Names", "Dates of Birth"] },
      { category: "medical", types: ["Insurance Information"] },
    ],
    discoveredAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-4",
    companyId: "",
    companyName: "CloudServe",
    companyDomain: "cloudserve.io",
    title: "API Vulnerability Exposed Customer Data",
    summary: "CloudServe patched a critical API vulnerability that could have allowed attackers to access customer data without authentication.",
    description: "A security researcher discovered and responsibly disclosed an API vulnerability in CloudServe's platform that could have exposed sensitive customer information. The company patched the vulnerability within 24 hours of notification.",
    severity: "Medium",
    status: "resolved",
    sources: [{
      type: "news",
      sourceName: "The Hacker News",
      url: "https://thehackernews.com/",
      confidence: 0.9,
      discoveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }],
    exposedData: [
      { category: "corporate", types: ["API Keys", "Customer Data"] },
    ],
    discoveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-5",
    companyId: "",
    companyName: "RetailMax",
    companyDomain: "retailmax.com",
    title: "POS Malware Found at 50 Store Locations",
    summary: "RetailMax discovered point-of-sale malware at 50 store locations. Payment card data may have been compromised over a 3-month period.",
    description: "RetailMax disclosed that their security team discovered POS malware at 50 store locations. The malware was active from January to March 2026, potentially capturing payment card data.",
    severity: "Critical",
    status: "investigating",
    sources: [{
      type: "sec_filing",
      sourceName: "Demo SEC Filing",
      url: "https://www.sec.gov/edgar/search/",
      confidence: 0.95,
      discoveredAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    }],
    exposedData: [
      { category: "financial", types: ["Payment Card Numbers", "CVV Codes"] },
      { category: "personal", types: ["Names"] },
    ],
    breachDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    reportedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

export interface AggregationResult {
  incidents: Incident[];
  isMockData: boolean;
  sourceErrors: string[];
}

// How old DB incidents can be before we background-refresh (15 minutes)
const DB_STALE_MS = 15 * 60 * 1000;

async function fetchFromDatabase(): Promise<Incident[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("discovered_at", { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) return null;

    return data.map(row => ({
      id: row.id,
      companyId: row.company_id || "",
      companyName: row.company_name,
      companyDomain: row.company_domain || "",
      title: row.title,
      summary: row.summary,
      description: row.description,
      severity: row.severity,
      status: row.status,
      sources: row.sources || [],
      exposedData: row.exposed_data || [],
      breachDate: row.breach_date,
      discoveredAt: row.discovered_at,
      reportedAt: row.discovered_at,
      updatedAt: row.updated_at || row.discovered_at,
      riskScore: calculateRiskScore({ severity: row.severity, exposedData: row.exposed_data || [], sources: row.sources || [], discoveredAt: row.discovered_at }),
    }));
  } catch {
    return null;
  }
}

async function writeToDatabase(incidents: Incident[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || incidents.length === 0) return;

  try {
    // Fetch all existing titles in one query instead of N individual lookups
    const { data: existing } = await supabase
      .from("incidents")
      .select("title")
      .in("title", incidents.slice(0, 50).map(i => i.title));

    const existingTitles = new Set((existing || []).map((r: { title: string }) => r.title));
    const newIncidents = incidents.slice(0, 50).filter(i => !existingTitles.has(i.title));

    if (newIncidents.length === 0) return;

    // Batch insert instead of one-by-one
    await supabase.from("incidents").insert(
      newIncidents.map(incident => ({
        id: uuidv4(),
        company_id: incident.companyId || null,
        company_name: incident.companyName,
        company_domain: incident.companyDomain,
        title: incident.title,
        summary: incident.summary,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        sources: incident.sources,
        exposed_data: incident.exposedData,
        discovered_at: incident.discoveredAt,
        breach_date: incident.breachDate || null,
      }))
    );
  } catch (dbError) {
    console.error("Error writing to Supabase:", dbError);
  }
}

export async function aggregateIncidents(config: Partial<SourceConfig> = {}): Promise<AggregationResult> {
  const { secEdgar = true, news = true } = config;

  // 1. Return in-memory cache immediately if fresh
  const cached = getCachedIncidents();
  if (cached && cached.length > 0) {
    return { incidents: cached, isMockData: false, sourceErrors: [] };
  }

  // 2. Return from DB instantly, then kick off a background refresh if stale
  const dbIncidents = await fetchFromDatabase();
  if (dbIncidents && dbIncidents.length > 0) {
    setCachedIncidents(dbIncidents);

    // Check if oldest fetched record is stale — if so, refresh in background
    const oldest = dbIncidents.reduce((min, i) =>
      new Date(i.discoveredAt).getTime() < new Date(min.discoveredAt).getTime() ? i : min
    );
    const isStale = Date.now() - new Date(oldest.discoveredAt).getTime() > DB_STALE_MS;

    if (isStale) {
      // Fire-and-forget: don't await, user already has data
      refreshIncidentsInBackground({ secEdgar, news }).catch(err =>
        console.error("Background refresh failed:", err)
      );
    }

    return { incidents: dbIncidents, isMockData: false, sourceErrors: [] };
  }

  // 3. Cold start — no DB data yet, fetch live
  return refreshIncidentsInBackground({ secEdgar, news });
}

async function refreshIncidentsInBackground(config: { secEdgar: boolean; news: boolean }): Promise<AggregationResult> {
  const incidents: Incident[] = [];
  const sourceErrors: string[] = [];

  const results = await Promise.allSettled([
    config.secEdgar ? fetchSECIncidents() : Promise.resolve([]),
    config.news ? fetchNewsIncidents() : Promise.resolve([]),
  ]);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      incidents.push(...result.value);
    } else {
      sourceErrors.push(`Source ${i === 0 ? "SEC EDGAR" : "News"} failed: ${result.reason}`);
    }
  }

  if (incidents.length === 0) {
    return { incidents: MOCK_INCIDENTS, isMockData: true, sourceErrors: ["No live data available. Showing demo incidents."] };
  }

  const incidentsWithRisk = incidents.map(incident => ({
    ...incident,
    riskScore: calculateRiskScore(incident),
  })).sort((a, b) => (b.riskScore?.overall || 0) - (a.riskScore?.overall || 0));

  setCachedIncidents(incidentsWithRisk);
  writeToDatabase(incidentsWithRisk).catch(err => console.error("DB write failed:", err));

  return { incidents: incidentsWithRisk, isMockData: false, sourceErrors };
}

async function fetchSECIncidents(): Promise<Incident[]> {
  try {
    console.log("Fetching SEC 8-K filings...");
    
    const filings = await fetchRecent8KFilings(30);

    console.log(`Found ${filings.length} 8-K filings from SEC EDGAR`);
    
    if (filings.length === 0) {
      console.warn("No 8-K filings found in the last 30 days.");
      return [];
    }
    
    return filings.map(filing => {
      const incident = filingToIncident(filing);
      return {
        id: `sec-${filing.accessionNumber}`,
        companyId: "",
        companyName: filing.companyName,
        companyDomain: `${filing.ticker.toLowerCase()}.com`,
        title: incident.title!,
        summary: incident.summary!,
        description: incident.description!,
        severity: incident.severity!,
        status: incident.status!,
        sources: incident.sources!,
        exposedData: incident.exposedData!,
        breachDate: filing.filedDate,
        discoveredAt: filing.filedDate,
        reportedAt: filing.filedDate,
        updatedAt: new Date().toISOString(),
      } as Incident;
    });
  } catch (error) {
    console.error("Error fetching SEC incidents:", error);
    throw error;
  }
}

async function fetchNewsIncidents(): Promise<Incident[]> {
  try {
    const articles = await fetchAllNewsFeeds();
    
    return articles.slice(0, 50).map(article => ({
      id: article.id,
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
      exposedData: (article.exposedTypes || article.tags).map((type: string) => ({
        category: type.includes("password") || type.includes("credential") ? "credentials" as const :
                  type.includes("payment") || type.includes("financial") || type.includes("credit card") ? "financial" as const :
                  type.includes("medical") || type.includes("health") ? "medical" as const :
                  type.includes("personal") || type.includes("email") || type.includes("contact") ? "personal" as const :
                  "other" as const,
        types: [type],
      })),
      discoveredAt: article.publishedAt,
      reportedAt: article.publishedAt,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching news incidents:", error);
    throw error;
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
