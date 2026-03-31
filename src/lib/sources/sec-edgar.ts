import { Incident, SECFiling, Severity } from "@/types";

const SEC_EDGAR_BASE = "https://data.sec.gov/submissions";
const COMPANY_TICKER_BASE = "https://www.sec.gov/cgi-bin/browse-edgar";

interface EDGARCompany {
  name: string;
  ticker: string;
  cik: string;
}

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

export async function searchCompanyByTicker(ticker: string): Promise<EDGARCompany | null> {
  try {
    const response = await fetch(
      `${COMPANY_TICKER_BASE}?ticker=${ticker.toUpperCase()}&action=getcompany`,
      {
        headers: {
          "User-Agent": "DayZero App contact@dayzero.app",
          "Accept": "text/html",
        },
      }
    );

    if (!response.ok) return null;

    const html = await response.text();
    const cikMatch = html.match(/CIK=(\d{10})/);
    const nameMatch = html.match(/<span class="companyName">([^<]+)/);

    if (!cikMatch || !nameMatch) return null;

    return {
      name: nameMatch[1].trim(),
      ticker: ticker.toUpperCase(),
      cik: cikMatch[1],
    };
  } catch (error) {
    console.error("Error searching SEC EDGAR:", error);
    return null;
  }
}

export async function getCompanyFilings(cik: string): Promise<EDGARSubmissions | null> {
  try {
    const response = await fetch(
      `${SEC_EDGAR_BASE}/CIK${cik.padStart(10, "0")}.json`,
      {
        headers: {
          "User-Agent": "DayZero App contact@dayzero.app",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Error fetching SEC filings:", error);
    return null;
  }
}

export function parse8KFilings(filings: EDGARSubmissions): SECFiling[] {
  const eightKIndices = filings.filings.recent.form
    .map((form, index) => ({ form, index }))
    .filter(item => item.form === "8-K" || item.form === "8-K/A");

  return eightKIndices.map(item => ({
    accessionNumber: filings.filings.recent.accessionNumber[item.index],
    companyName: filings.name,
    ticker: filings.ticker,
    formType: filings.filings.recent.form[item.index],
    filedDate: filings.filings.recent.filingDate[item.index],
    documentUrl: `https://www.sec.gov/Archives/edgar/full-index/${filings.filings.recent.accessionNumber[item.index].replace("-", "")}/${filings.filings.recent.primaryDocument[item.index]}`,
    items: [],
    content: "",
  }));
}

export function filingToIncident(filing: SECFiling, rawContent?: string): Partial<Incident> {
  const determineSeverity = (content: string): Severity => {
    const criticalKeywords = ["ransomware", "data breach", "unauthorized access", "extraction", "exfiltration", "material breach"];
    const highKeywords = ["cybersecurity incident", "incident response", "security event", "vulnerability"];
    
    const lowerContent = content.toLowerCase();
    
    if (criticalKeywords.some(k => lowerContent.includes(k))) return "Critical";
    if (highKeywords.some(k => lowerContent.includes(k))) return "High";
    return "Medium";
  };

  const content = rawContent || filing.content;
  
  return {
    title: `SEC 8-K Filing: ${filing.companyName}`,
    summary: `${filing.formType} filed on ${filing.filedDate}`,
    description: content || "Material cybersecurity incident disclosure filed with SEC",
    severity: determineSeverity(content),
    status: "investigating",
    sources: [{
      type: "sec_filing",
      sourceName: "SEC EDGAR",
      url: filing.documentUrl,
      confidence: 0.95,
      discoveredAt: filing.filedDate,
    }],
    exposedData: [],
    breachDate: filing.filedDate,
    discoveredAt: filing.filedDate,
    reportedAt: filing.filedDate,
  };
}

export async function fetchRecent8KFilings(_daysBack: number = 7): Promise<SECFiling[]> {
  const allFilings: SECFiling[] = [];
  
  try {
    const response = await fetch(
      "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&count=100",
      {
        headers: {
          "User-Agent": "DayZero App contact@dayzero.app",
          "Accept": "text/html",
        },
      }
    );

    if (!response.ok) return allFilings;

    const html = await response.text();
    const filingRegex = /<a[^>]*href="([^"]*accessionNumber[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    
    let match;
    while ((match = filingRegex.exec(html)) !== null && allFilings.length < 50) {
      const tickerMatch = html.substring(match.index - 500, match.index).match(/ticker=([A-Z]+)/);
      const dateMatch = match[0].match(/(\d{4}-\d{2}-\d{2})/);
      
      if (tickerMatch && dateMatch) {
        allFilings.push({
          accessionNumber: match[1],
          companyName: match[2].trim(),
          ticker: tickerMatch[1],
          formType: "8-K",
          filedDate: dateMatch[1],
          documentUrl: `https://www.sec.gov${match[1]}`,
          items: [],
          content: "",
        });
      }
    }
  } catch (error) {
    console.error("Error fetching recent 8-K filings:", error);
  }

  return allFilings;
}
