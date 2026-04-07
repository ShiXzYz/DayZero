import { Incident, SECFiling, Severity } from "@/types";

const SEC_EDGAR_API = "https://data.sec.gov/submissions";
const SEC_COMPANY_TICKERS = "https://www.sec.gov/files/company_tickers.json";
const SEC_COMPANY_TICKERS_EXCHANGE = "https://www.sec.gov/files/company_tickers_exchange.json";

const USER_AGENT = "DayZero App contact@dayzero.app";

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

interface SECFilingItem {
  accessionNumber: string;
  companyName: string;
  ticker: string;
  formType: string;
  filedDate: string;
  documentUrl: string;
  items: string[];
  content: string;
}

const CYBERSECURITY_KEYWORDS = [
  "cybersecurity", "cyber security", "data breach", "security incident",
  "unauthorized access", "ransomware", "malware", "phishing", "data leak",
  "information security", "privacy incident", "network intrusion",
  "extraction", "exfiltration", "material breach", "incident"
];

const CRITICAL_KEYWORDS = [
  "ransomware", "material breach", "significant unauthorized", "substantial data",
  "data exfiltration", "massive breach", "critical vulnerability"
];

const HIGH_KEYWORDS = [
  "cybersecurity incident", "security breach", "data compromise", 
  "unauthorized access", "privacy incident", "network attack"
];

const KNOWN_CYBERSECURITY_CIKS = [
  { cik: "0000789019", ticker: "MSFT", name: "Microsoft Corporation" },
  { cik: "0000320193", ticker: "AAPL", name: "Apple Inc." },
  { cik: "0001652044", ticker: "GOOGL", name: "Alphabet Inc." },
  { cik: "0001018724", ticker: "AMZN", name: "Amazon.com Inc." },
  { cik: "0001326801", ticker: "META", name: "Meta Platforms Inc." },
  { cik: "0001045810", ticker: "NVDA", name: "NVIDIA Corporation" },
  { cik: "0000837941", ticker: "ORCL", name: "Oracle Corporation" },
  { cik: "0001620289", ticker: "ZM", name: "Zoom Video Communications" },
  { cik: "0001326801", ticker: "COIN", name: "Coinbase Global" },
  { cik: "0001326380", ticker: "UBER", name: "Uber Technologies" },
];

async function fetchWithRetry(url: string, retries = 2): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/json",
        },
      });

      if (response.ok) return response;
      
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      
      return null;
    } catch {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
    }
  }
  return null;
}

export async function getCompanyFilings(cik: string): Promise<EDGARSubmissions | null> {
  try {
    const paddedCik = cik.padStart(10, "0");
    const response = await fetchWithRetry(`${SEC_EDGAR_API}/CIK${paddedCik}.json`);

    if (!response) return null;

    const data = await response.json();
    return {
      cik: data.cik,
      name: data.name,
      ticker: data.ticker || "",
      filings: data.filings,
    };
  } catch (error) {
    console.error("Error fetching SEC filings:", error);
    return null;
  }
}

function parse8KFilings(filings: EDGARSubmissions, daysBack: number = 7): SECFilingItem[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const recentFilings = filings.filings.recent;

  return recentFilings.form
    .map((form, index) => ({
      form,
      index,
      accessionNumber: recentFilings.accessionNumber[index] || "",
      filingDate: recentFilings.filingDate[index] || "",
      primaryDocument: recentFilings.primaryDocument[index] || "",
    }))
    .filter(item => 
      (item.form === "8-K" || item.form === "8-K/A") &&
      new Date(item.filingDate) >= cutoffDate
    )
    .map(item => {
      const accessionClean = item.accessionNumber.replace(/-/g, "");
      const documentUrl = `https://www.sec.gov/Archives/edgar/data/${filings.cik}/${accessionClean}/${item.primaryDocument}`;

      return {
        accessionNumber: item.accessionNumber,
        companyName: filings.name,
        ticker: filings.ticker || "",
        formType: item.form,
        filedDate: item.filingDate,
        documentUrl,
        items: [],
        content: "",
      };
    });
}

function containsCybersecurityKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();
  return CYBERSECURITY_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function determineSeverity(content: string): Severity {
  const lowerContent = content.toLowerCase();
  
  if (CRITICAL_KEYWORDS.some(k => lowerContent.includes(k))) return "Critical";
  if (HIGH_KEYWORDS.some(k => lowerContent.includes(k))) return "High";
  return "Medium";
}

export async function fetchRecent8KFilings(daysBack: number = 14): Promise<SECFiling[]> {
  const allFilings: SECFiling[] = [];

  console.log("Fetching SEC EDGAR 8-K filings...");

  for (const company of KNOWN_CYBERSECURITY_CIKS) {
    try {
      const submissions = await getCompanyFilings(company.cik);
      
      if (!submissions) {
        console.log(`No submissions found for ${company.ticker}`);
        continue;
      }

      const filings = parse8KFilings(submissions, daysBack);
      
      if (filings.length === 0) {
        console.log(`No 8-K filings in last ${daysBack} days for ${company.ticker}`);
        continue;
      }

      for (const filing of filings) {
        const incident: SECFiling = {
          accessionNumber: filing.accessionNumber,
          companyName: filing.companyName || company.name,
          ticker: filing.ticker || company.ticker,
          formType: filing.formType,
          filedDate: filing.filedDate,
          documentUrl: filing.documentUrl,
          items: [],
          content: "",
        };

        allFilings.push(incident);
      }

      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.error(`Error fetching filings for ${company.ticker}:`, error);
    }
  }

  const sorted = allFilings.sort((a, b) => 
    new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime()
  );

  console.log(`Found ${sorted.length} 8-K filings from SEC EDGAR`);
  return sorted;
}

export function isCybersecurityFiling(filing: SECFiling): boolean {
  const searchText = `${filing.companyName} ${filing.formType}`.toLowerCase();
  
  if (containsCybersecurityKeyword(searchText)) {
    return true;
  }

  if (filing.content && containsCybersecurityKeyword(filing.content)) {
    return true;
  }

  return false;
}

export function filingToIncident(filing: SECFiling): Partial<Incident> {
  const isCyber = isCybersecurityFiling(filing);
  
  return {
    title: `${filing.companyName} - SEC ${filing.formType}`,
    summary: isCyber 
      ? "Cybersecurity incident disclosure filed with SEC under new 4-day disclosure rules." 
      : `${filing.formType} filed on ${filing.filedDate}`,
    description: filing.content || `SEC ${filing.formType} filing for ${filing.companyName}. ${filing.formType} filed on ${filing.filedDate}.`,
    severity: determineSeverity(filing.content || filing.formType),
    status: "investigating",
    sources: [{
      type: "sec_filing",
      sourceName: "SEC EDGAR",
      url: filing.documentUrl,
      confidence: isCyber ? 0.95 : 0.7,
      discoveredAt: filing.filedDate,
    }],
    exposedData: [],
    breachDate: filing.filedDate,
    discoveredAt: filing.filedDate,
    reportedAt: filing.filedDate,
  };
}
