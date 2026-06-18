import { NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    
    // We try to ping the FastAPI backend (hitting the root static or documentation endpoint)
    const res = await fetch(`${backendUrl}/`, {
      method: "GET",
      // Short timeout to check status quickly
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok || res.status === 404) {
      // 404 is also fine, it means the server is reachable and active
      return NextResponse.json({ status: "online" });
    }
    
    return NextResponse.json({ status: "offline" }, { status: 503 });
  } catch (error) {
    console.error("Health check proxy error:", error);
    return NextResponse.json({ status: "offline" }, { status: 500 });
  }
}
