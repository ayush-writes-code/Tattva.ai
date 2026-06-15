import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ detail: "Unauthorized. Please log in to perform a scan." }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    
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
    
    const requiredCredits = files.length;

    if (scansToday + requiredCredits > dailyLimit) {
      return NextResponse.json({ detail: `Daily limit reached. You need ${requiredCredits} scans but only have ${dailyLimit - scansToday} left for today.` }, { status: 403 });
    }

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

      // Backend succeeded, atomically increment the scan count using RPC
      const { data: allowed, error: rpcError } = await supabase.rpc('increment_scan_credit', { user_id: user.id, amount: requiredCredits });
      if (rpcError) {
        console.error("Failed to increment scan credit via RPC:", rpcError);
        // Fallback to update if RPC not created yet
        await supabase.from('profiles').update({
          scans_today: scansToday + requiredCredits,
          last_scan_date: today,
          used_credits: (profile.used_credits || 0) + requiredCredits
        }).eq('id', user.id);
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
