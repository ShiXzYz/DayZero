import Link from "next/link";
import { ChevronLeft, Shield, Key, Mail, CreditCard, User, Lock, Smartphone, AlertTriangle } from "lucide-react";

interface ProtectPageProps {
  params: Promise<{
    name: string;
  }>;
  searchParams: Promise<{
    exposed?: string;
  }>;
}

const SECURITY_ACTIONS = [
  {
    type: "password",
    icon: Key,
    title: "Change Password",
    description: "Update your password to a strong, unique one",
    externalUrl: "https://passwords.google.com",
    label: "Change Password"
  },
  {
    type: "email",
    icon: Mail,
    title: "Review Email Settings",
    description: "Check your email forwarding rules and filters",
    externalUrl: "https://myaccount.google.com/email",
    label: "Secure Email"
  },
  {
    type: "phone",
    icon: Smartphone,
    title: "Update Phone Number",
    description: "Ensure your recovery phone is current",
    externalUrl: "https://myaccount.google.com/phone",
    label: "Update Phone"
  },
  {
    type: "2fa",
    icon: Lock,
    title: "Enable Two-Factor Auth",
    description: "Add an extra layer of security to your account",
    externalUrl: "https://myaccount.google.com/signinoptions/two-step-verification",
    label: "Enable 2FA"
  },
  {
    type: "payment",
    icon: CreditCard,
    title: "Review Payment Methods",
    description: "Check and remove any unauthorized payment methods",
    externalUrl: "https://pay.google.com",
    label: "Secure Payments"
  },
  {
    type: "ssn",
    icon: AlertTriangle,
    title: "Monitor Credit",
    description: "Place a fraud alert or credit freeze",
    externalUrl: "https://www.annualcreditreport.com",
    label: "Check Credit"
  },
  {
    type: "personal",
    icon: User,
    title: "Review Personal Info",
    description: "Check and update your personal details",
    externalUrl: "https://myaccount.google.com/personal-info",
    label: "Review Info"
  },
];

const EXPOSED_TYPE_MAP: Record<string, string[]> = {
  password: ["Password", "Passwords", "login", "credential", "login credentials"],
  email: ["Email", "Email Address", "email addresses", "contact info"],
  phone: ["Phone", "Phone Number", "mobile number", "phone number"],
  payment: ["Payment", "Credit Card", "Bank", "Financial", "card details", "banking info", "payment info"],
  ssn: ["SSN", "Social Security", "National ID", "government ID"],
  personal: ["Name", "Address", "Date of Birth", "DOB", "physical address", "personal info"],
  "2fa": ["2FA", "Two-Factor", "Authentication", "MFA"],
};

export default async function ProtectPage({ params, searchParams }: ProtectPageProps) {
  const { name } = await params;
  const { exposed } = await searchParams;
  const companyName = decodeURIComponent(name);
  
  const exposedTypes = exposed ? exposed.split(";").flatMap(s => s.split(",")).map(s => s.trim().toLowerCase()) : [];
  
  const suggestedActions = SECURITY_ACTIONS.filter(action => {
    if (exposedTypes.length === 0) return true;
    const keywords = EXPOSED_TYPE_MAP[action.type] || [];
    return exposedTypes.some(exposed => 
      keywords.some(keyword => exposed.includes(keyword.toLowerCase()))
    );
  });

  const generalActions = SECURITY_ACTIONS.filter(action => 
    !suggestedActions.includes(action)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-xs text-slate-500">Protect your accounts</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 mb-4">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Protect Your Account</h1>
          <p className="mt-2 text-slate-400">
            {companyName} reported a data breach. Take these steps to secure your account.
          </p>
        </div>

        {exposedTypes.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-300 font-medium mb-2">Data potentially exposed:</p>
            <div className="flex flex-wrap gap-2">
              {exposedTypes.map((type, i) => (
                <span key={i} className="text-xs bg-red-500/20 text-red-200 px-2 py-1 rounded">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Recommended Actions
          </h2>
          {suggestedActions.map((action) => (
            <a
              key={action.type}
              href={action.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                  <action.icon className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors">{action.title}</h3>
                    <span className="text-xs text-slate-500">Open →</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {generalActions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Additional Security Steps</h2>
            {generalActions.slice(0, 3).map((action) => (
              <a
                key={action.type}
                href={action.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <action.icon className="h-5 w-5 text-slate-500" />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-300 group-hover:text-white transition-colors">{action.title}</h3>
                  </div>
                  <span className="text-xs text-slate-500">→</span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400 text-center">
            These links go to official account security pages. Always verify you&apos;re on the correct website before entering any information.
          </p>
        </div>
      </div>
    </div>
  );
}
