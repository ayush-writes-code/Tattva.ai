import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ detail: "Unauthorized. Please log in to perform a scan." }, { status: 401 });
    }

    const formData = await req.formData();
    const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const apiKey = process.env.BACKEND_API_KEY || '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

    const backendResponse = await fetch(`${apiUrl}/generate-report`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!backendResponse.ok) {
      throw new Error(`Backend returned ${backendResponse.status}`);
    }

    const backendData = await backendResponse.json();

    return NextResponse.json(backendData);
  } catch (err) {
    console.error("Report generation failed:", err);
    return NextResponse.json({ error: "Failed to connect to backend report generator" }, { status: 500 });
  }
}
