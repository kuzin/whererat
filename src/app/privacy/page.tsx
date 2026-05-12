import type { Metadata } from "next";
import { InfoPageShell, InfoHero, InfoSection, InfoNote } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How WhereRat handles data in the catalog, website, and native app.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    icon: "📱",
    title: "Native app (v1)",
    body: "WhereRat mobile v1 is read-only. It mirrors public catalog data and does not include account sign-in, profile creation, or submission uploads from the app.",
  },
  {
    icon: "🌐",
    title: "Network requests",
    body: "The app and web client call WhereRat HTTPS APIs to load movies and sightings. In v1 mobile, these are read-only GET requests and do not include user credentials.",
  },
  {
    icon: "🖼️",
    title: "Third-party services",
    body: "WhereRat uses IMDb-linked metadata providers (including OMDb) and may load poster/still assets from referenced media hosts. Opening outbound links (for example IMDb pages) sends requests directly to those third-party services under their own terms.",
  },
  {
    icon: "🗂️",
    title: "Data retention (v1 mobile)",
    body: "The current native app is read-only and does not create user accounts or submission records in-app. Any local data is limited to temporary app/device cache needed to render catalog content.",
  },
  {
    icon: "🧪",
    title: "Diagnostics",
    body: "Platform-level logs and crash data may be collected by Apple/Google and any services you enable in production builds. If analytics or crash tooling is added, disclosures should be updated in app-store listings and this page.",
  },
  {
    icon: "♿",
    title: "Accessibility and support",
    body: "If you need this policy in another format or encounter accessibility barriers, use the public support contact listed on WhereRat and app store support pages.",
  },
  {
    icon: "✉️",
    title: "Questions",
    body: "For moderation, legal, or data questions, use the public contact listed on WhereRat.com and your app-store support metadata.",
  },
];

export default function PrivacyPage() {
  return (
    <InfoPageShell
      hero={
        <InfoHero
          icon="🔒"
          title="Privacy"
          description="How WhereRat handles data today, what third-party services may see, and what changes if we expand beyond the current read-only mobile scope."
        />
      }
    >
      {sections.map((s) => (
        <InfoSection key={s.title} icon={s.icon} title={s.title}>
          {s.body}
        </InfoSection>
      ))}

      <InfoNote>
        This page reflects the current v1 behavior and should be updated when new features are added
        (accounts, app submissions, analytics providers, or additional data retention).
      </InfoNote>
    </InfoPageShell>
  );
}
