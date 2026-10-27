import Link from "next/link";
import { Lock } from "lucide-react";

type LockedProps = {
  title: string;
  description: string;
  cta?: { href: string; label: string };
};

export function GrammarCourseLocked({ title, description, cta }: LockedProps) {
  return (
    <div className="card-outline px-6 py-14 text-center">
      <Lock className="mx-auto h-10 w-10 text-zinc-400" />
      <h2 className="mt-4 break-words text-lg font-bold text-zinc-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md break-words text-sm text-zinc-600">{description}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-6 inline-flex rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
