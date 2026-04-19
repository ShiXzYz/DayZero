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

interface CompanySecurityInfo {
  name: string;
  password: string;   // direct link to change password
  twoFactor: string;  // direct link to 2FA/security settings
  activity: string;   // direct link to recent activity / account overview
}

const COMPANY_SECURITY_URLS: Record<string, CompanySecurityInfo> = {
  // Big Tech
  "amazon": { name: "Amazon", password: "https://www.amazon.com/gp/css/account/info/view.html", twoFactor: "https://www.amazon.com/a/settings/approval", activity: "https://www.amazon.com/gp/css/order-history" },
  "amzn": { name: "Amazon", password: "https://www.amazon.com/gp/css/account/info/view.html", twoFactor: "https://www.amazon.com/a/settings/approval", activity: "https://www.amazon.com/gp/css/order-history" },
  "aws": { name: "AWS", password: "https://console.aws.amazon.com/iam/home#/security_credentials", twoFactor: "https://console.aws.amazon.com/iam/home#/security_credentials", activity: "https://console.aws.amazon.com/cloudtrail/home" },
  "google": { name: "Google", password: "https://myaccount.google.com/password", twoFactor: "https://myaccount.google.com/two-step-verification", activity: "https://myaccount.google.com/security-checkup" },
  "alphabet": { name: "Google", password: "https://myaccount.google.com/password", twoFactor: "https://myaccount.google.com/two-step-verification", activity: "https://myaccount.google.com/security-checkup" },
  "googl": { name: "Google", password: "https://myaccount.google.com/password", twoFactor: "https://myaccount.google.com/two-step-verification", activity: "https://myaccount.google.com/security-checkup" },
  "meta": { name: "Meta / Facebook", password: "https://www.facebook.com/settings?tab=security", twoFactor: "https://www.facebook.com/security/2fac/settings/", activity: "https://www.facebook.com/settings?tab=security" },
  "facebook": { name: "Facebook", password: "https://www.facebook.com/settings?tab=security", twoFactor: "https://www.facebook.com/security/2fac/settings/", activity: "https://www.facebook.com/settings?tab=security" },
  "instagram": { name: "Instagram", password: "https://www.instagram.com/accounts/password/change/", twoFactor: "https://www.instagram.com/accounts/two_factor_authentication/", activity: "https://www.instagram.com/accounts/login_activity/" },
  "whatsapp": { name: "WhatsApp", password: "https://faq.whatsapp.com/general/account-and-profile/about-two-step-verification", twoFactor: "https://faq.whatsapp.com/general/account-and-profile/about-two-step-verification", activity: "https://www.whatsapp.com/legal/privacy-policy" },
  "apple": { name: "Apple", password: "https://appleid.apple.com/account/manage", twoFactor: "https://appleid.apple.com/account/manage", activity: "https://appleid.apple.com/account/manage" },
  "microsoft": { name: "Microsoft", password: "https://account.microsoft.com/security", twoFactor: "https://account.microsoft.com/security/mfa", activity: "https://account.microsoft.com/security/recent-activity" },
  "msft": { name: "Microsoft", password: "https://account.microsoft.com/security", twoFactor: "https://account.microsoft.com/security/mfa", activity: "https://account.microsoft.com/security/recent-activity" },
  "nvidia": { name: "NVIDIA", password: "https://profile.nvgs.nvidia.com/security", twoFactor: "https://profile.nvgs.nvidia.com/security", activity: "https://profile.nvgs.nvidia.com/security" },
  "nvda": { name: "NVIDIA", password: "https://profile.nvgs.nvidia.com/security", twoFactor: "https://profile.nvgs.nvidia.com/security", activity: "https://profile.nvgs.nvidia.com/security" },

  // Social / Entertainment
  "netflix": { name: "Netflix", password: "https://www.netflix.com/password", twoFactor: "https://www.netflix.com/account/security", activity: "https://www.netflix.com/viewingactivity" },
  "twitter": { name: "X (Twitter)", password: "https://twitter.com/settings/password", twoFactor: "https://twitter.com/settings/account/login_verification", activity: "https://twitter.com/settings/sessions" },
  "x corp": { name: "X (Twitter)", password: "https://twitter.com/settings/password", twoFactor: "https://twitter.com/settings/account/login_verification", activity: "https://twitter.com/settings/sessions" },
  "linkedin": { name: "LinkedIn", password: "https://www.linkedin.com/psettings/change-password", twoFactor: "https://www.linkedin.com/psettings/two-step-verification", activity: "https://www.linkedin.com/psettings/sessions" },
  "spotify": { name: "Spotify", password: "https://www.spotify.com/account/change-password/", twoFactor: "https://www.spotify.com/account/security/", activity: "https://www.spotify.com/account/security/" },
  "tiktok": { name: "TikTok", password: "https://www.tiktok.com/setting?activeTab=security", twoFactor: "https://www.tiktok.com/setting?activeTab=security", activity: "https://www.tiktok.com/setting?activeTab=security" },
  "snapchat": { name: "Snapchat", password: "https://accounts.snapchat.com/accounts/password", twoFactor: "https://accounts.snapchat.com/accounts/two_factor_auth_setup", activity: "https://accounts.snapchat.com/accounts/privacy-rights" },
  "reddit": { name: "Reddit", password: "https://www.reddit.com/settings/account", twoFactor: "https://www.reddit.com/settings/security", activity: "https://www.reddit.com/settings/security" },
  "discord": { name: "Discord", password: "https://discord.com/settings/account", twoFactor: "https://discord.com/settings/security", activity: "https://discord.com/settings/sessions" },
  "youtube": { name: "YouTube", password: "https://myaccount.google.com/password", twoFactor: "https://myaccount.google.com/two-step-verification", activity: "https://myaccount.google.com/security-checkup" },
  "twitch": { name: "Twitch", password: "https://www.twitch.tv/settings/security", twoFactor: "https://www.twitch.tv/settings/security", activity: "https://www.twitch.tv/settings/security" },

  // Finance & Payments
  "paypal": { name: "PayPal", password: "https://www.paypal.com/myaccount/settings/security", twoFactor: "https://www.paypal.com/myaccount/settings/security", activity: "https://www.paypal.com/myaccount/activities/" },
  "venmo": { name: "Venmo", password: "https://account.venmo.com/settings/security", twoFactor: "https://account.venmo.com/settings/security", activity: "https://account.venmo.com/settings" },
  "stripe": { name: "Stripe", password: "https://dashboard.stripe.com/settings/user", twoFactor: "https://dashboard.stripe.com/settings/user/security", activity: "https://dashboard.stripe.com/security/audit-trail" },
  "chase": { name: "Chase", password: "https://secure.chase.com/web/auth/dashboard#/dashboard/preferences/security", twoFactor: "https://secure.chase.com/web/auth/dashboard#/dashboard/preferences/security", activity: "https://secure.chase.com/web/auth/dashboard#/dashboard/accountActivityTile" },
  "bank of america": { name: "Bank of America", password: "https://secure.bankofamerica.com/myaccounts/signin/signIn.go", twoFactor: "https://www.bankofamerica.com/security-center/", activity: "https://secure.bankofamerica.com/myaccounts/signin/signIn.go" },
  "wells fargo": { name: "Wells Fargo", password: "https://connect.secure.wellsfargo.com/auth/login/present", twoFactor: "https://connect.secure.wellsfargo.com/auth/login/present", activity: "https://connect.secure.wellsfargo.com/auth/login/present" },
  "capital one": { name: "Capital One", password: "https://myaccounts.capitalone.com/accountSummary", twoFactor: "https://myaccounts.capitalone.com/accountSummary", activity: "https://myaccounts.capitalone.com/accountSummary" },
  "equifax": { name: "Equifax", password: "https://my.equifax.com/consumer-registration/UCSC/#/personal-info", twoFactor: "https://my.equifax.com/consumer-registration/UCSC/#/personal-info", activity: "https://my.equifax.com/membercenter/dashboard" },
  "experian": { name: "Experian", password: "https://www.experian.com/consumer-products/identity-protection.html", twoFactor: "https://www.experian.com/consumer-products/identity-protection.html", activity: "https://www.experian.com/consumer-products/identity-protection.html" },
  "coinbase": { name: "Coinbase", password: "https://www.coinbase.com/settings/security", twoFactor: "https://www.coinbase.com/settings/security", activity: "https://www.coinbase.com/settings/activity" },

  // Retail & Commerce
  "walmart": { name: "Walmart", password: "https://www.walmart.com/account/settings", twoFactor: "https://www.walmart.com/account/settings", activity: "https://www.walmart.com/account/order-history" },
  "target": { name: "Target", password: "https://www.target.com/account", twoFactor: "https://www.target.com/account", activity: "https://www.target.com/orders" },
  "home depot": { name: "Home Depot", password: "https://www.homedepot.com/account", twoFactor: "https://www.homedepot.com/account", activity: "https://www.homedepot.com/account/orders" },
  "homedepot": { name: "Home Depot", password: "https://www.homedepot.com/account", twoFactor: "https://www.homedepot.com/account", activity: "https://www.homedepot.com/account/orders" },
  "bestbuy": { name: "Best Buy", password: "https://www.bestbuy.com/account/", twoFactor: "https://www.bestbuy.com/account/", activity: "https://www.bestbuy.com/account/" },
  "best buy": { name: "Best Buy", password: "https://www.bestbuy.com/account/", twoFactor: "https://www.bestbuy.com/account/", activity: "https://www.bestbuy.com/account/" },
  "ebay": { name: "eBay", password: "https://www.ebay.com/myb/summary", twoFactor: "https://www.ebay.com/myb/summary", activity: "https://www.ebay.com/myb/summary" },
  "ticketmaster": { name: "Ticketmaster", password: "https://www.ticketmaster.com/my-account", twoFactor: "https://www.ticketmaster.com/my-account", activity: "https://www.ticketmaster.com/my-account/order-history" },
  "dicks sporting": { name: "Dick's Sporting Goods", password: "https://www.dickssportinggoods.com/account/settings", twoFactor: "https://www.dickssportinggoods.com/account/settings", activity: "https://www.dickssportinggoods.com/account/orderhistory" },

  // Cloud / Software
  "adobe": { name: "Adobe", password: "https://account.adobe.com/security", twoFactor: "https://account.adobe.com/security", activity: "https://account.adobe.com/security" },
  "dropbox": { name: "Dropbox", password: "https://www.dropbox.com/account/security", twoFactor: "https://www.dropbox.com/account/security", activity: "https://www.dropbox.com/account/security" },
  "salesforce": { name: "Salesforce", password: "https://login.salesforce.com/secur/forgotpassword.jsp", twoFactor: "https://help.salesforce.com/s/articleView?id=sf.security_overview_2fa.htm", activity: "https://login.salesforce.com" },
  "okta": { name: "Okta", password: "https://login.okta.com", twoFactor: "https://login.okta.com", activity: "https://login.okta.com" },
  "github": { name: "GitHub", password: "https://github.com/settings/security", twoFactor: "https://github.com/settings/two_factor_authentication/configure", activity: "https://github.com/settings/security-log" },
  "twilio": { name: "Twilio", password: "https://console.twilio.com/user/account/user-settings", twoFactor: "https://console.twilio.com/user/account/user-settings", activity: "https://console.twilio.com/user/account" },

  // Travel & Hospitality
  "marriott": { name: "Marriott", password: "https://www.marriott.com/loyalty/myAccount/myProfile.mi", twoFactor: "https://www.marriott.com/loyalty/myAccount/myProfile.mi", activity: "https://www.marriott.com/loyalty/myAccount/myTrips.mi" },
  "hilton": { name: "Hilton", password: "https://www.hilton.com/en/hilton-honors/profile/", twoFactor: "https://www.hilton.com/en/hilton-honors/profile/", activity: "https://www.hilton.com/en/hilton-honors/profile/" },
  "airbnb": { name: "Airbnb", password: "https://www.airbnb.com/account-settings/personal-info", twoFactor: "https://www.airbnb.com/account-settings/security", activity: "https://www.airbnb.com/account-settings/security" },
  "uber": { name: "Uber", password: "https://auth.uber.com/login", twoFactor: "https://auth.uber.com/login", activity: "https://auth.uber.com/login" },
  "lyft": { name: "Lyft", password: "https://account.lyft.com/security", twoFactor: "https://account.lyft.com/security", activity: "https://account.lyft.com/security" },

  // Telecom
  "at&t": { name: "AT&T", password: "https://www.att.com/my/account.html", twoFactor: "https://www.att.com/my/account.html", activity: "https://www.att.com/my/account.html" },
  "att": { name: "AT&T", password: "https://www.att.com/my/account.html", twoFactor: "https://www.att.com/my/account.html", activity: "https://www.att.com/my/account.html" },
  "verizon": { name: "Verizon", password: "https://account.verizon.com/login", twoFactor: "https://account.verizon.com/login", activity: "https://account.verizon.com/login" },
  "t-mobile": { name: "T-Mobile", password: "https://account.t-mobile.com", twoFactor: "https://account.t-mobile.com", activity: "https://account.t-mobile.com" },
  "tmobile": { name: "T-Mobile", password: "https://account.t-mobile.com", twoFactor: "https://account.t-mobile.com", activity: "https://account.t-mobile.com" },

  // Gaming
  "steam": { name: "Steam", password: "https://store.steampowered.com/account/", twoFactor: "https://store.steampowered.com/account/", activity: "https://store.steampowered.com/account/" },
  "epic": { name: "Epic Games", password: "https://www.epicgames.com/account/password", twoFactor: "https://www.epicgames.com/account/security", activity: "https://www.epicgames.com/account/security" },
  "epic games": { name: "Epic Games", password: "https://www.epicgames.com/account/password", twoFactor: "https://www.epicgames.com/account/security", activity: "https://www.epicgames.com/account/security" },
  "sony": { name: "PlayStation", password: "https://id.sonyentertainmentnetwork.com/id/management/", twoFactor: "https://id.sonyentertainmentnetwork.com/id/management/", activity: "https://id.sonyentertainmentnetwork.com/id/management/" },
  "playstation": { name: "PlayStation", password: "https://id.sonyentertainmentnetwork.com/id/management/", twoFactor: "https://id.sonyentertainmentnetwork.com/id/management/", activity: "https://id.sonyentertainmentnetwork.com/id/management/" },
  "nintendo": { name: "Nintendo", password: "https://accounts.nintendo.com/profile/security", twoFactor: "https://accounts.nintendo.com/profile/security", activity: "https://accounts.nintendo.com/profile/security" },

  // Other
  "yahoo": { name: "Yahoo", password: "https://login.yahoo.com/account/security", twoFactor: "https://login.yahoo.com/account/security", activity: "https://login.yahoo.com/account/security" },
  "canva": { name: "Canva", password: "https://www.canva.com/settings/account", twoFactor: "https://www.canva.com/settings/account", activity: "https://www.canva.com/settings/account" },
  "globalstar": { name: "Globalstar", password: "https://www.globalstar.com/en-us/", twoFactor: "https://www.globalstar.com/en-us/", activity: "https://www.globalstar.com/en-us/" },
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

  const displayName = companyInfo?.name || companyName;
  const fallbackSearch = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

  const passwordAction = {
    icon: Key,
    title: `Change Your ${displayName} Password`,
    description: `Go directly to ${displayName}'s password settings and update to a strong, unique password.`,
    url: companyInfo?.password || fallbackSearch(`${companyName} change password`),
    priority: suggestedTypes.has("password") ? "high" : "normal",
  };

  const twoFactorAction = {
    icon: Lock,
    title: `Enable ${displayName} Two-Factor Authentication`,
    description: `Turn on 2FA in your ${displayName} security settings to block unauthorized logins.`,
    url: companyInfo?.twoFactor || fallbackSearch(`${companyName} enable two factor authentication`),
    priority: "normal",
  };

  const reviewAction = {
    icon: Search,
    title: `Review ${displayName} Account Activity`,
    description: `Check your ${displayName} account for any logins or changes you don't recognize.`,
    url: companyInfo?.activity || fallbackSearch(`${companyName} recent account activity`),
    priority: "normal",
  };

  const creditAction = {
    icon: AlertTriangle,
    title: "Place a Credit Freeze",
    description: "Freeze your credit at all three bureaus to prevent new accounts being opened in your name.",
    url: "https://www.annualcreditreport.com",
    priority: suggestedTypes.has("ssn") || suggestedTypes.has("personal") ? "high" : "low",
  };

  const passwordManagerAction = {
    icon: Key,
    title: "Use a Password Manager",
    description: "Generate and store unique passwords so a breach at one site can't affect others.",
    url: "https://passwords.google.com",
    priority: "low",
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
