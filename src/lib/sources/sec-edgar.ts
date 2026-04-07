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

const CRITICAL_KEYWORDS = [
  "ransomware", "material breach", "significant unauthorized", "substantial data",
  "data exfiltration", "massive breach", "critical vulnerability"
];

const HIGH_KEYWORDS = [
  "cybersecurity incident", "security breach", "data compromise", 
  "unauthorized access", "privacy incident", "network attack"
];

const KNOWN_CIKs = [
  { cik: "0001652044", ticker: "GOOGL", name: "Alphabet Inc." },
  { cik: "0001326380", ticker: "UBER", name: "Uber Technologies" },
  { cik: "0001018724", ticker: "AMZN", name: "Amazon.com Inc." },
  { cik: "0000789019", ticker: "MSFT", name: "Microsoft Corporation" },
  { cik: "0000320193", ticker: "AAPL", name: "Apple Inc." },
  { cik: "0001326801", ticker: "META", name: "Meta Platforms Inc." },
  { cik: "0001045810", ticker: "NVDA", name: "NVIDIA Corporation" },
];

const CYBERSECURITY_KEYWORDS = [
  "cybersecurity", "cyber security", "data breach", "security incident",
  "unauthorized access", "ransomware", "malware", "phishing", "data leak",
  "information security", "privacy incident", "network intrusion",
  "extraction", "exfiltration", "material breach", "incident"
];

const DATA_EXPOSURE_MAPPING: Record<string, string[]> = {
  "credentials": ["Your login password", "Your account password", "Password"],
  "personal": ["Your name", "Your personal information", "Your home address"],
  "financial": ["Your credit card number", "Your bank account", "Your payment info"],
  "medical": ["Your medical records", "Your health information", "Your prescription history"],
  "phone": ["Your phone number", "Your mobile number"],
  "email": ["Your email address", "Your contact information"],
  "ssn": ["Your Social Security Number", "Your SSN"],
  "drivers_license": ["Your driver's license number", "Your ID number"],
  "passport": ["Your passport number", "Your travel document"],
};

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

function getConsumerFriendlySummary(companyName: string, content: string): { summary: string; exposedTypes: string[] } {
  const lowerContent = content.toLowerCase();
  const exposedTypes: string[] = [];

  if (lowerContent.includes("credential") || lowerContent.includes("password") || lowerContent.includes("login")) {
    exposedTypes.push("Your password may have been exposed");
  }
  if (lowerContent.includes("email") || lowerContent.includes("personal information")) {
    exposedTypes.push("Your email and personal info may have been accessed");
  }
  if (lowerContent.includes("credit card") || lowerContent.includes("payment") || lowerContent.includes("financial")) {
    exposedTypes.push("Your payment information may be at risk");
  }
  if (lowerContent.includes("ssn") || lowerContent.includes("social security")) {
    exposedTypes.push("Your Social Security Number may have been compromised");
  }
  if (lowerContent.includes("medical") || lowerContent.includes("health")) {
    exposedTypes.push("Your medical records may have been exposed");
  }
  if (lowerContent.includes("address") || lowerContent.includes("phone")) {
    exposedTypes.push("Your contact details may have been leaked");
  }
  if (lowerContent.includes("ransomware")) {
    exposedTypes.push("Ransomware attack - company systems were locked");
  }

  if (exposedTypes.length === 0) {
    exposedTypes.push("Material event disclosure filed with SEC");
  }

  const summary = exposedTypes.slice(0, 3).join(". ") + ".";

  return { summary, exposedTypes };
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

      for (const filing of filings) {
        const incident: SECFiling = {
          accessionNumber: filing.accessionNumber,
          companyName: filing.companyName || company.name,
          ticker: filing.ticker || company.ticker,
          formType: filing.formType,
          filedDate: filing.filedDate,
          documentUrl: filing.documentUrl,
          items: [],
          content: filing.content,
        };

        allFilings.push(incident);
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

export function isCybersecurityFiling(filing: SECFiling): boolean {
  const searchText = `${filing.companyName} ${filing.formType} ${filing.content}`.toLowerCase();
  return containsCybersecurityKeyword(searchText);
}

export function filingToIncident(filing: SECFiling): Partial<Incident> {
  const isCyber = isCybersecurityFiling(filing);
  const { summary: consumerSummary, exposedTypes } = getConsumerFriendlySummary(filing.companyName, filing.content);
  
  const exposedData = exposedTypes.map(type => ({
    category: type.includes("password") ? "credentials" as const :
              type.includes("payment") || type.includes("credit card") ? "financial" as const :
              type.includes("medical") || type.includes("health") ? "medical" as const :
              type.includes("email") || type.includes("contact") ? "personal" as const :
              "other" as const,
    types: [type],
  }));

  return {
    title: `${filing.companyName} - ${isCyber ? "Security Incident" : "SEC Filing"}`,
    summary: consumerSummary,
    description: `SEC ${filing.formType} filed on ${filing.filedDate}. ${consumerSummary}`,
    severity: determineSeverity(filing.content || filing.formType),
    status: "investigating",
    sources: [{
      type: "sec_filing",
      sourceName: "SEC EDGAR",
      url: filing.documentUrl,
      confidence: isCyber ? 0.95 : 0.7,
      discoveredAt: filing.filedDate,
    }],
    exposedData,
    breachDate: filing.filedDate,
    discoveredAt: filing.filedDate,
    reportedAt: filing.filedDate,
  };
}
