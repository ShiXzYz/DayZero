import Link from "next/link";
import { ChevronLeft, ExternalLink, Building2, FileText, Globe, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Incident } from "@/types";

interface CompanyPageProps {
  params: {
    name: string;
  };
}

async function fetchCompanyIncidents(companyName: string): Promise<Incident[]> {
  const response = await fetch(
    `/api/incidents?companyName=${encodeURIComponent(companyName)}&limit=100`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.incidents || [];
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const companyName = params.name;
  const incidents = await fetchCompanyIncidents(companyName);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/companies" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back to companies
          </Link>
          <span className="text-xs text-slate-500">SEC 8-K / cybersecurity filings</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{companyName}</h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Showing recent incidents and SEC 8-K filings for {companyName}. If no live results appear, the company may not have recent filings or the data is still loading.
          </p>
        </div>

        {incidents.length === 0 ? (
          <Card className="bg-slate-900 border-slate-700 rounded-2xl">
            <CardContent className="p-8 text-center">
              <Building2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium">No incidents found</p>
              <p className="text-sm text-slate-400 mt-1">
                Try visiting the feed or search for a different company.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident, idx) => (
              <Card key={incident.id} className="bg-slate-900 border border-slate-700 rounded-2xl hover:border-slate-600 transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{incident.severity}</span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full">{incident.status}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-white">{incident.title}</h2>
                      <p className="mt-2 text-sm text-slate-400">{incident.summary}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>{new Date(incident.discoveredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                    {incident.sources.map((source, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {source.type === "sec_filing" ? <FileText className="h-4 w-4 text-purple-400" /> : null}
                        {source.type === "news" ? <Globe className="h-4 w-4 text-red-400" /> : null}
                        {source.type === "hibp" ? <AlertTriangle className="h-4 w-4 text-amber-400" /> : null}
                        <span>{source.sourceName}</span>
                      </div>
                    ))}
                  </div>

                  {incident.sources[0]?.url && (
                    <div className="mt-4">
                      <a
                        href={incident.sources[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View source
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
