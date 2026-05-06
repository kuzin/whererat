import { ExternalLinkIcon } from "./external-link-icon";

type ImdbLinkButtonProps = {
  href: string;
  label: string;
};

export function ImdbLinkButton({ href, label }: ImdbLinkButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      aria-label={label}
      className="wr-btn-ghost inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold"
    >
      View on IMDb
      <ExternalLinkIcon />
    </a>
  );
}
