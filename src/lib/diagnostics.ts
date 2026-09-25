export const focusAreas = ["Auto Detect", "Kubernetes", "Docker", "GitHub Actions", "Terraform", "AWS"] as const;
export type FocusArea = (typeof focusAreas)[number];

export type Diagnosis = {
  title: string;
  summary: string;
  confidence: number;
  severity: "critical" | "warning" | "info";
  why: string[];
  fix: string;
  checks: string[];
  references: string[];
};

export type DiagnoseRequest = { input: string; focusArea: FocusArea };

export type AIProvider = {
  diagnose(request: DiagnoseRequest): Promise<Diagnosis>;
};

export const MAX_INPUT_LENGTH = 20_000;

export function isDiagnosis(value: unknown): value is Diagnosis {
  if (!value || typeof value !== "object") return false;

  const diagnosis = value as Record<string, unknown>;
  return typeof diagnosis.title === "string"
    && typeof diagnosis.summary === "string"
    && typeof diagnosis.confidence === "number"
    && diagnosis.confidence >= 0
    && diagnosis.confidence <= 100
    && ["critical", "warning", "info"].includes(String(diagnosis.severity))
    && Array.isArray(diagnosis.why)
    && diagnosis.why.every((item) => typeof item === "string")
    && typeof diagnosis.fix === "string"
    && Array.isArray(diagnosis.checks)
    && diagnosis.checks.every((item) => typeof item === "string")
    && Array.isArray(diagnosis.references)
    && diagnosis.references.every((item) => typeof item === "string");
}