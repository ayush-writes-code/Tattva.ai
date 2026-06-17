import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized. Please log in to download reports.", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return new NextResponse("Missing path parameter", { status: 400 });
    }

    const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const apiKey = process.env.BACKEND_API_KEY || '';

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const targetUrl = `${cleanApiUrl}${cleanPath}`;

    const backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Failed to download report from backend: ${backendResponse.status} ${errorText}`);
      return new NextResponse(`Backend error: ${backendResponse.status}`, { status: backendResponse.status });
    }

    // Proxy the response headers (especially Content-Type and Content-Disposition)
    const headers = new Headers();
    const contentType = backendResponse.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    const contentDisposition = backendResponse.headers.get("content-disposition");
    if (contentDisposition) {
      headers.set("Content-Disposition", contentDisposition);
    } else {
      // Fallback disposition if none provided
      const filename = path.split('/').pop() || "report.pdf";
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }

    return new NextResponse(backendResponse.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Report download failed:", err);
    return new NextResponse("Failed to download report", { status: 500 });
  }
}
