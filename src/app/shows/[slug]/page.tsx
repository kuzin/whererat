import { notFound, redirect } from "next/navigation";
import { getCatalogMovieBySlug, getCatalogMovies } from "@/lib/movie-catalog";
import {
    MoviePage,
    generateMetadata,
    type SearchParams,
} from "@/app/movies/[slug]/page";

export { generateMetadata };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
    try {
        const allMovies = await getCatalogMovies();
        return allMovies
            .filter(
                (m) =>
                    (m.metadata.syncSnapshot as Record<string, unknown> | undefined)
                        ?.Type === "series",
            )
            .map((m) => ({ slug: m.slug }));
    } catch {
        return [];
    }
}

export default async function ShowsRoute({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams?: SearchParams;
}) {
    const { slug } = await params;
    const baseMovie = await getCatalogMovieBySlug(slug);
    if (!baseMovie) notFound();
    const type = (
        baseMovie.metadata.syncSnapshot as Record<string, unknown> | undefined
    )?.Type;
    // Redirect confirmed movies to /movies/; keep series (and unsynced) at /shows/
    if (type === "movie") redirect(`/movies/${slug}`);
    return <MoviePage params={params} searchParams={searchParams} />;
}
