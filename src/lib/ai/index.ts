import { mockProvider } from "@/lib/ai/mock-provider";
import type { AIProvider } from "@/lib/diagnostics";

export function getAIProvider(): AIProvider {
  // Provider selection stays behind this boundary so a hosted model can be added without changing the UI or route contract.
  switch (process.env.AI_PROVIDER) {
    case "mock":
      return mockProvider;
    case undefined:
      return mockProvider;
    default:
      throw new Error(`The ${process.env.AI_PROVIDER} diagnostic provider is not configured.`);
  }
}