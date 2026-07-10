import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const filename = file?.name || "media_file.png";
    const fileType = file?.type || "image/png";

    // Determine media type
    const isVideo = fileType.startsWith("video/") || filename.endsWith(".mp4") || filename.endsWith(".avi");
    const isAudio = fileType.startsWith("audio/") || filename.endsWith(".mp3") || filename.endsWith(".wav");

    // Forward the file to the Hugging Face / Python backend
    // Use an internal server URL instead of the public one, and read backend API key
    const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const apiKey = process.env.BACKEND_API_KEY || '';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      // Next.js consumes the file stream when we call req.formData().
      // To forward it via fetch safely, we must reconstruct it.
      const arrayBuffer = await file.arrayBuffer();
      const newFormData = new FormData();
      newFormData.append("file", new Blob([arrayBuffer], { type: file.type }), filename);

      const backendResponse = await fetch(`${apiUrl}/detect/full`, {
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

      // Return the actual backend data. 
      // Note: If your Python backend doesn't return the exact JSON structure expected by the UI 
      // (like 'media_type', 'verdict', 'details.detection', etc.), you will need to map it here.
      // For now, we return exactly what the backend gives us, assuming it's built to match.
      return NextResponse.json({
        ...backendData,
        file_info: {
          filename,
          content_type: fileType,
          size_bytes: file?.size || 0
        }
      });
    } catch (fetchError) {
      console.error("Backend fetch failed:", fetchError);
      
      // Fallback response for UI testing if the backend is unreachable
      return NextResponse.json({
        media_type: isVideo ? "video" : isAudio ? "audio" : "image",
        verdict: "ERROR",
        confidence: 0,
        details: {
          detection: {
            label: "Backend Connection Failed",
            analysis: ["Could not reach the Hugging Face API at " + apiUrl]
          }
        },
        file_info: {
          filename,
          content_type: fileType,
          size_bytes: file?.size || 0
        }
      }, { status: 503 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
