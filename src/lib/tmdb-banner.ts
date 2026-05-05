/** TMDB Bearer token — create one at https://www.themoviedb.org/settings/api */
const TMDB_API = "https://api.themoviedb.org/3";

type TmdbBackdrop = {
  file_path?: string | null;
  width?: number;
  vote_average?: number;
};

type TmdbMovieDetails = {
  backdrop_path?: string | null;
};

type TmdbImagesResponse = {
  backdrops?: TmdbBackdrop[];
};

function bearerHeaders(): HeadersInit | null {
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

/** Widescreen theatrical still; needs `TMDB_READ_ACCESS_TOKEN` + numeric TMDB movie id */
export async function getTmdbBackdropUrl(tmdbId: string | undefined) {
  if (!tmdbId) {
    return null;
  }

  const headers = bearerHeaders();
  if (!headers) {
    return null;
  }

  const cache = { next: { revalidate: 86400 } } as const;

  try {
    const detailRes = await fetch(
      `${TMDB_API}/movie/${encodeURIComponent(tmdbId)}`,
      {
        headers: { Accept: "application/json", ...headers },
        ...cache,
      },
    );

    if (detailRes.ok) {
      const detail = (await detailRes.json()) as TmdbMovieDetails;
      if (detail.backdrop_path) {
        return `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`;
      }
    }

    const imagesRes = await fetch(
      `${TMDB_API}/movie/${encodeURIComponent(tmdbId)}/images`,
      {
        headers: { Accept: "application/json", ...headers },
        ...cache,
      },
    );

    if (!imagesRes.ok) {
      return null;
    }

    const { backdrops } = ((await imagesRes.json()) ?? {}) as TmdbImagesResponse;
    const list = backdrops?.filter((b) => b.file_path && (b.width ?? 0) >= 1280) ?? [];

    if (list.length === 0 && backdrops?.length) {
      const fb = [...backdrops]
        .filter((b) => b.file_path)
        .sort(
          (a, b) =>
            (b.width ?? 0) * Math.max(b.vote_average ?? 0, 0.1) -
            (a.width ?? 0) * Math.max(a.vote_average ?? 0, 0.1),
        )[0];
      if (fb?.file_path) {
        return `https://image.tmdb.org/t/p/w1280${fb.file_path}`;
      }

      return null;
    }

    const best =
      [...list].sort((a, b) => {
        const sa = Math.max(a.vote_average ?? 0, 0.1) * (a.width ?? 0);
        const sb = Math.max(b.vote_average ?? 0, 0.1) * (b.width ?? 0);
        return sb - sa;
      })[0] ?? null;

    return best?.file_path ? `https://image.tmdb.org/t/p/w1280${best.file_path}` : null;
  } catch {
    return null;
  }
}
