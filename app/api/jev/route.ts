import { queryJevSystemOne } from "@/lib/typesafe";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const hasServerKey = Boolean(process.env.TYPESAFE_API_KEY?.trim());
  return NextResponse.json({
    hasServerKey,
    driver: hasServerKey ? "cloud_jev" : "local_sim",
    model: hasServerKey ? "jev-latest" : "local-heuristic-v1",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { state, candidateAnalyses, apiKey, model } = body;

    if (!state || !candidateAnalyses) {
      return NextResponse.json(
        { error: "Missing state or candidateAnalyses in request payload" },
        { status: 400 }
      );
    }

    const decision = await queryJevSystemOne({
      state,
      analyses: candidateAnalyses,
      apiKey: apiKey || req.headers.get("x-typesafe-key") || process.env.TYPESAFE_API_KEY,
      model: model || "jev-latest",
    });

    return NextResponse.json(decision);
  } catch (error: any) {
    console.error("API /api/jev error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
