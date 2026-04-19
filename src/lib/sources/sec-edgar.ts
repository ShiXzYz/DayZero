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
    // Named entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    // Numeric decimal entities (e.g. &#8220; &#160;)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    // Numeric hex entities (e.g. &#x201C;)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
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

// Priority-ordered patterns: first match wins for severity + category label
const THREAT_PATTERNS: { regex: RegExp; severity: Severity; label: string }[] = [
  { regex: /ransomware|ransom demand|extortion/i, severity: "Critical", label: "ransomware" },
  { regex: /data breach|unauthorized access|systems were compromised|network was compromised/i, severity: "High", label: "breach" },
  { regex: /cybersecurity incident|cyber attack|cyber event|security incident/i, severity: "High", label: "cyber incident" },
  { regex: /unauthorized|unauthorised/i, severity: "High", label: "unauthorized access" },
  { regex: /malware|phishing|intrusion/i, severity: "High", label: "malware" },
  { regex: /material adverse|material effect|significant impact/i, severity: "Medium", label: "material impact" },
];

const EXPOSED_DATA_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /password|credential|login|authentication/i, label: "credentials" },
  { regex: /personal information|personally identifiable|pii|email address|phone number/i, label: "personal information" },
  { regex: /payment card|credit card|debit card|bank account|financial information/i, label: "financial data" },
  { regex: /medical|health record|patient/i, label: "medical records" },
  { regex: /social security|ssn/i, label: "SSNs" },
  { regex: /employee|personnel|staff record/i, label: "employee records" },
  { regex: /customer data|user data|client data/i, label: "customer data" },
];

// Boilerplate patterns found in SEC form headers/footers — skip any sentence matching these
const BOILERPLATE_PATTERNS = [
  /emerging growth company/i,
  /smaller reporting company/i,
  /accelerated filer/i,
  /check mark/i,
  /exchange act/i,
  /section \d+\([a-z]\)/i,
  /transition period/i,
  /pursuant to/i,
  /incorporated by reference/i,
  /form 8-k/i,
  /commission file/i,
  /state of incorporation/i,
  /internal revenue/i,
  /registrant/i,
  /dated:/i,
  /by:\s*\/s\//i,
  /vice president/i,
  /general counsel/i,
  /chief (executive|financial|legal|operating)/i,
  /^\s*item\s+\d+\.\d+\s*$/i,
  /departure of directors/i,
  /election of directors/i,
  /compensatory arrangements/i,
  /^[\s\d\.\-\/]+$/,
];

function isBoilerplate(sentence: string): boolean {
  return BOILERPLATE_PATTERNS.some(re => re.test(sentence));
}

/**
 * Extract the most relevant 1-2 sentences from the filing text.
 * Finds the Item section body text, skips all boilerplate, and scores
 * remaining sentences by security/event relevance.
 */
function extractKeySentences(content: string, maxSentences: number = 2): string {
  // Try to jump straight to the Item body — find the first Item X.XX header
  // and grab text after it (up to 6000 chars from that point)
  const itemMatch = content.match(/item\s+\d+\.\d+[^\n]{0,80}\n?([\s\S]{200,6000})/i);
  const chunk = itemMatch ? itemMatch[1] : content.slice(0, 8000);

  // Split on sentence-ending punctuation followed by whitespace + capital letter
  const sentences = chunk
    .split(/(?<=[.!?])\s+(?=[A-Z"(])/)
    .map(s => s.replace(/\s+/g, " ").trim())
    .filter(s => s.length > 50 && s.length < 700 && !isBoilerplate(s));

  if (sentences.length === 0) return "";

  const SCORE_TERMS = [
    /cybersecurity|cyber/i,
    /breach|unauthorized|intrusion|incident/i,
    /ransomware|malware|phishing/i,
    /data|information|records/i,
    /customer|employee|patient|user/i,
    /system|network|server|infrastructure/i,
    /accessed|compromised|exposed|stolen|leaked/i,
    /investigate|detect|discover|notif/i,
    /material|impact|effect|significant/i,
    /remediat|contain|restor|recover/i,
    /acqui|merger|agreement|transaction/i,
    /appoint|elect|resign|terminat/i,
  ];

  const scored = sentences.map(s => ({
    s,
    score: SCORE_TERMS.reduce((acc, re) => acc + (re.test(s) ? 1 : 0), 0),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Re-order winners by original position so the summary reads naturally
  const winners = scored.slice(0, maxSentences);
  const topIndices = winners.map(({ s }) => sentences.indexOf(s));
  topIndices.sort((a, b) => a - b);

  return topIndices.map(i => sentences[i]).join(" ").trim();
}

function analyzeFilingContent(content: string): {
  severity: Severity;
  exposedTypes: string[];
  summary: string;
  threatType: string;
} {
  let severity: Severity = "Medium";
  let threatType = "material disclosure";

  for (const { regex, severity: s, label } of THREAT_PATTERNS) {
    if (regex.test(content)) {
      severity = s;
      threatType = label;
      break;
    }
  }

  const exposedTypes: string[] = [];
  for (const { regex, label } of EXPOSED_DATA_PATTERNS) {
    if (regex.test(content)) exposedTypes.push(label);
    if (exposedTypes.length === 3) break;
  }

  // Build the summary from actual filing text
  const extracted = extractKeySentences(content, 2);

  let summary: string;
  if (extracted) {
    // Clean up any leftover boilerplate headers that sometimes bleed in
    summary = extracted
      .replace(/^(item\s+\d+\.\d+\.?\s*)/i, "")
      .replace(/\s+/g, " ")
      .trim();
    // Ensure it ends with a period
    if (!/[.!?]$/.test(summary)) summary += ".";
  } else {
    // Fallback if content was empty or too short
    summary = `${threatType.charAt(0).toUpperCase() + threatType.slice(1)} disclosed in SEC 8-K filing.`;
  }

  return { severity, exposedTypes, summary, threatType };
}

export async function fetchRecent8KFilings(daysBack: number = 30): Promise<SECFiling[]> {
  const allFilings: SECFiling[] = [];

  console.log("Fetching SEC EDGAR 8-K filings...");

  // Fetch all companies in parallel instead of sequentially
  const companyResults = await Promise.allSettled(
    KNOWN_CIKs.map(async (company) => {
      const submissions = await getCompanyFilings(company.cik);
      if (!submissions) return [];

      const filings = parse8KFilings(submissions, daysBack);
      if (filings.length === 0) return [];

      // Fetch all filing contents for this company in parallel
      await Promise.all(
        filings.map(async (filing) => {
          filing.content = await fetchFilingContent(filing.documentUrl);
        })
      );

      return filings;
    })
  );

  for (const result of companyResults) {
    if (result.status === "fulfilled") {
      allFilings.push(...result.value);
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
