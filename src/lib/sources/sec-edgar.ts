import { Incident, SECFiling, Severity } from "@/types";

const SEC_EDGAR_API = "https://data.sec.gov/submissions";
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

const KNOWN_CIKs = [
  { cik: "0001652044", ticker: "GOOGL", name: "Alphabet Inc." },
  { cik: "0001326380", ticker: "UBER", name: "Uber Technologies" },
  { cik: "0001018724", ticker: "AMZN", name: "Amazon.com Inc." },
  { cik: "0000789019", ticker: "MSFT", name: "Microsoft Corporation" },
  { cik: "0000320193", ticker: "AAPL", name: "Apple Inc." },
  { cik: "0001326801", ticker: "META", name: "Meta Platforms Inc." },
  { cik: "0001045810", ticker: "NVDA", name: "NVIDIA Corporation" },
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

async function fetchFilingContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return "";

    const html = await response.text();
    return stripHtml(html);
  } catch {
    return "";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function getCompanyFilings(cik: string): Promise<EDGARSubmissions | null> {
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

function parse8KFilings(filings: EDGARSubmissions, daysBack: number = 30): SECFiling[] {
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

function analyzeFilingContent(content: string): { 
  severity: Severity; 
  exposedTypes: string[];
  summary: string;
  threatType: string;
} {
  const lowerContent = content.toLowerCase();
  
  const exposedTypes: string[] = [];
  let severity: Severity = "Medium";
  let threatType = "Material event disclosure filed with SEC";

  if (/ransomware|ransom|extortion/i.test(lowerContent)) {
    threatType = "Ransomware attack reported";
    exposedTypes.push("Company systems may have been locked");
    severity = "Critical";
  }

  if (/data breach|breach of|data was|information was|records were/i.test(lowerContent)) {
    if (!exposedTypes.includes("Company systems may have been locked")) {
      exposedTypes.push("Sensitive company data may have been accessed");
    }
    threatType = "Data breach incident reported";
    severity = "High";
  }

  if (/password|credential|login|authentication/i.test(lowerContent)) {
    exposedTypes.push("Your password or login credentials may be at risk");
  }

  if (/personal information|personally identifiable|pii|email address|phone number/i.test(lowerContent)) {
    exposedTypes.push("Your personal information may have been exposed");
  }

  if (/financial|payment card|credit card|bank account/i.test(lowerContent)) {
    exposedTypes.push("Your payment or financial information may be compromised");
  }

  if (/customer|customer data|user data|client data/i.test(lowerContent)) {
    exposedTypes.push("Customer accounts and data may be affected");
  }

  if (/employee|staff|personnel/i.test(lowerContent)) {
    exposedTypes.push("Employee information may have been accessed");
  }

  if (/cybersecurity|cybersecurity incident|security incident|cyber event/i.test(lowerContent)) {
    if (severity === "Medium") severity = "High";
    threatType = "Cybersecurity incident disclosed";
    if (!exposedTypes.includes("Company systems may have been locked")) {
      exposedTypes.push("Company computer systems were potentially compromised");
    }
  }

  if (/unauthorized|unauthorised|access without|without authorization/i.test(lowerContent)) {
    exposedTypes.push("Unauthorized access to company systems occurred");
    if (severity !== "Critical") severity = "High";
  }

  if (/material adverse|material effect|significant impact/i.test(lowerContent)) {
    threatType = "Material event with significant business impact";
    severity = severity === "Medium" ? "High" : severity;
  }

  let summary = threatType;
  if (exposedTypes.length > 0) {
    summary += ". " + exposedTypes.slice(0, 3).join(". ") + ".";
  } else {
    summary += ". This filing discloses a material event that may affect the company.";
  }

  return { severity, exposedTypes, summary, threatType };
}

export async function fetchRecent8KFilings(daysBack: number = 30): Promise<SECFiling[]> {
  const allFilings: SECFiling[] = [];

  console.log("Fetching SEC EDGAR 8-K filings...");

  for (const company of KNOWN_CIKs) {
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

      console.log(`Found ${filings.length} 8-K filings for ${company.ticker}`);

      for (const filing of filings) {
        const content = await fetchFilingContent(filing.documentUrl);
        filing.content = content;
        allFilings.push(filing);
      }

      await new Promise(r => setTimeout(r, 250));
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

export function filingToIncident(filing: SECFiling): Partial<Incident> {
  const { severity, exposedTypes, summary } = analyzeFilingContent(filing.content);
  
  const exposedData = exposedTypes.map(type => ({
    category: type.includes("password") || type.includes("login") || type.includes("credential") ? "credentials" as const :
              type.includes("payment") || type.includes("financial") || type.includes("credit card") ? "financial" as const :
              type.includes("medical") || type.includes("health") ? "medical" as const :
              type.includes("personal") || type.includes("email") || type.includes("phone") ? "personal" as const :
              type.includes("customer") || type.includes("user") ? "other" as const :
              "other" as const,
    types: [type],
  }));

  return {
    title: `${filing.companyName} - ${severity === "Critical" || severity === "High" ? "Security Incident" : "Material Filing"}`,
    summary,
    description: `SEC ${filing.formType} filed on ${filing.filedDate}. ${summary}`,
    severity,
    status: "investigating",
    sources: [{
      type: "sec_filing",
      sourceName: "SEC EDGAR",
      url: filing.documentUrl,
      confidence: severity === "Critical" || severity === "High" ? 0.95 : 0.7,
      discoveredAt: filing.filedDate,
    }],
    exposedData,
    breachDate: filing.filedDate,
    discoveredAt: filing.filedDate,
    reportedAt: filing.filedDate,
  };
}
