import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const backendResponse = await fetch(`${apiUrl}/generate-report`, {
      method: 'POST',
      body: formData,
    });

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
