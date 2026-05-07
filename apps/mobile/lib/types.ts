export type CatalogSort =
  | "latest-added-title"
  | "latest-sighting"
  | "most-rats-logged"
  | "total-sightings";

export type CatalogMovieRow = {
  id: string;
  slug: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  genres: string[];
  posterUrl: string;
  posterAlt: string;
  posterTone: string;
  pagePalette?: {
    wash: string;
    columnWash: string;
    accent: string;
    heroBloom: string;
  } | null;
  summary: string;
  sightingCount: number;
  rating?: string;
  imdbRating?: string;
  imdbVotes?: string;
};

export type CatalogResponse = {
  version: 1;
  genres: string[];
  sort: CatalogSort;
  filters: { q: string; genre: string };
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  movies: CatalogMovieRow[];
};

export type MovieSightingsSort =
  | "newest"
  | "rats"
  | "appearance-early"
  | "appearance-late";

export type SightingPublic = {
  id: string;
  movieId: string;
  timestamp: string;
  title?: string;
  description: string;
  prominence: string;
  sceneType: string;
  spoiler: boolean;
  approximateRatCount?: number;
  images?: { url: string; alt?: string }[];
  imageUrl?: string;
  imageAlt?: string;
  submitterName?: string;
  submissionReviewedAtISO?: string;
  curatorNote?: string;
  confidence: string;
  verificationState: string;
  verifiedBy: string;
  sourceIds: string[];
};

export type MovieDetailResponse = {
  version: 1;
  movie: {
    id: string;
    slug: string;
    title: string;
    releaseYear: number;
    runtimeMinutes: number;
    genres: string[];
    posterTone: string;
    posterUrl: string;
    headerBanner?: string;
    backdropUrl: string;
    posterAlt: string;
    pagePalette?: {
      wash: string;
      columnWash: string;
      accent: string;
      heroBloom: string;
    } | null;
    summary: string;
    externalIds: { tmdb?: string; imdb: string };
    metadata: Record<string, unknown>;
  };
  featuredRats: {
    sort: MovieSightingsSort;
    sortLabels: Record<MovieSightingsSort, string>;
    page: number;
    pageCount: number;
    totalCount: number;
    sightings: SightingPublic[];
  };
  tabs: {
    facts: string[];
    reviews: {
      id: string;
      author: string;
      summary: string;
      text: string;
      rating?: number;
      date: string;
      mentionsRat: boolean;
    }[];
    related: {
      id: string;
      title: string;
      year?: number;
      posterUrl?: string;
      rating?: number;
    }[];
    videos: {
      id: string;
      name: string;
      contentType?: string;
      thumbnailUrl?: string;
      runtimeSeconds?: number;
    }[];
    images: {
      id: string;
      url: string;
      width?: number;
      height?: number;
      caption?: string;
    }[];
  };
  links: { imdbTitle: string };
};
