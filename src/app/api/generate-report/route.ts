import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Simulate short network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      report_path: "/mock-report.pdf",
      download_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      report_id: "REP-MOCK-908B1",
      verdict: "DEEPFAKE",
      confidence: 0.89
    });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
