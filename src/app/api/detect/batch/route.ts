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

    // Deduct scans immediately
    await supabase.from('profiles').update({
      scans_today: scansToday + requiredCredits,
      last_scan_date: today,
      used_credits: (profile.used_credits ?? 0) + requiredCredits
    }).eq('id', user.id);
    
    // Simulate short network delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const results = files.map((file, idx) => {
      const isFake = idx % 2 === 0;
      return {
        file_name: file.name,
        media_type: file.type.split("/")[0] || "image",
        verdict: isFake ? "DEEPFAKE" : "AUTHENTIC",
        confidence: isFake ? 0.88 + (idx * 0.01) : 0.95 - (idx * 0.01),
        authenticity_score: isFake ? 12 + (idx * 2) : 95 - (idx * 2),
        risk_level: isFake ? "CRITICAL" : "LOW"
      };
    });

    const deepfakesCount = results.filter(r => r.verdict === "DEEPFAKE").length;
    const authenticCount = results.length - deepfakesCount;

    return NextResponse.json({
      summary: {
        total_files: files.length,
        images: files.filter(f => f.type.startsWith("image/")).length,
        videos: files.filter(f => f.type.startsWith("video/")).length,
        audio: files.filter(f => f.type.startsWith("audio/")).length,
        errors: 0,
        deepfakes_detected: deepfakesCount,
        suspicious_files: 0,
        authentic_files: authenticCount,
        average_confidence: 0.91,
        average_authenticity_score: 55.4,
        batch_verdict: deepfakesCount > 0 ? "HIGH_RISK" : "SECURE",
        total_processing_time: 3.2
      },
      results
    });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
