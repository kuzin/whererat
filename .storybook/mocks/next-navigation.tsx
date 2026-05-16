// Lightweight mock for next/navigation used in Storybook stories.
// Router mutations are no-ops (logged to console); read-only hooks derive from window.location.

export const useRouter = () => ({
  push: (href: string) => console.log("[mock router] push:", href),
  replace: (href: string) => console.log("[mock router] replace:", href),
  refresh: () => console.log("[mock router] refresh"),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  prefetch: () => {},
});

export const useSearchParams = () => new URLSearchParams(window.location.search);

export const usePathname = () => window.location.pathname;

export const useParams = (): Record<string, string> => ({});

export function notFound(): never {
  throw new Error("[mock] notFound()");
}

export function redirect(_url: string): never {
  throw new Error("[mock] redirect()");
}
