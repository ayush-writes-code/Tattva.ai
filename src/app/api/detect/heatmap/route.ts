import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const apiKey = process.env.BACKEND_API_KEY || '';
    
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const filename = file?.name || "media_file.png";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 min timeout

      const arrayBuffer = await file.arrayBuffer();
      const newFormData = new FormData();
      newFormData.append("file", new Blob([arrayBuffer], { type: file.type }), filename);

      const backendResponse = await fetch(`${apiUrl}/detect/heatmap`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
        body: newFormData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!backendResponse.ok) {
        throw new Error(`Backend returned ${backendResponse.status}`);
      }

      const backendData = await backendResponse.json();

      return NextResponse.json(backendData);
    } catch (fetchError) {
      console.error("Backend fetch failed:", fetchError);
      return NextResponse.json({
        heatmap: null,
        error: "Backend connection failed"
      }, { status: 503 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
