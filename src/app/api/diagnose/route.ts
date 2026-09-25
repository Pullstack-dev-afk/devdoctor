import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { focusAreas, isDiagnosis, MAX_INPUT_LENGTH, type DiagnoseRequest } from "@/lib/diagnostics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as unknown;
    const inputValue = body && typeof body === "object" && !Array.isArray(body) && "input" in body ? body.input : null;
    const focusAreaValue = body && typeof body === "object" && !Array.isArray(body) && "focusArea" in body ? body.focusArea : null;
    const input = typeof inputValue === "string" ? inputValue.replaceAll("\0", "").trim() : "";
    const focusArea = typeof focusAreaValue === "string" ? focusAreaValue : "";
    if (!input || !focusAreas.includes(focusArea as DiagnoseRequest["focusArea"])) {
      return NextResponse.json({ error: "Add an error or config and choose a focus area." }, { status: 400 });
    }
    if (input.length > MAX_INPUT_LENGTH) {
      return NextResponse.json({ error: `Keep the input under ${MAX_INPUT_LENGTH.toLocaleString()} characters.` }, { status: 400 });
    }

    const diagnosis = await getAIProvider().diagnose({ input, focusArea: focusArea as DiagnoseRequest["focusArea"] });
    if (!isDiagnosis(diagnosis)) {
      return NextResponse.json({ error: "The diagnostic provider returned an invalid response." }, { status: 502 });
    }
    return NextResponse.json(diagnosis);
  } catch (reason) {
    const message = reason instanceof Error && reason.message ? reason.message : "We could not analyze that input. Please try again.";
    const status = message.includes("not configured") || message.includes("Unsupported") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}