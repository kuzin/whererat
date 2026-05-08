import { NextResponse } from "next/server";
import { normalizeImdbId } from "@/lib/whererat";

type OmdbSeasonEpisode = {
  Episode?: string;
  Title?: string;
};

type OmdbSeasonPayload = {
  Response: "True" | "False";
  Error?: string;
  totalSeasons?: string;
  Episodes?: OmdbSeasonEpisode[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = normalizeImdbId(searchParams.get("imdbId") ?? "");
  const season = Number.parseInt(String(searchParams.get("season") ?? "1"), 10);
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey || !imdbId || !Number.isFinite(season) || season < 1) {
    return NextResponse.json(
      { ok: false, error: "Invalid lookup parameters." },
      { status: 400 },
    );
  }

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("i", imdbId);
  url.searchParams.set("Season", String(season));

  const response = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!response.ok) {
    return NextResponse.json({ ok: false, error: "Episode lookup failed." }, { status: 502 });
  }

  const payload = (await response.json()) as OmdbSeasonPayload;
  if (payload.Response !== "True") {
    return NextResponse.json(
      { ok: false, error: payload.Error ?? "No episode data found." },
      { status: 404 },
    );
  }

  const episodes = (payload.Episodes ?? [])
    .map((item) => ({
      number: Number.parseInt(item.Episode ?? "", 10),
      title: String(item.Title ?? "").trim(),
    }))
    .filter((item) => Number.isFinite(item.number) && item.number >= 1);

  const totalSeasons = Number.parseInt(payload.totalSeasons ?? "", 10);
  return NextResponse.json({
    ok: true,
    totalSeasons: Number.isFinite(totalSeasons) ? totalSeasons : undefined,
    episodes,
  });
}
