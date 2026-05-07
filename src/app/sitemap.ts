import type { MetadataRoute } from "next";
import { getCatalogMovies } from "@/lib/movie-catalog";

const BASE_URL = "https://whererat.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const movies = await getCatalogMovies();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guidelines`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const movieRoutes: MetadataRoute.Sitemap = movies.map((movie) => ({
    url: `${BASE_URL}/movies/${movie.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...movieRoutes];
}
