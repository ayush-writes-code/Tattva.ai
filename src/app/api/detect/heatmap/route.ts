import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Forward the file to the Hugging Face / Python backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const formData = await req.formData();
      const backendResponse = await fetch(`${apiUrl}/detect/heatmap`, {
        method: 'POST',
        body: formData,
      });

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
