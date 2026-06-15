import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ detail: "Unauthorized. Please log in to perform a scan." }, { status: 401 });
    }

    // Check daily limits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('scans_today, last_scan_date, used_credits')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ detail: "Failed to load user profile." }, { status: 500 });
    }

    const dailyLimit = 10;
    const today = new Date().toISOString().split('T')[0];
    const isToday = profile.last_scan_date === today;
    const scansToday = isToday ? (profile.scans_today ?? 0) : 0;

    if (scansToday >= dailyLimit) {
      return NextResponse.json({ detail: "Daily limit reached. Please wait 24 hours or upgrade your plan." }, { status: 403 });
    }

    // Deduct scan immediately
    await supabase.from('profiles').update({
      scans_today: scansToday + 1,
      last_scan_date: today,
      used_credits: (profile.used_credits ?? 0) + 1
    }).eq('id', user.id);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const filename = file?.name || "media_file.png";
    const fileType = file?.type || "image/png";

    // Determine media type
    const isVideo = fileType.startsWith("video/") || filename.endsWith(".mp4") || filename.endsWith(".avi");
    const isAudio = fileType.startsWith("audio/") || filename.endsWith(".mp3") || filename.endsWith(".wav");

    // Forward the file to the Hugging Face / Python backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const backendResponse = await fetch(`${apiUrl}/detect/full`, {
        method: 'POST',
        body: formData,
      });

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
