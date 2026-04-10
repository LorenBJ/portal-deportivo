import { matches as mockMatches } from "./portal-data";
import { enrichMatches } from "./portal-core";

export function getMockFeed(reason = "fallback") {
  return {
    matches: enrichMatches(mockMatches),
    meta: {
      source: "mock",
      reason,
      generatedAt: new Date().toISOString(),
      provider: "mock-data",
      configured: false,
      liveCoverage: false
    }
  };
}
