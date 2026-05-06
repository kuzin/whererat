import bulkRatSeed from "./generated/bulk-rat-seed.json";

export type RatProminence = "blink-and-miss" | "background" | "scene-stealer";
export type SceneType =
  | "live-action"
  | "animated"
  | "symbolic"
  | "swarm"
  | "final-shot";
export type Confidence = "needs-source" | "likely" | "verified";
export type VerificationState = "verified" | "pending" | "rejected";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export const MOVIE_SIGHTINGS_PAGE_SIZE = 10;

export const movieSightingsSortOptions = [
  "newest",
  "rats",
  "appearance-early",
  "appearance-late",
] as const;

export type MovieSightingsSortOption = (typeof movieSightingsSortOptions)[number];

export const movieSightingsSortLabels: Record<MovieSightingsSortOption, string> = {
  newest: "Latest submission",
  rats: "Most rats (est.)",
  "appearance-early": "Earliest in film",
  "appearance-late": "Latest in film",
};

export type Movie = {
  id: string;
  slug: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  genres: string[];
  posterTone: string /** Tailwind bg-* class for poster accent stripe */;
  posterUrl: string;
  backdropUrl: string;
  posterAlt: string;
  externalIds: {
    tmdb?: string;
    imdb: string;
  };
  metadata: {
    tagline: string;
    rating: string;
    director: string;
    originalLanguage: string;
    productionCountries: string[];
    metadataProvider:
      | "IMDb seed"
      | "OMDb via IMDb ID"
      | "Licensed IMDb data"
      | "TMDB keyword seed";
    lastSyncedAt: string;
    /** Screenplay / story credits (IMDb-style line). */
    writers?: string;
    /** Principal cast, comma-separated. */
    cast?: string;
    /** IMDb user rating, e.g. "8.2". */
    imdbRating?: string;
    /** Vote count snapshot for display, e.g. "935,000". */
    imdbVotes?: string;
    /** Metacritic Metascore (0–100). */
    metascore?: string;
    /** Short awards / honors line from public listings. */
    awards?: string;
  };
  summary: string;
};

export type Source = {
  id: string;
  label: string;
  url?: string;
  note: string;
};

export type SightingImageSlot = {
  url: string;
  alt?: string;
};

export type Sighting = {
  id: string;
  movieId: string;
  /** Moment the rat first appears, stored as percent (e.g. "42%") or legacy timecode. */
  timestamp: string;
  /** Short headline for the card (separate from scene description). */
  title?: string;
  description: string;
  prominence: RatProminence;
  sceneType: SceneType;
  spoiler: boolean;
  confidence: Confidence;
  verificationState: VerificationState;
  verifiedBy: string;
  sourceIds: string[];
  /** Optional curator note shown on the title page only when set. */
  curatorNote?: string;
  /** Estimated rats on screen at this timestamp (shown on sightings; fuels “most rats” sort). */
  approximateRatCount?: number;
  /**
   * Up to five images for this sighting (carousel).
   * `imageUrl` / `imageAlt` remain supported for legacy seed rows.
   */
  images?: SightingImageSlot[];
  /** Hosted sighting photo; omit (or omit only for catalog) when there is no still. */
  imageUrl?: string;
  imageAlt?: string;
  /** Community display name shown as “Submitted by …” when set (catalog seeds usually omit). */
  submitterName?: string;
  /** ISO timestamp from moderator review when promoted from an approved submission (for sorting). */
  submissionReviewedAtISO?: string;
};

export function clampApproximateRatCount(value: unknown): number {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(9999, Math.floor(n));
}

export type Submission = {
  id: string;
  movieTitle: string;
  movieYear?: number;
  imdbId?: string;
  /** Submission moment, stored as percent (e.g. "42%") or legacy timecode. */
  timestamp: string;
  /** Sighting headline shown on the movie page when promoted to the catalog. */
  title?: string;
  description: string;
  spoiler: boolean;
  /** Contributor/moderator estimate of how many rats appear in the cited moment */
  approximateRatCount: number;
  status: SubmissionStatus;
  submittedBy: string;
  /** Optional contact shared with moderators; not shown on public cards. */
  submitterEmail?: string;
  /** Optional curator message shown on approved sightings. */
  curatorNote?: string;
  duplicateHint?: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Up to five queued images (URLs after upload). First also mirrored to `imageUrl` for moderation thumb. */
  images?: SightingImageSlot[];
  moviePosterUrl?: string;
};

export type ReviewAction = {
  id: string;
  submissionId: string;
  movieTitle: string;
  action: "approved" | "edited" | "edited and approved" | "merged duplicate" | "rejected";
  moderatorId: string;
  moderatorName: string;
  reviewedAt: string;
  note: string;
};

export function normalizeImdbId(value: string) {
  const match = value.trim().match(/tt\d{7,9}/i);
  return match?.[0].toLowerCase() ?? "";
}

export function getImdbTitleUrl(imdbId: string) {
  return `https://www.imdb.com/title/${imdbId}/`;
}

/** Comma-split credit lines used for writers, directors, and cast. */
export function splitImdbCreditSegments(line: string): string[] {
  return line
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/**
 * Name search on IMDb (no `nm` IDs in seed data). Trailing parts like "(voice)"
 * are trimmed from the query for better matches while the link label stays full text.
 */
export function getImdbNameSearchUrl(creditSegment: string): string {
  const trimmed = creditSegment.trim();
  const stripped = trimmed.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const q = stripped.length > 0 ? stripped : trimmed;
  const url = new URL("https://www.imdb.com/find/");
  url.searchParams.set("q", q);
  url.searchParams.set("s", "nm");
  return url.toString();
}

export function formatRuntimeMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) {
    return "";
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) {
    return `${m} min`;
  }
  if (m === 0) {
    return `${h} hr`;
  }
  return `${h} hr ${m} min`;
}

const PLACEHOLDER_STILL_PATTERN = /placehold\.co\//i;

function isNonPlaceholderImageUrl(url: string): boolean {
  const t = url.trim();
  return Boolean(t) && !PLACEHOLDER_STILL_PATTERN.test(t);
}

/**
 * Non-placeholder image refs for a sighting, max five: `images[]` plus legacy `imageUrl`.
 */
export function getSightingImageRefs(sighting: Sighting): SightingImageSlot[] {
  const out: SightingImageSlot[] = [];
  const seen = new Set<string>();
  const push = (url: string, alt?: string) => {
    if (!isNonPlaceholderImageUrl(url)) return;
    const key = url.trim().split("?")[0] ?? url.trim();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ url: url.trim(), alt: alt?.trim() || undefined });
  };

  for (const slot of sighting.images ?? []) {
    if (out.length >= 5) break;
    push(slot.url, slot.alt);
  }
  if (out.length < 5 && sighting.imageUrl) {
    push(sighting.imageUrl, sighting.imageAlt);
  }
  return out.slice(0, 5);
}

/** Show a hero image only for real uploads, not SVG/placeholder stubs. */
export function sightingHasUploadedImage(sighting: Sighting): boolean {
  return getSightingImageRefs(sighting).length > 0;
}

/** Like `getSightingImageRefs` for moderator queue rows. */
export function getSubmissionImageRefs(submission: Submission): SightingImageSlot[] {
  const out: SightingImageSlot[] = [];
  const seen = new Set<string>();
  const push = (url: string, alt?: string) => {
    if (!isNonPlaceholderImageUrl(url)) return;
    const key = url.trim().split("?")[0] ?? url.trim();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ url: url.trim(), alt: alt?.trim() || undefined });
  };

  for (const slot of submission.images ?? []) {
    if (out.length >= 5) break;
    push(slot.url, slot.alt);
  }
  if (out.length < 5 && submission.imageUrl) {
    push(submission.imageUrl, submission.imageAlt);
  }
  return out.slice(0, 5);
}

/** Human line for on-card rat estimate. */
export function formatApproximateRatLine(count: number): string {
  const n = Math.max(1, Math.min(9999, Math.floor(Number(count))));
  return n === 1 ? "Approx. 1 rat" : `Approx. ${n} rats`;
}

function parseColonTimestamp(value: string): { h: number; m: number; s: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const chunks = trimmed.split(":").map((x) => Number.parseInt(x.trim(), 10));
  if (!chunks.every((n) => Number.isFinite(n) && n >= 0)) return null;
  if (chunks.length === 3) {
    return { h: chunks[0]!, m: chunks[1]!, s: chunks[2]! };
  }
  if (chunks.length === 2) {
    return { h: 0, m: chunks[0]!, s: chunks[1]! };
  }
  return null;
}

function parsePercentIntoMovie(value: string): number | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,3})(?:\s*%)?$/);
  if (!match) return null;
  const percent = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(percent)) return null;
  return Math.max(0, Math.min(100, percent));
}

export function getSightingTimestampPercent(value: string): number | null {
  return parsePercentIntoMovie(value);
}

export function normalizeSightingTimestampInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const percent = parsePercentIntoMovie(trimmed);
  if (percent === null) return trimmed;
  return `${percent}%`;
}

export function formatSightingMomentDisplay(raw: string): string {
  const percent = parsePercentIntoMovie(raw);
  if (percent !== null) return `${percent}% into movie`;
  return formatOneTimecode(raw.trim());
}

function formatClockParts(parts: { h: number; m: number; s: number }): string {
  const sec = parts.s.toString().padStart(2, "0");
  if (parts.h === 0) {
    return `${parts.m}m ${sec}s`;
  }
  const min = parts.m.toString().padStart(2, "0");
  return `${parts.h}h ${min}m ${sec}s`;
}

function formatOneTimecode(raw: string): string {
  const parsed = parseColonTimestamp(raw);
  if (!parsed) return raw.trim();
  return formatClockParts(parsed);
}

/** Human-friendly film time from a `HH:MM:SS` or `MM:SS` string. */
export function formatColonTimecodeDisplay(raw: string): string {
  return formatSightingMomentDisplay(raw);
}

/**
 * Human-friendly starting time for the sighting: "17m 42s" or "1h 02m 15s".
 */
export function formatSightingStartingTimeDisplay(sighting: Sighting): string {
  return formatColonTimecodeDisplay(sighting.timestamp);
}

/** @deprecated Use {@link formatSightingStartingTimeDisplay}. */
export function formatSightingTimecodeDisplay(sighting: Sighting): string {
  return formatSightingStartingTimeDisplay(sighting);
}

function firstMeaningfulLine(value: string): string {
  const t = value.trim();
  if (!t) return "";
  const sentence = t.match(/^[\s\S]{1,200}?[.!?](?=\s|$)/);
  if (sentence) return sentence[0].trim();
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

/** Headline for a sighting card (explicit title, or a short line from the description). */
export function getSightingCardHeadline(sighting: Sighting): string {
  const raw = sighting.title?.trim();
  if (raw) return raw;
  const fromDesc = firstMeaningfulLine(sighting.description);
  return fromDesc || "Sighting";
}

export function getSubmissionSightingTitle(submission: Submission): string {
  const raw = submission.title?.trim();
  if (raw) return raw;
  return firstMeaningfulLine(submission.description) || "Sighting";
}

function placeholderImage(
  size: string,
  background: string,
  foreground: string,
  text: string,
) {
  return `https://placehold.co/${size}/${background}/${foreground}/png?text=${encodeURIComponent(text)}`;
}

const moviesCatalogSeed: Movie[] = [
  {
    id: "ratatouille-2007",
    slug: "ratatouille-2007",
    title: "Ratatouille",
    releaseYear: 2007,
    runtimeMinutes: 111,
    genres: ["Animation", "Comedy", "Family"],
    posterTone: "bg-amber-500",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMTMzODU0NTkxMF5BMl5BanBnXkFtZTcwMjQ4MzMzMw@@._V1_QL75_UX380_CR0,0,380,562_.jpg",
    backdropUrl: placeholderImage(
      "1200x600",
      "fef3c7",
      "78350f",
      "Paris kitchen rat sighting",
    ),
    posterAlt: "Official poster for Ratatouille.",
    externalIds: { tmdb: "2062", imdb: "tt0382932" },
    metadata: {
      tagline: "Dinner is served. Adventure is on the menu.",
      rating: "G",
      director: "Brad Bird, Jan Pinkava",
      originalLanguage: "English, French",
      productionCountries: ["United States", "France"],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2026-05-04",
      writers:
        "Brad Bird (screenplay), Bob Peterson, Jim Capobianco, Jan Pinkava",
      cast:
        "Patton Oswalt, Ian Holm, Lou Romano, Brad Garrett, Peter O'Toole, Janeane Garofalo, Will Arnett",
      imdbRating: "8.1",
      imdbVotes: "935,000",
      metascore: "96",
      awards: "Won Oscar: Best Animated Feature (2008)",
    },
    summary:
      "A rat who can cook makes an unusual alliance with a young kitchen worker at a famous Paris restaurant.",
  },
  {
    id: "the-departed-2006",
    slug: "the-departed-2006",
    title: "The Departed",
    releaseYear: 2006,
    runtimeMinutes: 151,
    genres: ["Crime", "Thriller", "Drama"],
    posterTone: "bg-stone-600",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMTI1MTY2OTIxNV5BMl5BanBnXkFtZTYwNjQ4NjY3._V1_QL75_UY562_CR0,0,380,562_.jpg",
    backdropUrl: placeholderImage(
      "1200x600",
      "18181b",
      "fef3c7",
      "Balcony rat final shot",
    ),
    posterAlt: "Official poster for The Departed.",
    externalIds: { tmdb: "1422", imdb: "tt0407887" },
    metadata: {
      tagline: "Lies. Betrayal. Sacrifice. How far will you take it?",
      rating: "R",
      director: "Martin Scorsese",
      originalLanguage: "English, Cantonese",
      productionCountries: ["United States", "Hong Kong"],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2026-05-04",
      writers: "William Monahan",
      cast:
        "Leonardo DiCaprio, Matt Damon, Jack Nicholson, Mark Wahlberg, Martin Sheen, Ray Winstone, Vera Farmiga, Alec Baldwin",
      imdbRating: "8.5",
      imdbVotes: "1.4 million",
      metascore: "85",
      awards: "Won 4 Oscars incl. Best Picture and Best Director (2007)",
    },
    summary:
      "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.",
  },
  {
    id: "nosferatu-1922",
    slug: "nosferatu-1922",
    title: "Nosferatu: A Symphony of Horror",
    releaseYear: 1922,
    runtimeMinutes: 94,
    genres: ["Fantasy", "Horror"],
    posterTone: "bg-stone-500",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BNDg1OTI1M2MtMTVlMS00ZjFhLTgyMTAtYjIzOWUwZTkyZWE5XkEyXkFqcGc@._V1_SX300.jpg",
    backdropUrl: placeholderImage(
      "1200x600",
      "44403c",
      "fafaf9",
      "Ship rats and shadow",
    ),
    posterAlt: "Official poster for Nosferatu: A Symphony of Horror.",
    externalIds: { tmdb: "653", imdb: "tt0013442" },
    metadata: {
      tagline: "A symphony of horror.",
      rating: "Not Rated",
      director: "F.W. Murnau",
      originalLanguage: "German, English",
      productionCountries: ["Germany"],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2026-05-04",
      writers: "Henrik Galeen",
      cast: "Max Schreck, Gustav von Wangenheim, Greta Schröder",
      imdbRating: "7.9",
      imdbVotes: "117,000",
      awards:
        "Landmark silent horror widely cited among the most influential films of the 1920s.",
    },
    summary:
      "Vampire Count Orlok expresses interest in a new residence and real estate agent Hutter's wife.",
  },
  {
    id: "indiana-jones-last-crusade-1989",
    slug: "indiana-jones-last-crusade-1989",
    title: "Indiana Jones and the Last Crusade",
    releaseYear: 1989,
    runtimeMinutes: 127,
    genres: ["Adventure", "Action"],
    posterTone: "bg-orange-600",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BNGIxNzQ0YzYtMjNmYi00YjBlLWFjNzEtNGE3ZGFmYTczM2MwXkEyXkFqcGc@._V1_SX300.jpg",
    backdropUrl: placeholderImage(
      "1200x600",
      "92400e",
      "fff7ed",
      "Venice catacomb rats",
    ),
    posterAlt: "Official poster for Indiana Jones and the Last Crusade.",
    externalIds: { tmdb: "89", imdb: "tt0097576" },
    metadata: {
      tagline: "The man with the hat is back. And this time, he's bringing his Dad.",
      rating: "PG-13",
      director: "Steven Spielberg",
      originalLanguage: "English, German, Greek, Latin, Italian",
      productionCountries: [
        "United States",
        "United Kingdom",
        "Spain",
        "Italy",
        "Jordan",
      ],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2026-05-04",
      writers: "Jeffrey Boam, George Lucas, Menno Meyjes",
      cast:
        "Harrison Ford, Sean Connery, Alison Doody, Denholm Elliott, John Rhys-Davies, Julian Glover",
      imdbRating: "8.2",
      imdbVotes: "803,000",
      metascore: "65",
      awards:
        "Won Oscar for Best Sound Effects Editing (1990); nominee for Score and Sound.",
    },
    summary:
      "In 1938, Indiana Jones finds himself up against the Nazis again while searching for the Holy Grail.",
  },
  {
    id: "willard-1971",
    slug: "willard-1971",
    title: "Willard",
    releaseYear: 1971,
    runtimeMinutes: 95,
    genres: ["Horror"],
    posterTone: "bg-red-800",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BNDdiM2U3MzYtYmM3YS00MTI4LWIxYzctZmYzN2U3NDBkOTM4XkEyXkFqcGc@._V1_SX300.jpg",
    backdropUrl: placeholderImage(
      "1200x600",
      "450a0a",
      "fee2e2",
      "Basement rat army",
    ),
    posterAlt: "Official poster for Willard.",
    externalIds: { tmdb: "42504", imdb: "tt0067991" },
    metadata: {
      tagline: "This is Willard and his friend Ben.",
      rating: "PG",
      director: "Daniel Mann",
      originalLanguage: "English",
      productionCountries: ["United States"],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2026-05-04",
      writers: "Gilbert Ralston",
      cast: "Bruce Davison, Elsa Lanchester, Ernest Borgnine, Sondra Locke",
      imdbRating: "6.2",
      imdbVotes: "8,900",
      metascore: "65",
      awards: "Oscar nominee: Best Song (“Ben”) (1973).",
    },
    summary:
      "A social misfit uses his only friends, his pet rats, to exact revenge on his tormentors.",
  },
  {
    id: "the-suicide-squad-2021",
    slug: "the-suicide-squad-2021",
    title: "The Suicide Squad",
    releaseYear: 2021,
    runtimeMinutes: 132,
    genres: ["Action", "Comedy", "Superhero"],
    posterTone: "bg-orange-500",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMWU3Y2NlZmEtMjJjNS00ZWMxLWE1MzctYWYyMjMzMDdkNTE4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
    backdropUrl: placeholderImage(
      "1200x600",
      "1d4ed8",
      "fdf2f8",
      "Heroic rat swarm",
    ),
    posterAlt: "Official poster for The Suicide Squad.",
    externalIds: { tmdb: "436969", imdb: "tt6334354" },
    metadata: {
      tagline: "They're dying to save the world.",
      rating: "R",
      director: "James Gunn",
      originalLanguage: "English, Spanish, Japanese, Cantonese",
      productionCountries: ["United States"],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2026-05-04",
      writers: "James Gunn",
      cast:
        "Margot Robbie, Idris Elba, John Cena, Joel Kinnaman, Viola Davis, Daniela Melchior, Sylvester Stallone (voice)",
      imdbRating: "7.2",
      imdbVotes: "358,000",
      metascore: "72",
      awards:
        "Won Critics' Choice Movie Award for Best Villain — Idris Elba as Bloodsport.",
    },
    summary:
      "Supervillains at Belle Reve join Task Force X for a mission on the remote island of Corto Maltese.",
  },
  {
    id: "flushed-away-2006",
    slug: "flushed-away-2006",
    title: "Flushed Away",
    releaseYear: 2006,
    runtimeMinutes: 85,
    genres: ["Animation", "Action", "Adventure"],
    posterTone: "bg-orange-400",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMTI1MzE1MDk2N15BMl5BanBnXkFtZTYwMjEwMzI3._V1_SX300.jpg",
    backdropUrl: placeholderImage(
      "1200x600",
      "bae6fd",
      "082f49",
      "London sewer rat adventure",
    ),
    posterAlt: "Official poster for Flushed Away.",
    externalIds: { tmdb: "11619", imdb: "tt0424095" },
    metadata: {
      tagline: "Someone's going down.",
      rating: "PG",
      director: "David Bowers, Sam Fell",
      originalLanguage: "English",
      productionCountries: ["United Kingdom", "United States"],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2026-05-04",
      writers:
        "Dick Clement, Ian La Frenais, Christopher Lloyd, Joe Keenan, William Davies",
      cast:
        "Hugh Jackman, Kate Winslet, Ian McKellen, Andy Serkis, Bill Nighy, Jean Reno",
      imdbRating: "6.6",
      imdbVotes: "128,000",
      metascore: "74",
      awards:
        "Annie nominee (Best Writing in a Feature), BAFTA nominee for Animated Film.",
    },
    summary:
      "The story of an uptown rat that gets flushed from his penthouse apartment into the sewers of London.",
  },
  {
    id: "ben-1972",
    slug: "ben-1972",
    title: "Ben",
    releaseYear: 1972,
    runtimeMinutes: 94,
    genres: ["Drama", "Horror", "Thriller"],
    posterTone: "bg-amber-800",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BNjMyMzM2MTUtZmQ4Ni00Y2ExLTliMDktMzE3NWRlZGQ4MzdhXkEyXkFqcGc@._V1_SX300.jpg",
    backdropUrl: placeholderImage(
      "1200x600",
      "7f1d1d",
      "fee2e2",
      "Ben killer rat swarm",
    ),
    posterAlt: "Official poster for Ben.",
    externalIds: { tmdb: "57122", imdb: "tt0068264" },
    metadata: {
      tagline: "A lonely boy befriends the leader of a rat colony.",
      rating: "PG",
      director: "Phil Karlson",
      originalLanguage: "English",
      productionCountries: ["United States"],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2026-05-04",
      writers: "Gilbert Ralston",
      cast: "Lee Montgomery, Joseph Campanella, Arthur O'Connell, Meredith Baxter",
      imdbRating: "5.4",
      imdbVotes: "5,300",
      awards: "Follow-up to Willard; cult horror sequel known for its Michael Jackson title song.",
    },
    summary:
      "A lonely boy befriends Ben, the leader of a violent swarm of killer rats.",
  },
];

export const sources: Source[] = [
  {
    id: "studio-watch-note",
    label: "Curator watch note",
    note: "Timestamp verified by a full-film watch-through.",
  },
  {
    id: "public-domain-print",
    label: "Public-domain reference",
    note: "Scene details checked against a public-domain print.",
  },
  {
    id: "community-citation",
    label: "Community citation",
    note: "Submitted with approximate position in the film and description; awaiting a second pass.",
  },
  {
    id: "tmdb-keyword-rat",
    label: "TMDB “rat” keyword",
    note: "Title appears on TMDB under the “rat” keyword; scene-level details need curator verification.",
  },
  {
    id: "wikipedia-en-intro",
    label: "English Wikipedia intro",
    note: "Automatically matched article introduction; summarizes the story, not verified frame-by-frame.",
  },
  {
    id: "omdb-plot-short",
    label: "OMDb short plot",
    note: "Structured plot blurb from OMDb using the IMDb id; may omit specific rat moments.",
  },
  {
    id: "reddit-snippet-unverified",
    label: "Reddit discussion (unverified)",
    note: "Informal snippet from public search results; anecdotes are not screened for accuracy.",
  },
];

const sightingsCatalogSeed: Sighting[] = [
  {
    id: "remy-first-cook",
    movieId: "ratatouille-2007",
    timestamp: "00:17:42",
    title: "Remy is separated from the colony and begins his path toward Gusteau's kitchen.",
    description:
      "Remy is separated from the colony and begins his path toward Gusteau's kitchen.",
    prominence: "scene-stealer",
    sceneType: "animated",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    approximateRatCount: 12,
    images: [
      {
        url:
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&w=900&q=80",
        alt:
          "Example photo: busy restaurant kitchen (not Ratatouille)—carousel demo slide 1.",
      },
      {
        url:
          "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&w=900&q=80",
        alt:
          "Example photo: salads and garnishes—carousel demo slide 2.",
      },
      {
        url:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&w=900&q=80",
        alt:
          "Example photo: plated meal overhead—carousel demo slide 3.",
      },
    ],
  },
  {
    id: "ratatouille-linguini-marionette",
    movieId: "ratatouille-2007",
    timestamp: "00:52:06",
    title: "Remy hides under Linguini's toque steering him like a marionette; kitchen chaos hinges …",
    description:
      "Remy hides under Linguini's toque steering him like a marionette; kitchen chaos hinges on puppet-cooking rats.",
    prominence: "scene-stealer",
    sceneType: "animated",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "f59e0b", "431407", "Remy hides under Linguini"),
    imageAlt: "Illustrated still for the marionette-cooking gag.",
  },
  {
    id: "ratatouille-finale-banquet-help",
    movieId: "ratatouille-2007",
    timestamp: "01:41:58",
    title: "The expanded rat brigade rallies to serve the climactic banquet while keeping Remy's se…",
    description:
      "The expanded rat brigade rallies to serve the climactic banquet while keeping Remy's secret intact.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: true,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    approximateRatCount: 48,
    curatorNote:
      "Verifies choreography through the climactic banquet; details discuss structural reveals.",
    imageUrl: placeholderImage("900x500", "ea580c", "fffbeb", "Rat brigade banquet"),
    imageAlt: "Illustrated still of rats helping plate the finale dinner.",
  },
  {
    id: "departed-training-academy-mouse",
    movieId: "the-departed-2006",
    timestamp: "00:54:42",
    title: "A stray rodent darts behind shelving during an early cadet-era interior beat—a tiny bli…",
    description:
      "A stray rodent darts behind shelving during an early cadet-era interior beat—a tiny blink-and-miss detail before Boston's undercover war heats up.",
    prominence: "blink-and-miss",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    approximateRatCount: 1,
    images: [
      {
        url:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&w=900&q=80",
        alt:
          "Example photo: hallway interior—carousel demo for The Departed sighting slide 1.",
      },
      {
        url:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&w=900&q=80",
        alt:
          "Example photo: tall buildings facade—carousel demo slide 2.",
      },
    ],
  },
  {
    id: "departed-final-rat",
    movieId: "the-departed-2006",
    timestamp: "02:25:21",
    title: "A rat crosses the balcony railing in the final shot, underlining the movie's informant …",
    description:
      "A rat crosses the balcony railing in the final shot, underlining the movie's informant motif.",
    prominence: "scene-stealer",
    sceneType: "final-shot",
    spoiler: true,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    curatorNote:
      "Final-shot rat symbolism varies slightly by grading—some streams crush the railing silhouette harder than theatrical prints.",
    imageUrl: placeholderImage("900x500", "27272a", "fef3c7", "Final balcony rat"),
    imageAlt: "Illustrated still of the final balcony rat.",
  },
  {
    id: "nosferatu-ship-rats",
    movieId: "nosferatu-1922",
    timestamp: "00:49:10",
    title: "Rats appear aboard the ship carrying Orlok, linking the vampire's arrival to plague ima…",
    description:
      "Rats appear aboard the ship carrying Orlok, linking the vampire's arrival to plague imagery.",
    prominence: "background",
    sceneType: "swarm",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["public-domain-print"],
    approximateRatCount: 24,
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&w=900&q=80",
    imageAlt:
      "Example image: small boat on open water—not from Nosferatu; placeholder for deck shots.",
  },
  {
    id: "nosferatu-plague-town",
    movieId: "nosferatu-1922",
    timestamp: "00:56:03",
    title: "Rats appear among the frightened townsfolk as plague symbolism intensifies around Orlok…",
    description:
      "Rats appear among the frightened townsfolk as plague symbolism intensifies around Orlok's shadow spreading through Wisborg.",
    prominence: "background",
    sceneType: "symbolic",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["public-domain-print"],
    imageUrl: placeholderImage("900x500", "44403c", "e7e5e4", "Plague town rats"),
    imageAlt: "Illustrated still of rats amid plague-town panic.",
  },
  {
    id: "indy-library-to-catacombs",
    movieId: "indiana-jones-last-crusade-1989",
    timestamp: "00:36:12",
    title: "Rats crawl from the Venetian library stacks into the dusty passage that drops Indy and …",
    description:
      "Rats crawl from the Venetian library stacks into the dusty passage that drops Indy and Elsa toward the submerged crypt.",
    prominence: "background",
    sceneType: "swarm",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    curatorNote:
      "Stacks plate used more reactive lighting than catacombs; compare noise on older HD masters before timing complaints.",
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&w=900&q=80",
    imageAlt:
      "Example image: library stacks—not from Indiana Jones; shows image + curator note styling.",
  },
  {
    id: "indy-catacombs",
    movieId: "indiana-jones-last-crusade-1989",
    timestamp: "00:38:08",
    title: "Rats flood the Venice catacombs as Indy and Elsa search beneath the library.",
    description:
      "Rats flood the Venice catacombs as Indy and Elsa search beneath the library.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "92400e", "fff7ed", "Catacomb swarm"),
    imageAlt: "Illustrated still of rats in the Venice catacombs.",
  },
  {
    id: "willard-basement",
    movieId: "willard-1971",
    timestamp: "00:28:35",
    title: "Willard's bond with the rats deepens as the basement becomes their territory.",
    description:
      "Willard's bond with the rats deepens as the basement becomes their territory.",
    prominence: "scene-stealer",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "7f1d1d", "fee2e2", "Basement rats"),
    imageAlt: "Illustrated still of Willard's basement rats.",
  },
  {
    id: "willard-office-dinner-invite",
    movieId: "willard-1971",
    timestamp: "01:06:42",
    title: "Willard's rodents crash a dinner-in-progress at his workplace, escalating from hidden m…",
    description:
      "Willard's rodents crash a dinner-in-progress at his workplace, escalating from hidden menace into open revenge spectacle.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: true,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "991b1b", "fecaca", "Office rat invasion"),
    imageAlt: "Illustrated still of rats overwhelming the dinner table.",
  },
  {
    id: "suicide-squad-sebastian",
    movieId: "the-suicide-squad-2021",
    timestamp: "00:10:30",
    title: "Sebastian is introduced as Ratcatcher 2's companion before the larger swarm payoff.",
    description:
      "Sebastian is introduced as Ratcatcher 2's companion before the larger swarm payoff.",
    prominence: "scene-stealer",
    sceneType: "live-action",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "1d4ed8", "fdf2f8", "Sebastian appears"),
    imageAlt: "Illustrated still of Sebastian the rat.",
  },
  {
    id: "suicide-squad-belle-reve-recruit",
    movieId: "the-suicide-squad-2021",
    timestamp: "00:16:54",
    title: "Belle Reve sequences re-establish Ratcatcher 2 with caged rodents and practice commands…",
    description:
      "Belle Reve sequences re-establish Ratcatcher 2 with caged rodents and practice commands before the Corto Maltese deployment.",
    prominence: "background",
    sceneType: "live-action",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "1e3a8a", "fbcfe8", "Belle Reve rat cages"),
    imageAlt: "Illustrated still of cages and rat-handler drill.",
  },
  {
    id: "suicide-squad-corto-maltese-wave",
    movieId: "the-suicide-squad-2021",
    timestamp: "01:15:52",
    title: "Ratcatcher 2 whistles up a tidal wave of vermin—including street drains and cages—durin…",
    description:
      "Ratcatcher 2 whistles up a tidal wave of vermin—including street drains and cages—during the Corto Maltese assault choreography.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "2563eb", "fce7f3", "Rat wave Corto Maltese"),
    imageAlt: "Illustrated still of Ratcatcher 2 commanding a rodent tide.",
  },
  {
    id: "suicide-squad-catalog-demo-01",
    movieId: "the-suicide-squad-2021",
    timestamp: "00:03:15",
    title: "Demonstration catalog beat: stray rats scatter along a corridor at Belle Reve as guards…",
    description:
      "Demonstration catalog beat: stray rats scatter along a corridor at Belle Reve as guards walk past—padding data for paging UI.",
    prominence: "blink-and-miss",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "312e81", "e0e7ff", "Paging demo corridor"),
    imageAlt: "Placeholder still for paging demo corridor rats.",
  },
  {
    id: "suicide-squad-catalog-demo-02",
    movieId: "the-suicide-squad-2021",
    timestamp: "00:08:42",
    title: "Ratcatcher trains another pocket of recruits in an exercise yard; rodents thread throug…",
    description:
      "Ratcatcher trains another pocket of recruits in an exercise yard; rodents thread through chain-link shadows.",
    prominence: "background",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "1e1b4b", "c7d2fe", "Exercise yard rats"),
    imageAlt: "Placeholder still for yard training.",
  },
  {
    id: "suicide-squad-catalog-demo-03",
    movieId: "the-suicide-squad-2021",
    timestamp: "00:22:10",
    title: "A maintenance tunnel shows fresh gnaw marks and a quick tail whip before the squad move…",
    description:
      "A maintenance tunnel shows fresh gnaw marks and a quick tail whip before the squad moves on.",
    prominence: "blink-and-miss",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "172554", "dbeafe", "Tunnel gnaw marks"),
    imageAlt: "Placeholder still for gnawed tunnel.",
  },
  {
    id: "suicide-squad-catalog-demo-04",
    movieId: "the-suicide-squad-2021",
    timestamp: "00:31:06",
    title: "Helicopter briefing insert: a blink of motion in a supply crate hinting at stowaway rats.",
    description:
      "Helicopter briefing insert: a blink of motion in a supply crate hinting at stowaway rats.",
    prominence: "blink-and-miss",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "14532d", "dcfce7", "Crate tail blur"),
    imageAlt: "Placeholder still for helicopter crate.",
  },
  {
    id: "suicide-squad-catalog-demo-05",
    movieId: "the-suicide-squad-2021",
    timestamp: "00:44:18",
    title: "Staging deck before deployment: loose feed bags rustle with small bodies inside the car…",
    description:
      "Staging deck before deployment: loose feed bags rustle with small bodies inside the cargo net.",
    prominence: "background",
    sceneType: "swarm",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "365314", "ecfccb", "Feed bag swarm"),
    imageAlt: "Placeholder still for staging deck swarm.",
  },
  {
    id: "suicide-squad-catalog-demo-06",
    movieId: "the-suicide-squad-2021",
    timestamp: "00:58:40",
    title: "Brief insert of rats vanishing into a storm drain at the edge of the beachhead town.",
    description:
      "Brief insert of rats vanishing into a storm drain at the edge of the beachhead town.",
    prominence: "background",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "134e4a", "ccfbf1", "Drain bolt"),
    imageAlt: "Placeholder still for storm drain.",
  },
  {
    id: "suicide-squad-catalog-demo-07",
    movieId: "the-suicide-squad-2021",
    timestamp: "01:02:07",
    title: "Urban market texture pass: vendors shooing a small cluster of rodents from produce bins.",
    description:
      "Urban market texture pass: vendors shooing a small cluster of rodents from produce bins.",
    prominence: "background",
    sceneType: "swarm",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "831843", "fce7f3", "Market swarm"),
    imageAlt: "Placeholder still for market rats.",
  },
  {
    id: "suicide-squad-catalog-demo-08",
    movieId: "the-suicide-squad-2021",
    timestamp: "01:08:22",
    title: "Ratcatcher whistles a smaller wave through rubble as cover for the squad advancing on a…",
    description:
      "Ratcatcher whistles a smaller wave through rubble as cover for the squad advancing on a side street.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "4c1d95", "ede9fe", "Rubble wave"),
    imageAlt: "Placeholder still for rubble swarm.",
  },
  {
    id: "suicide-squad-catalog-demo-09",
    movieId: "the-suicide-squad-2021",
    timestamp: "01:12:33",
    title: "Quiet beat in a hotel room: Sebastian scurries across paperwork while plans are laid out.",
    description:
      "Quiet beat in a hotel room: Sebastian scurries across paperwork while plans are laid out.",
    prominence: "scene-stealer",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "701a75", "fdf2f8", "Hotel Sebastian"),
    imageAlt: "Placeholder still for Sebastian on desk.",
  },
  {
    id: "suicide-squad-catalog-demo-10",
    movieId: "the-suicide-squad-2021",
    timestamp: "01:18:07",
    title: "Late assault insert: additional rodent traffic through a blasted wall while gunfire con…",
    description:
      "Late assault insert: additional rodent traffic through a blasted wall while gunfire continues off-screen.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "4a044e", "fae8ff", "Wall breach rats"),
    imageAlt: "Placeholder still for breached wall swarm.",
  },
  {
    id: "flushed-away-roddy",
    movieId: "flushed-away-2006",
    timestamp: "00:04:50",
    title: "Roddy is established as a pampered pet rat before being flushed into the London sewer w…",
    description:
      "Roddy is established as a pampered pet rat before being flushed into the London sewer world.",
    prominence: "scene-stealer",
    sceneType: "animated",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl:
      "https://images.unsplash.com/photo-1535241749838-299277b6305f?auto=format&w=900&q=80",
    imageAlt:
      "Example image: concrete water channel—not from Flushed Away; suggests sewer-world mood.",
  },
  {
    id: "flushed-away-sewer-jam-city",
    movieId: "flushed-away-2006",
    timestamp: "00:22:43",
    title: "Roddy discovers Ratropolis—boats, dives, and market stalls—all populated by rival sewer…",
    description:
      "Roddy discovers Ratropolis—boats, dives, and market stalls—all populated by rival sewer rat crews after the plunge.",
    prominence: "scene-stealer",
    sceneType: "animated",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "0ea5e9", "082f49", "Ratropolis market"),
    imageAlt: "Illustrated still of bustling Ratropolis.",
  },
  {
    id: "flushed-away-toad-ballroom-swarm",
    movieId: "flushed-away-2006",
    timestamp: "01:06:58",
    title: "The villain's ballroom scheme unleashes choreography where dozens of animated rats scra…",
    description:
      "The villain's ballroom scheme unleashes choreography where dozens of animated rats scramble through pipes and chandeliers.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: true,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "0369a1", "ecfccb", "Toad ballroom rats"),
    imageAlt: "Illustrated still of ballroom rat swarm antics.",
  },
  {
    id: "ben-rat-colony",
    movieId: "ben-1972",
    timestamp: "00:12:20",
    title: "Ben and the rat colony become central to the story as Danny forms a bond with their lea…",
    description:
      "Ben and the rat colony become central to the story as Danny forms a bond with their leader.",
    prominence: "scene-stealer",
    sceneType: "live-action",
    spoiler: false,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "7f1d1d", "fee2e2", "Ben rat colony"),
    imageAlt: "Illustrated still of Ben and the rat colony.",
  },
  {
    id: "ben-kitchen-cheese-run",
    movieId: "ben-1972",
    timestamp: "00:38:54",
    title: "Rats overrun the Schaefers' kitchen pantry in waves as Ben redirects the infestation to…",
    description:
      "Rats overrun the Schaefers' kitchen pantry in waves as Ben redirects the infestation toward escalating domestic horror beats.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "Curator",
    sourceIds: ["studio-watch-note"],
    imageUrl: placeholderImage("900x500", "9f1239", "ffe4e6", "Kitchen rat waves"),
    imageAlt: "Illustrated still of pantry rat waves.",
  },
  {
    id: "ben-hospital-corridor-finale",
    movieId: "ben-1972",
    timestamp: "01:19:43",
    title: "The closing hospital corridor payoff leans heavily on swarm imagery as Ben calls in rei…",
    description:
      "The closing hospital corridor payoff leans heavily on swarm imagery as Ben calls in reinforcements meters from shocked onlookers.",
    prominence: "scene-stealer",
    sceneType: "swarm",
    spoiler: true,
    confidence: "likely",
    verificationState: "verified",
    verifiedBy: "Moderator",
    sourceIds: ["community-citation"],
    imageUrl: placeholderImage("900x500", "450a0a", "fecdd3", "Hospital rat finale"),
    imageAlt: "Illustrated still of hallway rat payoff.",
  },
];

export const submissions: Submission[] = [
  {
    id: "sub-muppets",
    movieTitle: "The Muppets Take Manhattan",
    movieYear: 1984,
    imdbId: "tt0087755",
    timestamp: "00:44:00",
    title: "Rizzo diner sequence",
    description:
      "Rizzo and other rats work in the diner sequence; needs exact timestamp pass.",
    spoiler: false,
    status: "pending",
    submittedBy: "RatFan17",
    approximateRatCount: 8,
    imageUrl: placeholderImage("900x500", "f97316", "fff7ed", "Diner rat sighting"),
    imageAlt: "Submitted reference image placeholder for the diner rat sighting.",
    moviePosterUrl:
      "https://m.media-amazon.com/images/M/MV5BNWMyNmNjNmYtNGZkMy00OTY2LWFkOTAtMDZjYmQ2ODRkZDFiXkEyXkFqcGc@._V1_SX300.jpg",
  },
  {
    id: "sub-of-unknown-origin",
    movieTitle: "Of Unknown Origin",
    movieYear: 1983,
    imdbId: "tt0086036",
    timestamp: "00:31:00",
    title: "House takeover hunt",
    description:
      "A dangerous rat takes over the renovated house and drives Bart's increasingly obsessive hunt.",
    spoiler: false,
    status: "pending",
    submittedBy: "FilmBurrow",
    duplicateHint: "Potential new movie; no current catalog match.",
    approximateRatCount: 1,
    imageUrl: placeholderImage("900x500", "292524", "fef3c7", "House rat hunt"),
    imageAlt: "Submitted reference image placeholder for Of Unknown Origin.",
    moviePosterUrl:
      "https://m.media-amazon.com/images/M/MV5BZDQ1ZGQ1MWEtYWZkOS00MjQwLWE0MzgtMGY1MTk1MGJlOTIxXkEyXkFqcGc@._V1_SX300.jpg",
  },
  {
    id: "sub-departed-alt",
    movieTitle: "The Departed",
    movieYear: 2006,
    imdbId: "tt0407887",
    timestamp: "02:25:19",
    title: "Balcony rat in the final shot",
    description: "Final-shot rat on the balcony railing.",
    spoiler: true,
    status: "pending",
    submittedBy: "RatFan17",
    duplicateHint: "Likely duplicate of departed-final-rat.",
    approximateRatCount: 1,
    imageUrl: placeholderImage("900x500", "27272a", "fef3c7", "Balcony rat duplicate"),
    imageAlt: "Submitted reference image placeholder for the final balcony rat.",
    moviePosterUrl: placeholderImage("600x900", "27272a", "fef3c7", "The Departed"),
  },
];

export const reviewActions: ReviewAction[] = [
  {
    id: "review-departed-final",
    submissionId: "sub-departed-final-original",
    movieTitle: "The Departed",
    action: "approved",
    moderatorId: "curator",
    moderatorName: "Curator",
    reviewedAt: "2026-05-04T20:10:00Z",
    note: "Approved after matching the final-shot timestamp against the IMDb-backed movie record.",
  },
  {
    id: "review-nosferatu-source",
    submissionId: "sub-nosferatu-ship-source",
    movieTitle: "Nosferatu",
    action: "edited and approved",
    moderatorId: "film-burrow",
    moderatorName: "FilmBurrow",
    reviewedAt: "2026-05-04T20:28:00Z",
    note: "Added public-domain source context before publishing the ship-rat sighting.",
  },
];

const seedCatalogImdbIds = new Set(
  moviesCatalogSeed.map((movie) => movie.externalIds.imdb.toLowerCase()),
);

const bulkRatMoviesMerged = (bulkRatSeed.movies as Movie[]).filter((movie) => {
  const imdb = movie.externalIds?.imdb?.toLowerCase();
  return Boolean(imdb) && !seedCatalogImdbIds.has(imdb);
});

const bulkRatMovieIds = new Set(bulkRatMoviesMerged.map((movie) => movie.id));

const bulkRatSightingsMerged = (bulkRatSeed.sightings as Sighting[]).filter(
  (sighting) => bulkRatMovieIds.has(sighting.movieId),
);

/** Hand-curated seed movies plus TMDB “rat” keyword bulk import (deduped by IMDb ID). */
export const movies: Movie[] = [...moviesCatalogSeed, ...bulkRatMoviesMerged];

/** Seed sightings plus bulk keyword rows (pending verification). */
export const sightings: Sighting[] = [
  ...sightingsCatalogSeed,
  ...bulkRatSightingsMerged,
];

const sightingCatalogRank = new Map(
  sightings.map((sighting, index) => [sighting.id, index]),
);

export function getSightingCatalogRank(sightingId: string): number {
  return sightingCatalogRank.get(sightingId) ?? 0;
}

/** Newest-first: moderator-promoted sightings sort by review time; catalog uses seed order rank. */
export function sightingNewestSortValue(sighting: Sighting): number {
  if (sighting.submissionReviewedAtISO) {
    const ms = Date.parse(sighting.submissionReviewedAtISO);
    if (Number.isFinite(ms)) return ms;
  }
  return getSightingCatalogRank(sighting.id);
}

export function sightingAppearanceStartSeconds(sighting: Sighting): number {
  const percent = parsePercentIntoMovie(sighting.timestamp);
  if (percent !== null) {
    return percent * 60;
  }
  const chunks = sighting.timestamp
    .trim()
    .split(":")
    .map((segment) => Number.parseInt(segment, 10));
  if (
    chunks.length === 3 &&
    chunks.every((n) => Number.isFinite(n) && !Number.isNaN(n))
  ) {
    return chunks[0] * 3600 + chunks[1] * 60 + chunks[2];
  }
  if (
    chunks.length === 2 &&
    chunks.every((n) => Number.isFinite(n) && !Number.isNaN(n))
  ) {
    return chunks[0] * 60 + chunks[1];
  }
  return 0;
}

function sightingAppearanceSortValue(
  sighting: Sighting,
  runtimeMinutes?: number,
): number {
  const percent = parsePercentIntoMovie(sighting.timestamp);
  if (percent !== null) return percent;
  const seconds = sightingAppearanceStartSeconds(sighting);
  const runtimeSeconds = Math.max(1, Math.floor((runtimeMinutes ?? 0) * 60));
  if (runtimeSeconds > 1) {
    return (seconds / runtimeSeconds) * 100;
  }
  return seconds;
}

export function parseMovieSightingsSortParam(
  value: string | undefined,
): MovieSightingsSortOption {
  if (
    value === "rats" ||
    value === "newest" ||
    value === "appearance-early" ||
    value === "appearance-late"
  ) {
    return value;
  }
  return "newest";
}

export function parseMovieSightingsPageParam(value: string | undefined): number {
  const n = Number.parseInt(String(value ?? "1").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function movieSightingsQueryString(parts: {
  sort: MovieSightingsSortOption;
  page: number;
}): string {
  const p = new URLSearchParams();
  if (parts.sort !== "newest") p.set("sort", parts.sort);
  if (parts.page > 1) p.set("page", String(parts.page));
  return p.toString();
}

export function buildMovieSightingsPath(
  slug: string,
  parts: {
    sort: MovieSightingsSortOption;
    page: number;
  },
): string {
  const q = movieSightingsQueryString(parts);
  return q ? `/movies/${slug}?${q}` : `/movies/${slug}`;
}

export function prepareMovieSightingsView({
  items,
  sort,
  page,
  runtimeMinutes,
  pageSize = MOVIE_SIGHTINGS_PAGE_SIZE,
}: {
  items: Sighting[];
  sort: MovieSightingsSortOption;
  page: number;
  runtimeMinutes?: number;
  pageSize?: number;
}): {
  pageSlice: Sighting[];
  totalCount: number;
  pageCount: number;
  safePage: number;
} {
  const totalCount = items.length;
  const ordered = [...items];
  switch (sort) {
    case "newest":
      ordered.sort(
        (a, b) => sightingNewestSortValue(b) - sightingNewestSortValue(a),
      );
      break;
    case "rats":
      ordered.sort((a, b) => {
        const dr = estimateRatsForAppearance(b) - estimateRatsForAppearance(a);
        if (dr !== 0) return dr;
        return (
          sightingAppearanceSortValue(a, runtimeMinutes) -
          sightingAppearanceSortValue(b, runtimeMinutes)
        );
      });
      break;
    case "appearance-early":
      ordered.sort(
        (a, b) =>
          sightingAppearanceSortValue(a, runtimeMinutes) -
          sightingAppearanceSortValue(b, runtimeMinutes),
      );
      break;
    case "appearance-late":
      ordered.sort(
        (a, b) =>
          sightingAppearanceSortValue(b, runtimeMinutes) -
          sightingAppearanceSortValue(a, runtimeMinutes),
      );
      break;
    default:
      break;
  }

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const pageSlice = ordered.slice(start, start + pageSize);

  return {
    pageSlice,
    totalCount,
    pageCount,
    safePage,
  };
}

export function getSightingsForMovie(movieId: string) {
  return sightings.filter((sighting) => sighting.movieId === movieId);
}

/** Sum of catalog rat estimates per sighting (swarms weighted). */
export function estimateTotalRatsForMovie(movieId: string): number {
  return getSightingsForMovie(movieId).reduce(
    (sum, sighting) => sum + estimateRatsForAppearance(sighting),
    0,
  );
}

export function getMovieBySlug(slug: string) {
  return movies.find((movie) => movie.slug === slug);
}

export function getMovieByImdbId(imdbIdOrUrl: string) {
  const imdbId = normalizeImdbId(imdbIdOrUrl);
  return movies.find((movie) => movie.externalIds.imdb === imdbId);
}

export function getMovieByTitleSearch(title: string) {
  const normalizedTitle = title.trim().toLowerCase();

  if (!normalizedTitle) {
    return undefined;
  }

  return movies.find((movie) => {
    const movieLabel = `${movie.title} ${movie.releaseYear}`.toLowerCase();

    return (
      movie.title.toLowerCase() === normalizedTitle ||
      movieLabel === normalizedTitle ||
      movie.title.toLowerCase().includes(normalizedTitle) ||
      normalizedTitle.includes(movie.title.toLowerCase())
    );
  });
}

export function getImdbTitleOptions() {
  return movies.map((movie) => ({
    label: `${movie.title} (${movie.releaseYear})`,
    value: movie.title,
    imdbId: movie.externalIds.imdb,
    posterUrl: movie.posterUrl,
    rating: movie.metadata.rating,
  }));
}

export function getSourceById(sourceId: string) {
  return sources.find((source) => source.id === sourceId);
}

export function getRatCount(movieId: string) {
  return getSightingsForMovie(movieId).length;
}

export function getRecentReviewActions() {
  return [...reviewActions].sort(
    (a, b) =>
      new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
  );
}

/** Rough on-screen headcount for sorting and aggregates — prefers `approximateRatCount`, then scene heuristics. */
export function estimateRatsForAppearance(sighting: Sighting): number {
  const raw = sighting.approximateRatCount;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1) {
    return Math.min(9999, Math.floor(raw));
  }
  if (sighting.sceneType === "swarm") return 6;
  return 1;
}

export type RatPresenceCaption = "Solitary" | "A Few" | "Several" | "Many" | "Swarm";

export type RatPresenceScale = {
  /** How many of the five meter segments are “on” (1–5). */
  slotsFilled: 1 | 2 | 3 | 4 | 5;
  caption: RatPresenceCaption;
};

/**
 * Buckets estimated count into a five-step visual presence scale (solo → swarm).
 */
export function getRatPresenceScale(estimatedCount: number): RatPresenceScale {
  let n = Math.floor(Number(estimatedCount));
  if (!Number.isFinite(n) || n < 1) n = 1;
  n = Math.min(9999, n);
  if (n === 1) return { slotsFilled: 1, caption: "Solitary" };
  if (n <= 3) return { slotsFilled: 2, caption: "A Few" };
  if (n <= 8) return { slotsFilled: 3, caption: "Several" };
  if (n <= 24) return { slotsFilled: 4, caption: "Many" };
  return { slotsFilled: 5, caption: "Swarm" };
}

/**
 * Hero preview cards: later entries in the sightings list are treated as newer catalog drops.
 * Returns up to `limit` verified sightings on distinct movies.
 */
export function getHeroRecentSightings(limit = 3): { sighting: Sighting; movie: Movie }[] {
  const verified = sightings.filter((s) => s.verificationState === "verified");
  const ordered = [...verified].reverse();
  const out: { sighting: Sighting; movie: Movie }[] = [];
  const seen = new Set<string>();

  for (const sighting of ordered) {
    const movie = movies.find((m) => m.id === sighting.movieId);
    if (!movie) continue;
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    out.push({ sighting, movie });
    if (out.length >= limit) break;
  }

  return out;
}

export function getCatalogStats() {
  const verifiedSightings = sightings.filter(
    (sighting) => sighting.verificationState === "verified",
  );

  return {
    movies: movies.length,
    sightings: verifiedSightings.length,
    ratsTallied: verifiedSightings.reduce(
      (sum, s) => sum + estimateRatsForAppearance(s),
      0,
    ),
    pendingSubmissions: submissions.filter(
      (submission) => submission.status === "pending",
    ).length,
    spoilerSightings: verifiedSightings.filter((sighting) => sighting.spoiler)
      .length,
  };
}

export function searchMovies({
  query,
  genre,
}: {
  query?: string;
  genre?: string;
}) {
  const normalizedQuery = query?.trim().toLowerCase();

  return movies.filter((movie) => {
    const matchesQuery =
      !normalizedQuery ||
      movie.title.toLowerCase().includes(normalizedQuery) ||
      movie.summary.toLowerCase().includes(normalizedQuery) ||
      movie.externalIds.imdb.toLowerCase().includes(normalizedQuery);
    const matchesGenre = !genre || genre === "all" || movie.genres.includes(genre);

    return matchesQuery && matchesGenre;
  });
}

export const genres = Array.from(
  new Set(movies.flatMap((movie) => movie.genres)),
).sort();

export const prominenceLabels: Record<RatProminence, string> = {
  "blink-and-miss": "Blink And Miss",
  background: "Background",
  "scene-stealer": "Scene Stealer",
};

export const confidenceLabels: Record<Confidence, string> = {
  "needs-source": "Needs Source",
  likely: "Likely",
  verified: "Verified",
};

export const sceneTypeLabels: Record<SceneType, string> = {
  "live-action": "Live Action",
  animated: "Animated",
  symbolic: "Symbolic",
  swarm: "Swarm",
  "final-shot": "Final Shot",
};
