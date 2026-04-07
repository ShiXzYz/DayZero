import { NextResponse } from "next/server";
import { fetchRecent8KFilings } from "@/lib/sources/sec-edgar";
import { fetchAllNewsFeeds } from "@/lib/sources/news";

interface DebugResult {
  timestamp: string;
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
        url: string;
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
      }>;
      error?: string;
    };
  };
}

export async function GET() {
  const debug: DebugResult = {
    timestamp: new Date().toISOString(),
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
      filings: secFilings.slice(0, 5).map(f => ({
        company: f.companyName,
        ticker: f.ticker,
        formType: f.formType,
        filedDate: f.filedDate,
        url: f.documentUrl,
      })),
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
      articles: news.slice(0, 3).map(a => ({
        title: a.title,
        source: a.source,
        publishedAt: a.publishedAt,
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
