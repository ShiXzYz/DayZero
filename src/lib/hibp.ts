import { Breach } from "@/types";

const HIBP_API_BASE = "https://haveibeenpwned.com/api/v3";

interface HIBPBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  LogoPath: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  IsMalware: boolean;
  IsSubscriptionFree: boolean;
}

function mapHIBPBreach(breach: HIBPBreach): Breach {
  return {
    id: breach.Name,
    name: breach.Name,
    title: breach.Title,
    domain: breach.Domain,
    breachDate: breach.BreachDate,
    addedDate: breach.AddedDate,
    modifiedDate: breach.ModifiedDate,
    pwnCount: breach.PwnCount,
    description: breach.Description.replace(/<[^>]*>/g, ""),
    logoPath: breach.LogoPath,
    dataClasses: breach.DataClasses,
    isVerified: breach.IsVerified,
    isFabricated: breach.IsFabricated,
    isSensitive: breach.IsSensitive,
    isRetired: breach.IsRetired,
    isSpamList: breach.IsSpamList,
    isMalware: breach.IsMalware,
    isSubscriptionFree: breach.IsSubscriptionFree,
  };
}

export async function checkBreaches(email: string): Promise<Breach[]> {
  const apiKey = process.env.HIBP_API_KEY;
  
  if (!apiKey) {
    console.warn("HIBP_API_KEY not configured, returning mock data");
    return getMockBreaches();
  }

  try {
    const response = await fetch(
      `${HIBP_API_BASE}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          "hibp-api-key": apiKey,
          "user-agent": "DayZero-Cybersecurity-App",
        },
      }
    );

    if (response.status === 404) {
      return [];
    }

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const data: HIBPBreach[] = await response.json();
    return data.map(mapHIBPBreach);
  } catch (error) {
    console.error("Error checking breaches:", error);
    throw error;
  }
}

export async function getAllBreaches(): Promise<Breach[]> {
  const apiKey = process.env.HIBP_API_KEY;

  if (!apiKey) {
    return getMockBreaches();
  }

  try {
    const response = await fetch(`${HIBP_API_BASE}/breaches`, {
      headers: {
        "hibp-api-key": apiKey,
        "user-agent": "DayZero-Cybersecurity-App",
      },
    });

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const data: HIBPBreach[] = await response.json();
    return data.map(mapHIBPBreach);
  } catch (error) {
    console.error("Error fetching all breaches:", error);
    throw error;
  }
}

export async function getBreachByName(name: string): Promise<Breach | null> {
  const apiKey = process.env.HIBP_API_KEY;

  if (!apiKey) {
    const mockBreaches = getMockBreaches();
    return mockBreaches.find(b => b.name === name) || null;
  }

  try {
    const response = await fetch(`${HIBP_API_BASE}/breach/${name}`, {
      headers: {
        "hibp-api-key": apiKey,
        "user-agent": "DayZero-Cybersecurity-App",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const data: HIBPBreach = await response.json();
    return mapHIBPBreach(data);
  } catch (error) {
    console.error("Error fetching breach:", error);
    throw error;
  }
}

function getMockBreaches(): Breach[] {
  return [
    {
      id: "LinkedIn",
      name: "LinkedIn",
      title: "LinkedIn",
      domain: "linkedin.com",
      breachDate: "2021-06-22",
      addedDate: "2021-06-29",
      modifiedDate: "2021-06-29",
      pwnCount: 700000000,
      description: "In June 2021, a data breach exposed 700 million LinkedIn users' public profile data including email addresses, phone numbers, and professional information.",
      logoPath: "",
      dataClasses: ["Email addresses", "Phone numbers", "Names", "Physical addresses", "Professional info"],
      isVerified: true,
      isFabricated: false,
      isSensitive: false,
      isRetired: false,
      isSpamList: false,
      isMalware: false,
      isSubscriptionFree: true,
    },
    {
      id: "Adobe",
      name: "Adobe",
      title: "Adobe",
      domain: "adobe.com",
      breachDate: "2013-10-04",
      addedDate: "2013-12-04",
      modifiedDate: "2022-05-15",
      pwnCount: 153000000,
      description: "In October 2013, 153 million Adobe accounts were breached including email addresses, usernames, and encrypted passwords.",
      logoPath: "",
      dataClasses: ["Email addresses", "Password hints", "Passwords", "Usernames"],
      isVerified: true,
      isFabricated: false,
      isSensitive: false,
      isRetired: false,
      isSpamList: false,
      isMalware: false,
      isSubscriptionFree: true,
    },
    {
      id: "Dropbox",
      name: "Dropbox",
      title: "Dropbox",
      domain: "dropbox.com",
      breachDate: "2012-07-01",
      addedDate: "2016-08-31",
      modifiedDate: "2016-08-31",
      pwnCount: 68648009,
      description: "In mid-2012, Dropbox suffered a data breach which exposed 68 million unique email addresses and bcrypt hashes.",
      logoPath: "",
      dataClasses: ["Email addresses", "Passwords"],
      isVerified: true,
      isFabricated: false,
      isSensitive: false,
      isRetired: false,
      isSpamList: false,
      isMalware: false,
      isSubscriptionFree: true,
    },
    {
      id: " Canva",
      name: "Canva",
      title: "Canva",
      domain: "canva.com",
      breachDate: "2019-05-24",
      addedDate: "2019-05-24",
      modifiedDate: "2019-05-24",
      pwnCount: 137000000,
      description: "In May 2019, the graphic design tool Canva suffered a breach exposing 137 million users including email addresses, names, and encrypted passwords.",
      logoPath: "",
      dataClasses: ["Email addresses", "Geographic locations", "Names", "Passwords", "Usernames"],
      isVerified: true,
      isFabricated: false,
      isSensitive: false,
      isRetired: false,
      isSpamList: false,
      isMalware: false,
      isSubscriptionFree: true,
    },
  ];
}

export function calculateDataExposureScore(dataClasses: string[]): number {
  const sensitiveData: Record<string, number> = {
    "Passwords": 30,
    "Credit cards": 25,
    "Bank account numbers": 25,
    "Social security numbers": 30,
    "Dates of birth": 15,
    "Phone numbers": 10,
    "Physical addresses": 10,
    "Email addresses": 5,
    "Names": 5,
    "Usernames": 5,
    "IP addresses": 5,
    "Gender": 3,
    "Employers": 5,
    "Job titles": 3,
    "Industry": 3,
  };

  let score = 0;
  for (const dataClass of dataClasses) {
    score += sensitiveData[dataClass] || 5;
  }
  return Math.min(score, 100);
}

export function getSeverityFromData(dataClasses: string[]): "Critical" | "High" | "Medium" | "Low" {
  const criticalData = ["Social security numbers", "Passwords", "Credit cards", "Bank account numbers"];
  const highData = ["Dates of birth", "Phone numbers", "Physical addresses"];
  
  if (dataClasses.some(d => criticalData.includes(d))) return "Critical";
  if (dataClasses.some(d => highData.includes(d))) return "High";
  if (dataClasses.length > 3) return "Medium";
  return "Low";
}
