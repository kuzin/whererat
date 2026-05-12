import type { Metadata } from "next";
import { InfoPageShell, InfoHero, InfoSection } from "@/components/info-page";

export const metadata: Metadata = {
  title: "About",
  description: "About WhereRat, the technology stack, data sources, and AI-assisted development process.",
  alternates: {
    canonical: "/about",
  },
};

const sections = [
  {
    icon: "🐀",
    title: "What is WhereRat",
    body: "WhereRat is a spoiler-aware catalog of rodent appearances in film and TV. It helps people track specific rodent moments without forcing spoilers by default.",
  },
  {
    icon: "🧱",
    title: "Technology",
    body: "Web: Next.js + React + TypeScript. Mobile: React Native + Expo (Expo Router). Catalog and sightings are served by WhereRat APIs over HTTPS.",
  },
  {
    icon: "🔌",
    title: "Data and API credits",
    body: "Title metadata, posters, and ratings are synchronized from IMDb-linked data providers, including OMDb. External links may open IMDb and other third-party destinations under their own terms.",
  },
  {
    icon: "🤖",
    title: "AI usage",
    body: "WhereRat was built with significant AI-assisted development support for ideation, implementation, refactoring, copy iteration, and UI polish. Final product decisions and releases are curated by the project owner.",
  },
  {
    icon: "♿",
    title: "Accessibility",
    body: "WhereRat aims to keep content readable, keyboard-friendly, and spoiler-safe by default. If you encounter accessibility issues, please reach out through the public contact channels linked from the site.",
  },
];

export default function AboutPage() {
  return (
    <InfoPageShell
      hero={
        <InfoHero
          icon="🐀"
          title="About"
          description="What powers WhereRat, where core metadata comes from, and how the project is built and maintained."
        />
      }
    >
      {sections.map((s) => (
        <InfoSection key={s.title} icon={s.icon} title={s.title}>
          {s.body}
        </InfoSection>
      ))}
    </InfoPageShell>
  );
}
