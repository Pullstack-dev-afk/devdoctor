import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { focusAreas, type DiagnoseRequest } from "@/lib/diagnostics";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<DiagnoseRequest>;
    if (!body.input?.trim() || !body.focusArea || !focusAreas.includes(body.focusArea)) {
      return NextResponse.json({ error: "Add an error or config and choose a focus area." }, { status: 400 });
    }

    const diagnosis = await getAIProvider().diagnose({ input: body.input.trim(), focusArea: body.focusArea });
    return NextResponse.json(diagnosis);
  } catch {
    return NextResponse.json({ error: "We could not analyze that input. Please try again." }, { status: 500 });
  }
}