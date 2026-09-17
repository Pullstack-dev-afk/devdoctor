export const focusAreas = ["Kubernetes", "Docker", "GitHub Actions", "Terraform", "AWS"] as const;
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