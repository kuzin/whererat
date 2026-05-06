import { updateMovieOverride } from "@/lib/movie-edit-store";
import type { ImdbImage, ImdbRelatedTitle, ImdbReview, ImdbVideo, Movie } from "@/lib/whererat";

// ---------------------------------------------------------------------------
// HTML / text helpers
// ---------------------------------------------------------------------------

const HTML_ENTITIES: Record<string, string> = {
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&ldquo;": "\u201c",
  "&rdquo;": "\u201d",
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, (e) => HTML_ENTITIES[e] ?? e)
    .replace(/\s+/g, " ")
    .trim();
}

function mentionsRat(text: string): boolean {
  return /\brat(s|ty|like|proof|infested|catcher)?\b/i.test(text);
}

// ---------------------------------------------------------------------------
// OMDb
// ---------------------------------------------------------------------------

type OmdbFullDetails = {
  Title: string;
  Year: string;
  Rated?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Poster?: string;
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  Response: "True" | "False";
};

function omdbStr(val: string | undefined) {
  return val && val !== "N/A" ? val.trim() : undefined;
}

async function fetchOmdbData(
  imdbId: string,
  apiKey: string,
): Promise<OmdbFullDetails | undefined> {
  try {
    const url = new URL("https://www.omdbapi.com/");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("i", imdbId);
    url.searchParams.set("plot", "full");
    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return undefined;
    const json = (await res.json()) as OmdbFullDetails;
    return json.Response === "True" ? json : undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// IMDb trivia (public GraphQL, no key required)
// ---------------------------------------------------------------------------

const IMDB_GRAPHQL_URL = "https://api.graphql.imdb.com/";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchImdbTrivia(imdbId: string): Promise<any[]> {
  try {
    const query = `
      query {
        title(id: "${imdbId}") {
          trivia(first: 50) {
            edges {
              node {
                id
                displayableArticle {
                  body {
                    plaidHtml
                  }
                }
              }
            }
          }
        }
      }
    `;
    const res = await fetch(IMDB_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as Record<string, any>;
    return json?.data?.title?.trivia?.edges ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// IMDb user reviews (public GraphQL, no key required)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchImdbReviews(imdbId: string): Promise<any[]> {
  try {
    const query = `
      query {
        title(id: "${imdbId}") {
          reviews(first: 20) {
            edges {
              node {
                id
                author { nickName }
                summary { originalText }
                text { originalText { plainText } }
                authorRating
                submissionDate
              }
            }
          }
        }
      }
    `;
    const res = await fetch(IMDB_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as Record<string, any>;
    return json?.data?.title?.reviews?.edges ?? [];
  } catch {
    return [];
  }
}

/** Normalise an IMDb date string (various formats) to "YYYY-MM-DD". */
function normaliseImdbDate(raw: string | undefined): string {
  if (!raw) return "";
  // Already ISO-ish: "2003-04-12" or "2003-04-12T00:00:00Z"
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  // Human format: "12 April 2003"
  const humanMatch = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (humanMatch) {
    const months: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
    };
    const m = months[humanMatch[2].toLowerCase()];
    if (m) return `${humanMatch[3]}-${m}-${humanMatch[1].padStart(2, "0")}`;
  }
  return raw;
}

function extractReviews(edges: unknown[]): ImdbReview[] {
  const reviews: ImdbReview[] = [];
  for (const edge of edges) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node = (edge as any)?.node;
    if (!node) continue;

    const summary: string = stripHtml(node.summary?.originalText ?? "");
    const text: string = stripHtml(node.text?.originalText?.plainText ?? "");
    if (!summary && !text) continue;

    const author: string = node.author?.nickName ?? "Anonymous";
    const ratingRaw = node.authorRating;
    const rating = typeof ratingRaw === "number" ? ratingRaw : undefined;
    const date = normaliseImdbDate(node.submissionDate as string | undefined);
    const combined = `${summary} ${text}`;

    reviews.push({
      id: String(node.id ?? reviews.length),
      author,
      summary,
      text,
      rating,
      date,
      mentionsRat: mentionsRat(combined),
    });
  }
  return reviews;
}

function extractRatFacts(edges: unknown[]): string[] {
  const facts: string[] = [];
  for (const edge of edges) {
    if (facts.length >= 3) break;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: string = (edge as any)?.node?.displayableArticle?.body?.plaidHtml ?? "";
    if (!raw) continue;
    const plain = stripHtml(String(raw));
    if (plain && mentionsRat(plain)) facts.push(plain);
  }
  return facts;
}

// ---------------------------------------------------------------------------
// IMDb "more like this" recommendations (public GraphQL)
// ---------------------------------------------------------------------------

export async function fetchImdbRelated(imdbId: string): Promise<ImdbRelatedTitle[]> {
  try {
    const query = `
      query {
        title(id: "${imdbId}") {
          moreLikeThisTitles(first: 12) {
            edges {
              node {
                id
                titleText { text }
                releaseYear { year }
                primaryImage { url }
                ratingsSummary { aggregateRating }
              }
            }
          }
        }
      }
    `;
    const res = await fetch(IMDB_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edges: any[] = json?.data?.title?.moreLikeThisTitles?.edges ?? [];
    return edges.flatMap((edge) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const node = (edge as any)?.node;
      if (!node?.id || !node?.titleText?.text) return [];
      return [
        {
          id: String(node.id),
          title: String(node.titleText.text),
          year: node.releaseYear?.year ?? undefined,
          posterUrl: node.primaryImage?.url ?? undefined,
          rating: node.ratingsSummary?.aggregateRating ?? undefined,
        } satisfies ImdbRelatedTitle,
      ];
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// IMDb videos + images (public GraphQL, single combined query)
// ---------------------------------------------------------------------------

export async function fetchImdbMedia(
  imdbId: string,
): Promise<{ videos: ImdbVideo[]; images: ImdbImage[] }> {
  try {
    const query = `
      query {
        title(id: "${imdbId}") {
          primaryVideos(first: 10) {
            edges {
              node {
                id
                name { value }
                runtime { value }
                thumbnail { url }
                contentType { displayName { value } }
              }
            }
          }
          images(first: 24) {
            edges {
              node {
                id
                url
                width
                height
                caption { plainText }
              }
            }
          }
        }
      }
    `;
    const res = await fetch(IMDB_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { videos: [], images: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as Record<string, any>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoEdges: any[] = json?.data?.title?.primaryVideos?.edges ?? [];
    const videos: ImdbVideo[] = videoEdges.flatMap((edge) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const node = (edge as any)?.node;
      if (!node?.id) return [];
      return [
        {
          id: String(node.id),
          name: String(node.name?.value ?? "Video"),
          contentType: node.contentType?.displayName?.value ?? undefined,
          thumbnailUrl: node.thumbnail?.url ?? undefined,
          runtimeSeconds: node.runtime?.value ?? undefined,
        } satisfies ImdbVideo,
      ];
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageEdges: any[] = json?.data?.title?.images?.edges ?? [];
    const images: ImdbImage[] = imageEdges.flatMap((edge) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const node = (edge as any)?.node;
      if (!node?.id || !node?.url) return [];
      return [
        {
          id: String(node.id),
          url: String(node.url),
          width: typeof node.width === "number" ? node.width : undefined,
          height: typeof node.height === "number" ? node.height : undefined,
          caption: node.caption?.plainText ?? undefined,
        } satisfies ImdbImage,
      ];
    });

    return { videos, images };
  } catch {
    return { videos: [], images: [] };
  }
}

// ---------------------------------------------------------------------------
// Combined sync
// ---------------------------------------------------------------------------

/**
 * Pull fresh metadata from OMDb and rat facts from IMDb's public GraphQL API,
 * then write them as an override for the given movie.
 *
 * Safe to call fire-and-forget — all errors are swallowed so the caller is
 * never blocked on a network failure.
 */
export async function syncMovieFromImdb(movie: Movie): Promise<void> {
  const imdbId = movie.externalIds.imdb;
  if (!imdbId) return;

  const apiKey = process.env.OMDB_API_KEY;

  // Run all fetches in parallel
  const [omdb, triviaEdges, reviewEdges, imdbRelated, imdbMedia] = await Promise.all([
    apiKey ? fetchOmdbData(imdbId, apiKey) : Promise.resolve(undefined),
    fetchImdbTrivia(imdbId),
    fetchImdbReviews(imdbId),
    fetchImdbRelated(imdbId),
    fetchImdbMedia(imdbId),
  ]);

  const ratFacts = extractRatFacts(triviaEdges);
  const imdbReviews = extractReviews(reviewEdges);

  const runtimeMinutes = omdb?.Runtime
    ? Number.parseInt(omdb.Runtime, 10) || undefined
    : undefined;
  const genres = omdbStr(omdb?.Genre)
    ? omdb!.Genre!.split(",").map((g) => g.trim()).filter(Boolean)
    : undefined;
  const productionCountries = omdbStr(omdb?.Country)
    ? omdb!.Country!.split(",").map((c) => c.trim()).filter(Boolean)
    : undefined;
  const posterUrl =
    omdb?.Poster && omdb.Poster !== "N/A" ? omdb.Poster : undefined;

  await updateMovieOverride(movie.id, {
    ...(omdb && omdbStr(omdb.Title) ? { title: omdb.Title } : {}),
    ...(omdb?.Year ? { releaseYear: Number.parseInt(omdb.Year, 10) || movie.releaseYear } : {}),
    ...(runtimeMinutes ? { runtimeMinutes } : {}),
    ...(genres ? { genres } : {}),
    ...(omdb && omdbStr(omdb.Plot) ? { summary: omdb.Plot } : {}),
    ...(posterUrl ? { posterUrl } : {}),
    metadata: {
      ...movie.metadata,
      ...(omdb && omdbStr(omdb.Rated) ? { rating: omdb.Rated } : {}),
      ...(omdb && omdbStr(omdb.Director) ? { director: omdb.Director } : {}),
      ...(omdb && omdbStr(omdb.Writer) ? { writers: omdb.Writer } : {}),
      ...(omdb && omdbStr(omdb.Actors) ? { cast: omdb.Actors } : {}),
      ...(omdb && omdbStr(omdb.imdbRating) ? { imdbRating: omdb.imdbRating } : {}),
      ...(omdb && omdbStr(omdb.imdbVotes) ? { imdbVotes: omdb.imdbVotes } : {}),
      ...(omdb && omdbStr(omdb.Metascore) ? { metascore: omdb.Metascore } : {}),
      ...(omdb && omdbStr(omdb.Awards) ? { awards: omdb.Awards } : {}),
      ...(omdb && omdbStr(omdb.Language) ? { originalLanguage: omdb.Language } : {}),
      ...(productionCountries ? { productionCountries } : {}),
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: new Date().toISOString().slice(0, 10),
      ...(ratFacts.length > 0 ? { ratFacts } : {}),
      ...(imdbReviews.length > 0 ? { imdbReviews } : {}),
      ...(imdbRelated.length > 0 ? { imdbRelated } : {}),
      ...(imdbMedia.videos.length > 0 ? { imdbVideos: imdbMedia.videos } : {}),
      ...(imdbMedia.images.length > 0 ? { imdbImages: imdbMedia.images } : {}),
    },
  });
}
