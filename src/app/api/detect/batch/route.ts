import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    // Forward the files to the Hugging Face / Python backend
    const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const apiKey = process.env.BACKEND_API_KEY || '';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout

      const backendResponse = await fetch(`${apiUrl}/detect/batch`, {
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
    } catch (fetchError) {
      console.error("Backend fetch failed:", fetchError);
      
      // Fallback response if the backend is unreachable
      return NextResponse.json({
        summary: {
          total_files: files.length,
          images: files.filter(f => f.type.startsWith("image/")).length,
          videos: files.filter(f => f.type.startsWith("video/")).length,
          audio: files.filter(f => f.type.startsWith("audio/")).length,
          errors: files.length,
          deepfakes_detected: 0,
          suspicious_files: 0,
          authentic_files: 0,
          average_confidence: 0,
          average_authenticity_score: 0,
          batch_verdict: "ERROR",
          total_processing_time: 0
        },
        results: files.map(file => ({
          file_name: file.name,
          media_type: file.type.split("/")[0] || "image",
          verdict: "ERROR",
          confidence: 0,
          authenticity_score: 0,
          risk_level: "UNKNOWN"
        }))
      }, { status: 503 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
