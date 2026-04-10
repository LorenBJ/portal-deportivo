import { fetchFootballFeed } from "./api-football";
import { getMockFeed } from "./mock-feed";
import { enrichMatches } from "./portal-core";

export async function getPortalFeed() {
  const liveFeed = await fetchFootballFeed();

  if (liveFeed.matches.length > 0) {
    return {
      matches: enrichMatches(liveFeed.matches).filter((match) => match.status !== "completed"),
      meta: liveFeed.meta
    };
  }

  if (liveFeed.meta.configured) {
    return {
      matches: [],
      meta: {
        ...liveFeed.meta,
        source: "error",
        provider: "api-football"
      }
    };
  }

  const fallback = getMockFeed(liveFeed.meta.reason ?? "provider_unavailable");
  return {
    ...fallback,
    meta: {
      ...fallback.meta,
      upstream: liveFeed.meta
    }
  };
}
