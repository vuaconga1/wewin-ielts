import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  /** Primary action */
  actionHref?: string;
  actionLabel?: string;
  /** Optional secondary link */
  secondaryHref?: string;
  secondaryLabel?: string;
  icon?: "inbox" | "search" | "book";
};

function Icon({ type }: { type: NonNullable<Props["icon"]> }) {
  const common = "h-10 w-10 text-wewin-navy";
  if (type === "search") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
        />
      </svg>
    );
  }
  if (type === "book") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
        />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V7a2 2 0 0 0-2-2h-3l-2-2H9L7 5H4a2 2 0 0 0-2 2v6m18 0v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4m18 0H2"
      />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
  icon = "inbox",
}: Props) {
  return (
    <div className="wewin-card-3d border-dashed border-wewin-accent-blue px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-wewin-accent-blue-bg bg-wewin-accent-blue-bg">
        <Icon type={icon} />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">{description}</p>
      ) : null}
      {(actionHref && actionLabel) || (secondaryHref && secondaryLabel) ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="inline-flex rounded-lg bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-wewin-navy/20 hover:bg-wewin-navy-hover"
            >
              {actionLabel}
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="text-sm font-medium text-wewin-navy hover:underline"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
