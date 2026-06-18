import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text payload is required." }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    const internalApiKey = process.env.INTERNAL_API_KEY || "";

    const headers = {
      "Content-Type": "application/json",
    };

    if (internalApiKey) {
      headers["X-Internal-Key"] = internalApiKey;
    }

    const res = await fetch(`${backendUrl}/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Backend service error: ${res.status} - ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please verify your BACKEND_API_URL is correct and running." },
      { status: 500 }
    );
  }
}
