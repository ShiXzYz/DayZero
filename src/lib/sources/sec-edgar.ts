import { Incident, SECFiling, Severity } from "@/types";

const SEC_EDGAR_BASE = "https://data.sec.gov/submissions";

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

const CYBERSECURITY_COMPANIES = [
  "msft", "aapl", "googl", "amzn", "meta", "nvda", "orcl", "csco", "ibm", "intc",
  "avgo", "txn", "qcom", "mu", "adi", "lrcx", "klac", "mntq", "snps", "cdns",
  "panw", "ftnt", "crwd", "zs", "okta", "net", "crowdstrike"
];

const CYBERSECURITY_KEYWORDS = [
  "cybersecurity", "cyber security", "data breach", "security incident",
  "unauthorized access", "ransomware", "malware", "phishing", "data leak",
  "information security", "privacy incident", "network intrusion", "extraction",
  "exfiltration", "material breach", "confidential information", "credential"
];

const USER_AGENT = "DayZero App contact@dayzero.app";

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

export async function searchCompanyByTicker(ticker: string): Promise<{ name: string; cik: string } | null> {
  try {
    const response = await fetch(
      `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker=${ticker.toUpperCase()}&output=atom`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/xml",
        },
      }
    );

    if (!response.ok) return null;

    const xml = await response.text();
    const cikMatch = xml.match(/<cik>(\d+)<\/cik>/);
    const nameMatch = xml.match(/<companyName>([^<]+)<\/companyName>/);

    if (!cikMatch || !nameMatch) return null;

    return {
      name: nameMatch[1],
      cik: cikMatch[1],
    };
  } catch (error) {
    console.error("Error searching SEC EDGAR:", error);
    return null;
  }
}

export function parse8KFilings(filings: EDGARSubmissions, daysBack: number = 7): SECFiling[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const eightKIndices = filings.filings.recent.form
    .map((form, index) => ({ form, index }))
    .filter(item => item.form === "8-K" || item.form === "8-K/A");

  return eightKIndices
    .filter(item => {
      const filingDate = new Date(filings.filings.recent.filingDate[item.index]);
      return filingDate >= cutoffDate;
    })
    .map(item => {
      const accessionNumber = filings.filings.recent.accessionNumber[item.index];
      const accessionClean = accessionNumber.replace(/-/g, "");
      const primaryDoc = filings.filings.recent.primaryDocument[item.index];

      return {
        accessionNumber,
        companyName: filings.name,
        ticker: filings.ticker,
        formType: filings.filings.recent.form[item.index],
        filedDate: filings.filings.recent.filingDate[item.index],
        documentUrl: `https://www.sec.gov/Archives/edgar/data/${parseInt(filings.cik, 10)}/${accessionClean}/${primaryDoc}`,
        items: [],
        content: "",
      };
    });
}

export async function fetchRecent8KFilings(daysBack: number = 7): Promise<SECFiling[]> {
  const allFilings: SECFiling[] = [];
  
  for (const ticker of CYBERSECURITY_COMPANIES.slice(0, 15)) {
    try {
      const company = await searchCompanyByTicker(ticker);
      if (!company) continue;

      const submissions = await getCompanyFilings(company.cik);
      if (!submissions) continue;

      const filings = parse8KFilings(submissions, daysBack);
      allFilings.push(...filings);

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
  const searchText = `${filing.companyName} ${filing.formType} ${filing.accessionNumber}`.toLowerCase();
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
