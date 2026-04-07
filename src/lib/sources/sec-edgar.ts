import { Incident, SECFiling, Severity } from "@/types";

const SEC_EDGAR_BASE = "https://data.sec.gov/submissions";
const SEC_TICKER_URL = "https://www.sec.gov/files/company_tickers.json";

interface EDGARSubmissions {
  cik: string;
  name: string;
  ticker: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
}

interface SECCompanyRecord {
  cik_str: string;
  ticker: string;
  title: string;
}

const CYBERSECURITY_COMPANIES = [
  "MSFT", "AAPL", "GOOGL", "AMZN", "META", "NVDA", "ORCL", "CSCO", "IBM", "INTC",
  "AVGO", "TXN", "QCOM", "MU", "ADI", "LRCX", "KLAC", "SNPS", "CDNS",
  "PANW", "FTNT", "CRWD", "ZS", "OKTA", "NET"
];

const CYBERSECURITY_KEYWORDS = [
  "cybersecurity", "cyber security", "data breach", "security incident",
  "unauthorized access", "ransomware", "malware", "phishing", "data leak",
  "information security", "privacy incident", "network intrusion", "extraction",
  "exfiltration", "material breach", "confidential information", "credential"
];

const USER_AGENT = "DayZero App contact@dayzero.app";
let tickerLookupCache: Record<string, SECCompanyRecord> | null = null;

async function loadTickerLookup(): Promise<Record<string, SECCompanyRecord>> {
  if (tickerLookupCache) return tickerLookupCache;

  const response = await fetch(SEC_TICKER_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load SEC ticker index: ${response.status}`);
  }

  const rawData = await response.json();
  const values = Array.isArray(rawData)
    ? rawData
    : "data" in rawData
      ? rawData.data
      : Object.values(rawData);

  tickerLookupCache = (values as SECCompanyRecord[]).reduce((map, record) => {
    if (record && record.ticker) {
      map[record.ticker.toUpperCase()] = record;
    }
    return map;
  }, {} as Record<string, SECCompanyRecord>);

  return tickerLookupCache;
}

async function getCompanyByTicker(ticker: string): Promise<{ name: string; cik: string } | null> {
  try {
    const lookup = await loadTickerLookup();
    const normalizedTicker = ticker.trim().toUpperCase();
    const record = lookup[normalizedTicker];

    if (!record) {
      return null;
    }

    return {
      name: record.title,
      cik: record.cik_str,
    };
  } catch (error) {
    console.error("Error resolving ticker to CIK:", error);
    return null;
  }
}

export async function getCompanyFilings(cik: string): Promise<EDGARSubmissions | null> {
  try {
    const paddedCik = cik.padStart(10, "0");
    const response = await fetch(`${SEC_EDGAR_BASE}/CIK${paddedCik}.json`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Error fetching SEC filings:", error);
    return null;
  }
}

async function fetchFilingDocument(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml,text/plain",
      },
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch (error) {
    console.error("Error fetching filing document:", error);
    return "";
  }
}

function buildEdgarDocumentUrl(cik: string, accessionNumber: string, primaryDoc: string): string {
  const accessionClean = accessionNumber.replace(/-/g, "");
  const cikNumeric = String(parseInt(cik, 10));
  return `https://www.sec.gov/Archives/edgar/data/${cikNumeric}/${accessionClean}/${primaryDoc}`;
}

export function parse8KFilings(filings: EDGARSubmissions, daysBack: number = 7): SECFiling[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return filings.filings.recent.form
    .map((form, index) => ({ form, index }))
    .filter(item => item.form === "8-K" || item.form === "8-K/A")
    .filter(item => {
      const filingDate = new Date(filings.filings.recent.filingDate[item.index]);
      return filingDate >= cutoffDate;
    })
    .map(item => {
      const accessionNumber = filings.filings.recent.accessionNumber[item.index];
      const primaryDoc = filings.filings.recent.primaryDocument[item.index] || "";

      return {
        accessionNumber,
        companyName: filings.name,
        ticker: filings.ticker,
        formType: item.form,
        filedDate: filings.filings.recent.filingDate[item.index],
        documentUrl: buildEdgarDocumentUrl(filings.cik, accessionNumber, primaryDoc),
        items: [],
        content: "",
      };
    });
}

export async function fetchRecent8KFilings(daysBack: number = 7): Promise<SECFiling[]> {
  const allFilings: SECFiling[] = [];

  for (const ticker of CYBERSECURITY_COMPANIES) {
    try {
      const company = await getCompanyByTicker(ticker);
      if (!company) {
        continue;
      }

      const submissions = await getCompanyFilings(company.cik);
      if (!submissions) {
        continue;
      }

      const filings = parse8KFilings(submissions, daysBack);
      if (filings.length === 0) {
        continue;
      }

      for (const filing of filings) {
        filing.content = await fetchFilingDocument(filing.documentUrl);
      }

      const cybersecurityFilings = filings.filter(isCybersecurityFiling);
      allFilings.push(...cybersecurityFilings);
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) {
      console.error(`Error fetching filings for ${ticker}:`, error);
    }
  }

  return allFilings.sort((a, b) => 
    new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime()
  );
}

export function isCybersecurityFiling(filing: SECFiling): boolean {
  const searchText = `${filing.companyName} ${filing.formType} ${filing.accessionNumber} ${filing.content}`.toLowerCase();
  return CYBERSECURITY_KEYWORDS.some(keyword => searchText.includes(keyword));
}

export function filingToIncident(filing: SECFiling, rawContent?: string): Partial<Incident> {
  const determineSeverity = (content: string): Severity => {
    const criticalKeywords = ["ransomware", "data breach", "unauthorized access", "extraction", "exfiltration", "material breach", "substantial data", "significant unauthorized"];
    const highKeywords = ["cybersecurity incident", "incident response", "security event", "vulnerability", "data compromise", "privacy incident"];

    const lowerContent = content.toLowerCase();

    if (criticalKeywords.some(k => lowerContent.includes(k))) return "Critical";
    if (highKeywords.some(k => lowerContent.includes(k))) return "High";
    return "Medium";
  };

  const content = rawContent || filing.content;
  const isCyberFiling = isCybersecurityFiling(filing);

  return {
    title: `${filing.companyName} - SEC ${filing.formType}`,
    summary: isCyberFiling 
      ? "Cybersecurity incident disclosure filed with SEC" 
      : `${filing.formType} filed on ${filing.filedDate}`,
    description: content || (isCyberFiling 
      ? "Material cybersecurity incident disclosure filed with SEC under new 4-day disclosure rules."
      : "SEC filing detected for this company."),
    severity: isCyberFiling ? determineSeverity(content) : "Medium",
    status: "investigating",
    sources: [{
      type: "sec_filing" as const,
      sourceName: "SEC EDGAR",
      url: filing.documentUrl,
      confidence: isCyberFiling ? 0.95 : 0.6,
      discoveredAt: filing.filedDate,
    }],
    exposedData: [],
    breachDate: filing.filedDate,
    discoveredAt: filing.filedDate,
    reportedAt: filing.filedDate,
  };
}
