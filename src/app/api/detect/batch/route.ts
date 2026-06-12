import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    
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
