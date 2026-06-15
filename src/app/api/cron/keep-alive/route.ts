import { NextResponse } from 'next/server';
import axios from 'axios';

// Vercel Cron Jobs will trigger this route automatically
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://ayucancode-intrusionx-backend.hf.space";
    const startTime = Date.now();
    
    // Ping the backend health check endpoint
    const response = await axios.get(backendUrl);
    
    const duration = Date.now() - startTime;

    if (response.status === 200) {
      console.log(`[Cron] Keep-alive ping successful. Duration: ${duration}ms`);
      return NextResponse.json({ success: true, message: "Backend is awake", duration: `${duration}ms` });
    } else {
      console.warn(`[Cron] Keep-alive ping returned unexpected status: ${response.status}`);
      return NextResponse.json({ success: false, message: "Unexpected status from backend" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Cron] Keep-alive ping failed:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
