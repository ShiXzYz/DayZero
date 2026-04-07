import { NextResponse } from "next/server";
import { fetchRecent8KFilings, filingToIncident } from "@/lib/sources/sec-edgar";
import { fetchAllNewsFeeds } from "@/lib/sources/news";
import { clearCache, getCacheStats } from "@/lib/cache/incidents";

interface DebugResult {
  timestamp: string;
  cache: ReturnType<typeof getCacheStats>;
  sources: {
    sec_edgar?: {
      success: boolean;
      filingsFound?: number;
      timeMs?: number;
      filings?: Array<{
        company: string;
        ticker: string;
        formType: string;
        filedDate: string;
        summary: string;
        severity: string;
        exposedData: string[];
      }>;
      error?: string;
    };
    news?: {
      success: boolean;
      articlesFound?: number;
      timeMs?: number;
      articles?: Array<{
        title: string;
        source: string;
        publishedAt: string;
        summary: string;
        exposedTypes: string[];
      }>;
      error?: string;
    };
  };
}

export async function GET() {
  clearCache();
  
  const debug: DebugResult = {
    timestamp: new Date().toISOString(),
    cache: getCacheStats(),
    sources: {},
  };

  try {
    console.log("=== DEBUG: Testing SEC EDGAR ===");
    const secStart = Date.now();
    const secFilings = await fetchRecent8KFilings(30);
    
    debug.sources.sec_edgar = {
      success: true,
      filingsFound: secFilings.length,
      timeMs: Date.now() - secStart,
      filings: secFilings.slice(0, 5).map(f => {
        const incident = filingToIncident(f);
        return {
          company: f.companyName,
          ticker: f.ticker,
          formType: f.formType,
          filedDate: f.filedDate,
          summary: incident.summary || "",
          severity: incident.severity || "Unknown",
          exposedData: incident.exposedData?.map(e => e.types).flat() || [],
        };
      }),
    };
    console.log(`SEC EDGAR: Found ${secFilings.length} filings in ${Date.now() - secStart}ms`);
  } catch (error) {
    console.error("SEC EDGAR Error:", error);
    debug.sources.sec_edgar = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  try {
    console.log("=== DEBUG: Testing News Feeds ===");
    const newsStart = Date.now();
    const news = await fetchAllNewsFeeds();
    debug.sources.news = {
      success: true,
      articlesFound: news.length,
      timeMs: Date.now() - newsStart,
      articles: news.slice(0, 5).map(a => ({
        title: a.title,
        source: a.source,
        publishedAt: a.publishedAt,
        summary: a.summary,
        exposedTypes: a.exposedTypes || [],
      })),
    };
    console.log(`News: Found ${news.length} articles in ${Date.now() - newsStart}ms`);
  } catch (error) {
    console.error("News Error:", error);
    debug.sources.news = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return NextResponse.json(debug);
}
