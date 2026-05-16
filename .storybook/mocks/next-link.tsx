import { forwardRef, type AnchorHTMLAttributes } from "react";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string | { pathname?: string; query?: Record<string, string> };
};

const NextLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, ...props }, ref) => (
    <a
      href={typeof href === "string" ? href : href.pathname ?? "#"}
      {...props}
      ref={ref}
    >
      {children}
    </a>
  )
);
NextLink.displayName = "NextLink";

export default NextLink;
