/**
 * Fetches TMDB titles tagged with keyword "rat" and writes
 * src/lib/generated/bulk-rat-seed.json for merge in whererat.ts.
 *
 * Enriches each sighting with:
 * - English Wikipedia intro (MediaWiki API, best-effort title match).
 * - OMDb short plot when OMDB_API_KEY is set.
 * - Reddit search snippets when WHERERAT_FETCH_REDDIT is not "false" (often blocked; gracefully skipped).
 *
 * Requires TMDB_READ_ACCESS_TOKEN (or TMDB_API_READ_ACCESS_TOKEN / TMDB_BEARER_TOKEN).
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import "./load-env";
import { getImdbTitleUrl, type Movie, type Sighting } from "@/lib/whererat";

const TMDB_API = "https://api.themoviedb.org/3";
const WP_API = "https://en.wikipedia.org/w/api.php";

const SCRIPT_UA =
  process.env.WHERERAT_EXTERNAL_UA?.trim() ||
  "WhereRatBulkSeed/1.0 (+https://github.com/kuzin/whererat; curator metadata pipeline)";

const RAT_KEYWORD_ID = 189359;
/** Up to MAX_KEYWORD_PAGES × ~20 titles (detail-fetched; IMDB ID required). */
const MAX_KEYWORD_PAGES = 45;
const TMDB_PAUSE_MS = 35;
const WIKI_PAUSE_MS = 220;
const REDDIT_PAUSE_MS = 900;

/** Rodent-ish lexicon for title / sentence picking (not exhaustive). */
const RODENT_RE =
  /\b(rats?\b|rattus|murinae|murine|rodent|rodents|vermin\b|mouse\b|mice\b|fancy\s+ratties)\b/i;

const SWARM_HINT_RE =
  /\b(swarm|colony|hundreds of|throng|plague\b|infest|overrun|horde\b)\b/i;

function redditPreviewImageUrl(data: Record<string, unknown>): string | undefined {
  try {
    const preview = data.preview as
      | {
          images?: Array<{
            source?: { url?: string };
            resolutions?: Array<{ url?: string }>;
          }>;
        }
      | undefined;
    const hi = preview?.images?.[0];
    const raw =
      hi?.source?.url ??
      hi?.resolutions?.[hi.resolutions.length - 1]?.url;
    if (typeof raw === "string" && raw.startsWith("https://")) {
      return raw.replace(/&amp;/g, "&");
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function titleWithImdb(headline: string, imdbId: string): string {
  const tag = imdbId.startsWith("tt") ? imdbId : `tt${imdbId}`;
  return clip(`${headline} · ${tag}`, 200);
}

function inferSpoiler(corpus: string, redditPostTitle?: string): boolean {
  const blob = `${redditPostTitle ?? ""}\n${corpus}`.toLowerCase();
  if (/\[spoiler\]|\bspoiler alert\b|\bspoilers\b/i.test(blob)) return true;
  if (
    /\b(post[- ]credits|mid[- ]credits|final shot|final scene|twist ending|plot twist|reveals that|killer('s)? identity|dies at the end|death of|gets murdered|commits suicide)\b/i.test(
      blob,
    )
  )
    return true;
  return false;
}

function slugifyTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function clip(value: string, max: number) {
  const t = value.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const trimmed = t.slice(0, max - 1);
  const chop = trimmed.replace(/\s+\S*$/, "");
  return `${chop}…`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function omdbApiKey(): string | undefined {
  const k = process.env.OMDB_API_KEY?.trim() || process.env.OMDb_API_KEY?.trim();
  return k || undefined;
}

function redditFetchEnabled() {
  return process.env.WHERERAT_FETCH_REDDIT?.trim().toLowerCase() !== "false";
}

async function fetchJsonSafe<T>(url: string): Promise<T | undefined> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": SCRIPT_UA,
        accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12500),
    });
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

type WikiSearchResp = {
  query?: {
    search?: Array<{ title: string }>;
  };
};

type WikiPage = {
  title?: string;
  extract?: string;
  missing?: string;
};

async function fetchWikipediaIntro(opts: {
  movieTitle: string;
  releaseYear: number;
}): Promise<{ title: string; extract: string; url: string } | undefined> {
  const qs = encodeURIComponent(`${opts.movieTitle} ${opts.releaseYear} film`);
  const searchUrl = `${WP_API}?action=query&format=json&origin=*&list=search&srsearch=${qs}&srlimit=3`;
  const search = await fetchJsonSafe<WikiSearchResp>(searchUrl);
  const hit = search?.query?.search?.[0]?.title?.trim();
  if (!hit) return undefined;

  const extractUrl =
    `${WP_API}?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1` +
    `&titles=${encodeURIComponent(hit)}`;

  type WikiExtractClassic = {
    query?: {
      pages?: Record<string, WikiPage>;
    };
  };

  const ex = await fetchJsonSafe<WikiExtractClassic>(extractUrl);
  const page = Object.values(ex?.query?.pages ?? {})[0];
  if (!page || typeof page.extract !== "string" || ("missing" in page && Boolean(page.missing)))
    return undefined;

  let extract = page.extract.replace(/\[[\s\S]*?\]/g, " ").trim();
  if (!extract || extract.length < 40) return undefined;

  const pageTitle = page.title || hit;

  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`;
  await sleep(WIKI_PAUSE_MS);
  return {
    title: pageTitle,
    extract,
    url,
  };
}

type OmdbDetails = {
  Plot?: string;
  Response?: string;
};

async function fetchOmdbPlot(imdbId: string): Promise<string | undefined> {
  const apiKey = omdbApiKey();
  if (!apiKey || !imdbId.startsWith("tt")) return undefined;
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("i", imdbId);
  url.searchParams.set("plot", "short");
  const data = await fetchJsonSafe<OmdbDetails>(url.toString());
  if (!data?.Plot || data.Plot === "N/A") return undefined;
  return clip(data.Plot.trim(), 800);
}

type RedditListing = {
  data?: {
    children?: Array<{
      data?: Record<string, unknown>;
    }>;
  };
};

async function fetchRedditSceneSnippets(
  movieTitle: string,
  releaseYear: number,
): Promise<{
  text?: string;
  url?: string;
  author?: string;
  postTitle?: string;
  previewUrl?: string;
}> {
  if (!redditFetchEnabled()) return {};
  const q = `"${movieTitle}" ${releaseYear} rat`;
  const url =
    `https://old.reddit.com/search.json?q=${encodeURIComponent(q)}` +
    `&sort=relevance&limit=12&t=all`;
  const data = await fetchJsonSafe<RedditListing>(url);
  const children = data?.data?.children ?? [];

  type Best = {
    rank: number;
    text: string;
    url?: string;
    author?: string;
    postTitle?: string;
    previewUrl?: string;
  };

  let best: Best | undefined;

  for (const c of children) {
    const d = (c?.data ?? {}) as Record<string, unknown>;
    const postTitle = String(d.title ?? "").trim();
    const body = String(d.selftext ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const chunk = `${postTitle} ${body}`;
    let rank = -1;
    if (chunk.length >= 44) {
      if (
        RODENT_RE.test(chunk) &&
        /\b(scene|appear|shows|shows up|during|minute|timing)\b/i.test(chunk)
      )
        rank = 6;
      else if (RODENT_RE.test(chunk)) rank = 4;
      else if (/\b(rat|cute|kitchen|tunnel|nest)\b/i.test(chunk)) rank = 1;
    }
    const chosen = clip(
      body.replace(/&amp;/g, "&").replace(/\[|\]/g, "") || postTitle,
      360,
    );
    if (rank < 4 || chosen.length < 38) continue;

    const permalink =
      typeof d.permalink === "string" && d.permalink.startsWith("/")
        ? `https://www.reddit.com${d.permalink}`
        : typeof d.permalink === "string"
          ? d.permalink
          : undefined;

    const candidate: Best = {
      rank,
      text: chosen,
      url: permalink,
      author: typeof d.author === "string" ? d.author : undefined,
      postTitle: postTitle || undefined,
      previewUrl: redditPreviewImageUrl(d),
    };

    if (
      !best ||
      candidate.rank > best.rank ||
      (candidate.rank === best.rank && candidate.text.length > best.text.length)
    ) {
      best = candidate;
    }
  }

  if (!best) return {};

  await sleep(REDDIT_PAUSE_MS);
  return {
    text: best.text,
    url: best.url,
    author: best.author,
    postTitle: best.postTitle,
    previewUrl: best.previewUrl,
  };
}

function pickRodentBackedTitle(corpus: string, movieTitle: string): string {
  const norm = corpus.replace(/\s+/g, " ").trim();
  const sentences =
    norm.length > 0
      ? norm.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
      : [];

  const pickSentence = (): string | undefined => {
    for (const s of sentences) {
      if (
        RODENT_RE.test(s) &&
        !/^this article\b/i.test(s) &&
        s.length >= 22 &&
        s.length <= 360
      ) {
        return s;
      }
    }
    for (const s of sentences) {
      if (
        /^(the\s+film|movie|premise|premiered)/i.test(s) &&
        RODENT_RE.test(s) &&
        s.length >= 18
      ) {
        return s;
      }
    }
    const join = sentences.join(" ").trim();
    if (join && RODENT_RE.test(join)) return clip(join, 132);
    return undefined;
  };

  const fromCorpus = pickSentence();
  if (fromCorpus) return clip(fromCorpus, 118);

  return clip(
    `${movieTitle}: rat / rodent link (listed on TMDB with the keyword “rat”)`,
    118,
  );
}

function buildFieldReport(opts: {
  movieTitle: string;
  imdbId: string;
  tmdbOverview: string;
  wikiNote?: string;
  wikiUrl?: string;
  omdbPlot?: string;
  reddit?: { text: string; url?: string; author?: string };
  percent: string;
  rodentHypothesis: string;
  spoilerLikely: boolean;
}): string {
  const imdbUrl = getImdbTitleUrl(opts.imdbId);
  const parts: string[] = [];

  parts.push(
    "**Field report (automated staging — not a verified shot list)**",
    `Catalog links this title because TMDB’s **“rat”** keyword matched. Everything below is evidence gathering until a curator confirms the exact shot.`,
  );

  parts.push(
    `**IMDb title record:** [${opts.imdbId}](${imdbUrl})`,
    `**Working rodent hypothesis:** ${opts.rodentHypothesis}`,
  );

  parts.push(
    `### Approximate placement in the film`,
    `Stake in the sand: **~${opts.percent}** through the listed runtime (slider-derived placeholder). Replace with a precise cue after review.`,
  );

  const overview = opts.tmdbOverview.trim();
  parts.push(
    `### Narrative / marketing context (may omit rodents)`,
    overview
      ? clip(overview, 720)
      : "_TMDB returned no overview text._",
  );

  if (opts.wikiNote?.trim()) {
    const cite = opts.wikiUrl?.trim() ? ` Full article: ${opts.wikiUrl.trim()}` : "";
    parts.push(
      `### Encyclopedia-style summary (Wikipedia intro)`,
      `${clip(opts.wikiNote.trim(), 760)}${cite}`,
    );
  }

  if (opts.omdbPlot?.trim()) {
    parts.push(
      `### OMDb short plot`,
      `${clip(opts.omdbPlot.trim(), 660)} _(requires OMDB_API_KEY when regenerating.)_`,
    );
  }

  if (opts.reddit?.text?.trim()) {
    const who = opts.reddit.author?.trim()
      ? ` Thread author on Reddit: **u/${opts.reddit.author.trim()}** (also mirrored under “Submitted by”).`
      : "";
    const link = opts.reddit.url?.trim()
      ? ` Permalink: ${opts.reddit.url.trim()}`
      : "";
    parts.push(
      `### Community lead (Reddit — informal, unverified)`,
      `“${clip(opts.reddit.text.trim(), 420)}…”${who}${link}`,
    );
  }

  parts.push(
    `### Evidence bundle attached to this report`,
    `1. **TMDB imagery:** Official posters / backdrops are studio assets — they help orientation but _do not prove_ a rat is on-screen at this timestamp.`,
    `2. **Optional Reddit preview frame:** If present, it is a community-uploaded thumbnail; treat as clue, not proof.`,
  );

  parts.push(
    `### Spoiler screening (heuristic)`,
    opts.spoilerLikely
      ? "**Flagged:** Automated scan thinks late-film twists, deaths, or Reddit spoiler tags may apply — keep this card spoiler-blocked until reviewed."
      : "**Not auto-flagged:** Still assume late-film surprises until you’ve verified.",
  );

  parts.push(
    `### Next curator steps`,
    `Watch the print (or an authorized digital edition), log the first unmistakable rodent beat, tighten copy, and flip verification once satisfied.`,
  );

  return parts.join("\n\n");
}

function prominenceFromCorpus(corpus: string): Sighting["prominence"] {
  if (
    /\b(costar|chef|kitchen|buddy|famil(?:y)?|heroes?|voices?)\b[\s\S]{0,180}\b(rat|rats|mouse)\b/i.test(
      corpus,
    )
  )
    return "scene-stealer";
  if (SWARM_HINT_RE.test(corpus) && RODENT_RE.test(corpus)) return "scene-stealer";
  return "background";
}

function confidenceFromCorpus(hasRodentMention: boolean): Sighting["confidence"] {
  return hasRodentMention ? "likely" : "needs-source";
}

function estimateRatCount(corpus: string): number {
  if (!RODENT_RE.test(corpus)) return 1;
  let n = 6;
  if (SWARM_HINT_RE.test(corpus)) n = 36;
  if (/\b(animation|animated|cartoon)\b/i.test(corpus)) n = Math.max(n, 12);
  return Math.min(9999, Math.max(1, n));
}

function buildRodentHypothesisLine(corpus: string, movieTitle: string): string {
  const headline = pickRodentBackedTitle(corpus, movieTitle);
  if (RODENT_RE.test(headline)) return headline;
  return `${movieTitle}: TMDB keyword “rat” matched while upstream blurbs stayed rodent-agnostic — confirm on-screen rats during review.`;
}

type TmdbImagesPayload = {
  backdrops?: Array<{ file_path?: string | null; vote_average?: number }>;
};

async function fetchTmdbBackdropStills(
  tmdbNumericId: number,
  movieTitle: string,
  token: string,
): Promise<Array<{ url: string; alt: string }>> {
  const data = await tmdbFetch<TmdbImagesPayload>(
    `/movie/${tmdbNumericId}/images`,
    token,
  );
  const backs = [...(data.backdrops ?? [])]
    .filter((b): b is typeof b & { file_path: string } =>
      Boolean(b.file_path && typeof b.file_path === "string"),
    )
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .slice(0, 3);

  return backs.map((b, i) => ({
    url: `https://image.tmdb.org/t/p/w780${b.file_path}`,
    alt: `${movieTitle}: TMDB backdrop ${i + 1} (studio still — verify rats appear).`,
  }));
}

function mergeEvidenceSlots(opts: {
  posterPath: string | null;
  /** When `posterPath` is missing (e.g. no TMDB art), use a full URL (e.g. seed placeholder). */
  fallbackPosterUrl?: string;
  movieTitle: string;
  backdropSlots: Array<{ url: string; alt: string }>;
  redditPreview?: string;
}): Array<{ url: string; alt: string }> {
  const out: Array<{ url: string; alt: string }> = [];
  const seen = new Set<string>();
  const push = (url: string, alt: string) => {
    const key = url.split("?")[0] ?? url;
    if (seen.has(key) || out.length >= 5) return;
    seen.add(key);
    out.push({ url, alt });
  };

  if (opts.posterPath) {
    push(
      `https://image.tmdb.org/t/p/w780${opts.posterPath}`,
      `${opts.movieTitle}: TMDB poster (marketing frame).`,
    );
  } else if (opts.fallbackPosterUrl?.trim().startsWith("http")) {
    push(
      opts.fallbackPosterUrl.trim(),
      `${opts.movieTitle}: catalog poster (TMDB art unavailable — fallback).`,
    );
  }
  for (const b of opts.backdropSlots) push(b.url, b.alt);
  if (opts.redditPreview?.startsWith("https://")) {
    push(
      opts.redditPreview,
      `${opts.movieTitle}: Reddit preview thumbnail from quoted thread.`,
    );
  }
  return out;
}

function tmdbBearer(): string | undefined {
  return (
    process.env.TMDB_READ_ACCESS_TOKEN?.trim() ||
    process.env.TMDB_API_READ_ACCESS_TOKEN?.trim() ||
    process.env.TMDB_BEARER_TOKEN?.trim()
  );
}

async function tmdbFetch<T>(pathAndQuery: string, token: string): Promise<T> {
  const res = await fetch(`${TMDB_API}${pathAndQuery}`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`TMDB ${pathAndQuery}: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

type KeywordMoviesPage = {
  page: number;
  total_pages: number;
  results: { id: number }[];
};

type MovieDetail = {
  id: number;
  title: string;
  overview: string;
  runtime: number | null;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  imdb_id: string | null;
};

function posterToneForId(id: number): string {
  const tones = [
    "bg-amber-500",
    "bg-stone-600",
    "bg-amber-800",
    "bg-orange-700",
    "bg-yellow-600",
    "bg-lime-700",
    "bg-emerald-700",
    "bg-teal-700",
  ];
  return tones[Math.abs(id) % tones.length] ?? "bg-stone-600";
}

function percentForMovieId(id: number): string {
  const pct = (Math.abs(id * 37) % 86) + 7;
  return `${pct}%`;
}

function sceneTypeForGenres(genres: string[]): Sighting["sceneType"] {
  const g = genres.join(" ").toLowerCase();
  if (g.includes("animation")) return "animated";
  return "live-action";
}

function buildMovie(detail: MovieDetail): Movie {
  const year = Number.parseInt(detail.release_date?.slice(0, 4) ?? "", 10);
  const releaseYear = Number.isFinite(year) && year > 1800 ? year : 1900;
  const runtimeMinutes =
    detail.runtime && detail.runtime > 0 ? detail.runtime : 92;
  const genres =
    detail.genres?.map((g) => g.name).filter(Boolean) ?? ["Uncategorized"];
  const slugBase = `${slugifyTitle(detail.title)}-${releaseYear}`;
  const slug = slugBase || `tmdb-${detail.id}`;

  const posterUrl = detail.poster_path
    ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
    : "https://placehold.co/600x900/292524/fef3c7/png?text=Rat+movie";
  const backdropUrl = detail.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`
    : posterUrl;

  return {
    id: slug,
    slug,
    title: detail.title,
    releaseYear,
    runtimeMinutes,
    genres,
    posterTone: posterToneForId(detail.id),
    posterUrl,
    backdropUrl,
    posterAlt: `Poster image for ${detail.title}.`,
    externalIds: {
      tmdb: String(detail.id),
      imdb: detail.imdb_id!,
    },
    metadata: {
      tagline: "",
      rating: "",
      director: "",
      originalLanguage: "",
      productionCountries: [],
      metadataProvider: "TMDB keyword seed",
      lastSyncedAt: new Date().toISOString().slice(0, 10),
    },
    summary:
      detail.overview?.trim() ||
      "Imported from TMDB because the title is tagged with the “rat” keyword; overview unavailable.",
  };
}

async function buildSighting(
  detail: MovieDetail,
  movie: Movie,
  token: string,
): Promise<Sighting> {
  const posterStill = detail.poster_path
    ? `https://image.tmdb.org/t/p/w780${detail.poster_path}`
    : movie.posterUrl;

  const imdbId = detail.imdb_id!.trim();
  const releaseYear = movie.releaseYear;
  const wiki = await fetchWikipediaIntro({
    movieTitle: detail.title,
    releaseYear,
  });
  await sleep(40);
  const omdbPlot = await fetchOmdbPlot(imdbId);
  await sleep(35);
  const reddit = await fetchRedditSceneSnippets(detail.title, releaseYear);

  let backdropSlots: Array<{ url: string; alt: string }> = [];
  try {
    await sleep(TMDB_PAUSE_MS);
    backdropSlots = await fetchTmdbBackdropStills(
      detail.id,
      detail.title,
      token,
    );
  } catch {
    backdropSlots = [];
  }
  await sleep(TMDB_PAUSE_MS);

  const overview = detail.overview?.trim() ?? "";
  const corpus = `${overview}\n${wiki?.extract ?? ""}\n${omdbPlot ?? ""}\n${reddit?.text ?? ""}`;
  const rodentCoreBlob = `${overview}${wiki?.extract ?? ""}${omdbPlot ?? ""}`;
  const hasRodentCoreBlob = rodentCoreBlob.length === 0 ? false : RODENT_RE.test(rodentCoreBlob);
  const hasRedditRodentHint =
    !!(reddit?.text?.trim()?.length && RODENT_RE.test(reddit.text));

  const pct = percentForMovieId(detail.id);
  const spoilerLikely = inferSpoiler(corpus, reddit?.postTitle);
  const title = titleWithImdb(pickRodentBackedTitle(corpus, detail.title), imdbId);

  const sourceIds = [
    "tmdb-keyword-rat",
    ...(wiki ? (["wikipedia-en-intro"] as const) : []),
    ...(omdbPlot ? (["omdb-plot-short"] as const) : []),
    ...(reddit?.text?.trim()?.length ? (["reddit-snippet-unverified"] as const) : []),
  ];

  const description = buildFieldReport({
    movieTitle: detail.title,
    imdbId,
    tmdbOverview: overview || "Unavailable.",
    wikiNote: wiki?.extract,
    wikiUrl: wiki?.url,
    omdbPlot,
    reddit: reddit?.text
      ? {
          text: reddit.text,
          url: reddit.url,
          author: reddit.author,
        }
      : undefined,
    percent: pct,
    rodentHypothesis: buildRodentHypothesisLine(corpus, detail.title),
    spoilerLikely,
  });

  const images = mergeEvidenceSlots({
    posterPath: detail.poster_path,
    fallbackPosterUrl: movie.posterUrl,
    movieTitle: detail.title,
    backdropSlots,
    redditPreview: reddit?.previewUrl,
  });

  if (images.length === 0) {
    images.push({
      url: posterStill,
      alt: `${detail.title}: catalog poster still (evidence bundle fallback).`,
    });
  }

  return {
    id: `bulk-rat-${detail.id}`,
    movieId: movie.id,
    timestamp: pct,
    title,
    description,
    prominence: prominenceFromCorpus(corpus),
    sceneType: sceneTypeForGenres(movie.genres),
    spoiler: spoilerLikely,
    confidence: confidenceFromCorpus(hasRodentCoreBlob || hasRedditRodentHint),
    verificationState: "pending",
    verifiedBy: "WhereRat seed pipeline",
    sourceIds,
    approximateRatCount: estimateRatCount(corpus),
    images,
    ...(reddit?.author?.trim()
      ? { submitterName: `u/${reddit.author.trim()} · Reddit` }
      : {}),
  };
}

async function main() {
  const token = tmdbBearer();
  if (!token) {
    console.error(
      "Missing TMDB_READ_ACCESS_TOKEN (or TMDB_API_READ_ACCESS_TOKEN / TMDB_BEARER_TOKEN).",
    );
    process.exitCode = 1;
    return;
  }

  const listIds: number[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_KEYWORD_PAGES) {
    const pageData = await tmdbFetch<KeywordMoviesPage>(
      `/keyword/${RAT_KEYWORD_ID}/movies?page=${page}&language=en-US`,
      token,
    );
    totalPages = pageData.total_pages;
    for (const row of pageData.results) {
      if (!listIds.includes(row.id)) listIds.push(row.id);
    }
    page += 1;
    await sleep(20);
  }

  const moviesOut: Movie[] = [];
  const sightingsOut: Sighting[] = [];
  const seenSlug = new Set<string>();

  console.log(`Enrich + detail fetch for ${listIds.length} movies…`);

  for (let i = 0; i < listIds.length; i += 1) {
    const id = listIds[i]!;
    if (i % 10 === 0) {
      process.stdout.write(`\rMovie ${i + 1}/${listIds.length}`);
    }

    let detail: MovieDetail;
    try {
      detail = await tmdbFetch<MovieDetail>(
        `/movie/${id}?language=en-US`,
        token,
      );
    } catch (e) {
      console.warn(`Skip movie ${id}:`, e);
      continue;
    }

    if (!detail.imdb_id?.trim()) {
      await sleep(TMDB_PAUSE_MS);
      continue;
    }

    const movie = buildMovie(detail);
    if (seenSlug.has(movie.slug)) {
      movie.id = `${movie.slug}-tmdb-${detail.id}`;
      movie.slug = movie.id;
    }
    seenSlug.add(movie.slug);

    moviesOut.push(movie);
    sightingsOut.push(await buildSighting(detail, movie, token));
    await sleep(TMDB_PAUSE_MS);
  }
  console.log("\nDone detail + enrichment.");

  const outPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "generated",
    "bulk-rat-seed.json",
  );
  await writeFile(
    outPath,
    `${JSON.stringify({ movies: moviesOut, sightings: sightingsOut }, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Wrote ${moviesOut.length} movies and ${sightingsOut.length} sightings → ${outPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
