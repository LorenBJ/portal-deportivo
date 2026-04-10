import { fetchOddsApiFeed } from "./odds-api";
import { getMockFeed } from "./mock-feed";
import { enrichMatches } from "./portal-core";

export async function getPortalFeed() {
  const liveFeed = await fetchOddsApiFeed();

  if (liveFeed.matches.length > 0) {
    return {
      matches: enrichMatches(liveFeed.matches).filter((match) => match.status !== "completed"),
      meta: liveFeed.meta
    };
  }

  return getMockFeed(liveFeed.meta.reason ?? "provider_unavailable");
}
