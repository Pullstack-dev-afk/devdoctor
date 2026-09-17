import { mockProvider } from "@/lib/ai/mock-provider";
import type { AIProvider } from "@/lib/diagnostics";

export function getAIProvider(): AIProvider {
  // Provider selection stays behind this boundary so a hosted model can be added without changing the UI or route contract.
  switch (process.env.AI_PROVIDER) {
    case "mock":
    default:
      return mockProvider;
  }
}