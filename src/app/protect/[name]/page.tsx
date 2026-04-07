import Link from "next/link";
import { ChevronLeft, Shield, Key, Lock, AlertTriangle, Search, ExternalLink, CheckCircle } from "lucide-react";

interface ProtectPageProps {
  params: Promise<{
    name: string;
  }>;
  searchParams: Promise<{
    exposed?: string;
  }>;
}

const COMPANY_SECURITY_URLS: Record<string, { password: string; account: string; name: string }> = {
  "amazon": { name: "Amazon", password: "https://www.amazon.com/ap/settings/approval", account: "https://www.amazon.com/a/settings" },
  "amzn": { name: "Amazon", password: "https://www.amazon.com/ap/settings/approval", account: "https://www.amazon.com/a/settings" },
  "google": { name: "Google", password: "https://myaccount.google.com/password", account: "https://myaccount.google.com" },
  "alphabet": { name: "Google", password: "https://myaccount.google.com/password", account: "https://myaccount.google.com" },
  "facebook": { name: "Facebook", password: "https://www.facebook.com/settings?tab=security", account: "https://www.facebook.com/settings" },
  "meta": { name: "Meta", password: "https://www.facebook.com/settings?tab=security", account: "https://www.facebook.com/settings" },
  "apple": { name: "Apple", password: "https://appleid.apple.com", account: "https://account.apple.com" },
  "microsoft": { name: "Microsoft", password: "https://account.microsoft.com/security", account: "https://account.microsoft.com" },
  "netflix": { name: "Netflix", password: "https://www.netflix.com/password", account: "https://www.netflix.com/manageaccount" },
  "twitter": { name: "Twitter/X", password: "https://twitter.com/settings/password", account: "https://twitter.com/settings" },
  "x corp": { name: "X (Twitter)", password: "https://twitter.com/settings/password", account: "https://twitter.com/settings" },
  "linkedin": { name: "LinkedIn", password: "https://www.linkedin.com/psettings/change-password", account: "https://www.linkedin.com/psettings" },
  "spotify": { name: "Spotify", password: "https://www.spotify.com/account/overview/", account: "https://www.spotify.com/account/overview/" },
  "uber": { name: "Uber", password: "https://auth.uber.com/v1/passwords", account: "https://myaccount.uber.com" },
  "lyft": { name: "Lyft", password: "https://account.lyft.com/auth/password", account: "https://account.lyft.com" },
  "paypal": { name: "PayPal", password: "https://www.paypal.com/myaccount/settings/security", account: "https://www.paypal.com/myaccount" },
  "venmo": { name: "Venmo", password: "https://account.venmo.com/settings", account: "https://account.venmo.com/settings" },
  "chase": { name: "Chase", password: "https://www.chase.com", account: "https://www.chase.com" },
  "bank of america": { name: "Bank of America", password: "https://www.bankofamerica.com", account: "https://www.bankofamerica.com" },
  "walmart": { name: "Walmart", password: "https://www.walmart.com/account", account: "https://www.walmart.com/account" },
  "target": { name: "Target", password: "https://www.target.com/guest/manage-account", account: "https://www.target.com" },
  "adobe": { name: "Adobe", password: "https://account.adobe.com/security", account: "https://account.adobe.com" },
  "dropbox": { name: "Dropbox", password: "https://www.dropbox.com/account_security", account: "https://www.dropbox.com/account" },
  "yahoo": { name: "Yahoo", password: "https://login.yahoo.com/account/security", account: "https://login.yahoo.com" },
  "tiktok": { name: "TikTok", password: "https://www.tiktok.com/setting", account: "https://www.tiktok.com/setting" },
  "snapchat": { name: "Snapchat", password: "https://accounts.snapchat.com/accounts/password", account: "https://accounts.snapchat.com" },
  "reddit": { name: "Reddit", password: "https://www.reddit.com/settings/account", account: "https://www.reddit.com/settings" },
  "discord": { name: "Discord", password: "https://discord.com/settings", account: "https://discord.com/settings" },
  "steam": { name: "Steam", password: "https://store.steampowered.com/account/", account: "https://store.steampowered.com/account/" },
  "epic": { name: "Epic Games", password: "https://www.epicgames.com/account", account: "https://www.epicgames.com/account" },
  "sony": { name: "Sony", password: "https://www.playstation.com", account: "https://www.playstation.com" },
  "nintendo": { name: "Nintendo", password: "https://accounts.nintendo.com", account: "https://accounts.nintendo.com" },
  "canva": { name: "Canva", password: "https://www.canva.com/settings", account: "https://www.canva.com/settings" },
  "ticketmaster": { name: "Ticketmaster", password: "https://account.ticketmaster.com", account: "https://account.ticketmaster.com" },
  "marriott": { name: "Marriott", password: "https://www.marriott.com/account", account: "https://www.marriott.com/account" },
  "hilton": { name: "Hilton", password: "https://www.hilton.com/en/myaccount/", account: "https://www.hilton.com/en/myaccount/" },
  "equifax": { name: "Equifax", password: "https://www.equifax.com", account: "https://www.equifax.com" },
  "capital one": { name: "Capital One", password: "https://www.capitalone.com", account: "https://www.capitalone.com" },
  "homedepot": { name: "Home Depot", password: "https://www.homedepot.com/myaccount", account: "https://www.homedepot.com/myaccount" },
  "bestbuy": { name: "Best Buy", password: "https://www.bestbuy.com/account", account: "https://www.bestbuy.com/account" },
  "dicks sporting": { name: "Dick's Sporting Goods", password: "https://www.dickssportinggoods.com/account", account: "https://www.dickssportinggoods.com/account" },
  "hacker": { name: "Cybersecurity Alert", password: "https://haveibeenpwned.com", account: "https://haveibeenpwned.com" },
  " breach": { name: "Data Breach Alert", password: "https://haveibeenpwned.com", account: "https://haveibeenpwned.com" },
  "data breach": { name: "Data Breach Alert", password: "https://haveibeenpwned.com", account: "https://haveibeenpwned.com" },
};

const EXPOSED_TYPE_MAP: Record<string, string[]> = {
  password: ["password", "passphrase", "login", "credential", "credentials", "pwd"],
  email: ["email", "email address", "contact info"],
  phone: ["phone", "phone number", "mobile number", "telephone", "sms"],
  payment: ["payment", "credit card", "bank", "financial", "card", "billing", "debit"],
  ssn: ["ssn", "social security", "national id", "government id", "tax id", "passport"],
  personal: ["name", "address", "date of birth", "dob", "physical address", "personal info", "driver license"],
};

export default async function ProtectPage({ params, searchParams }: ProtectPageProps) {
  const { name } = await params;
  const { exposed } = await searchParams;
  const companyName = decodeURIComponent(name);
  const companyLower = companyName.toLowerCase();
  
  const exposedTypes = exposed 
    ? exposed.split(/[;,]/).map(s => s.trim().toLowerCase())
    : [];
  
  const matchedCompany = Object.keys(COMPANY_SECURITY_URLS).find(k => companyLower.includes(k));
  const companyInfo = matchedCompany ? COMPANY_SECURITY_URLS[matchedCompany] : null;

  const suggestedTypes = new Set<string>();
  exposedTypes.forEach(exposed => {
    Object.entries(EXPOSED_TYPE_MAP).forEach(([type, keywords]) => {
      if (keywords.some(kw => exposed.includes(kw))) {
        suggestedTypes.add(type);
      }
    });
  });

  const passwordAction = {
    icon: Key,
    title: "Change Your Password",
    description: "Create a strong, unique password for your account",
    url: companyInfo?.password || `https://www.google.com/search?q=${encodeURIComponent(companyName)} official website`,
    priority: suggestedTypes.has("password") ? "high" : "normal"
  };

  const twoFactorAction = {
    icon: Lock,
    title: "Enable Two-Factor Authentication",
    description: "Add an extra layer of security to prevent unauthorized access",
    url: companyInfo ? `${companyInfo.account}` : `https://www.google.com/search?q=${encodeURIComponent(companyName)} two-factor authentication`,
    priority: "normal"
  };

  const reviewAction = {
    icon: Search,
    title: "Review Recent Activity",
    description: "Check your account for any unauthorized access or changes",
    url: companyInfo?.account || `https://www.google.com/search?q=${encodeURIComponent(companyName)} account settings`,
    priority: "normal"
  };

  const creditAction = {
    icon: AlertTriangle,
    title: "Monitor Your Credit",
    description: "Place a fraud alert or credit freeze if personal information was exposed",
    url: "https://www.annualcreditreport.com",
    priority: suggestedTypes.has("ssn") || suggestedTypes.has("personal") ? "high" : "low"
  };

  const passwordManagerAction = {
    icon: Key,
    title: "Use a Password Manager",
    description: "Generate and store unique passwords for all your accounts",
    url: "https://passwords.google.com",
    priority: "low"
  };

  let actions = [passwordAction, twoFactorAction, reviewAction];
  
  if (suggestedTypes.has("ssn") || suggestedTypes.has("personal")) {
    actions.push(creditAction);
  }
  
  if (suggestedTypes.size === 0) {
    actions.push(passwordManagerAction);
  }

  actions.sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-xs text-slate-500">{companyName} - Protect Your Account</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 mb-4">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Protect Your {companyName} Account</h1>
          <p className="mt-2 text-slate-400">
            {companyName} reported a data breach. Take these steps to secure your account.
          </p>
        </div>

        {exposedTypes.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-300 font-medium mb-2">Data potentially exposed:</p>
            <div className="flex flex-wrap gap-2">
              {exposedTypes.map((type, i) => (
                <span key={i} className="text-xs bg-red-500/20 text-red-200 px-2 py-1 rounded capitalize">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Recommended Actions
          </h2>
          {actions.map((action, index) => (
            <a
              key={index}
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block bg-slate-900 border rounded-xl p-4 hover:border-slate-600 transition-all group ${
                action.priority === "high" ? "border-red-500/30" : "border-slate-700"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  action.priority === "high" ? "bg-red-500/20" : "bg-blue-500/20"
                }`}>
                  <action.icon className={`h-5 w-5 ${action.priority === "high" ? "text-red-400" : "text-blue-400"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">{action.title}</h3>
                    <span className="text-xs text-slate-500 flex items-center gap-1">Open <ExternalLink className="h-3 w-3" /></span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400 text-center">
            These links go to official account pages. Always verify you&apos;re on the correct website before entering any information.
          </p>
        </div>
      </div>
    </div>
  );
}
