"use client";

import Link from "next/link";

type ControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ page, totalPages, onPageChange }: ControlsProps) {
  if (totalPages <= 1) return null;
  return <nav className="mt-4 flex items-center justify-end gap-2 text-sm" aria-label="Phân trang">
    <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-wewin-border bg-white px-3 py-2 font-medium disabled:opacity-40">Trước</button>
    <span className="min-w-24 text-center text-zinc-600">Trang {page}/{totalPages}</span>
    <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-wewin-border bg-white px-3 py-2 font-medium disabled:opacity-40">Sau</button>
  </nav>;
}

type LinksProps = {
  page: number;
  totalPages: number;
  pathname: string;
  params?: Record<string, string | undefined>;
};

export function PaginationLinks({ page, totalPages, pathname, params = {} }: LinksProps) {
  if (totalPages <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    if (target > 1) query.set("page", String(target));
    const suffix = query.toString();
    return suffix ? `${pathname}?${suffix}` : pathname;
  };
  return <nav className="mt-4 flex items-center justify-end gap-2 text-sm" aria-label="Phân trang">
    {page > 1 ? <Link href={href(page - 1)} className="rounded-lg border border-wewin-border bg-white px-3 py-2 font-medium">Trước</Link> : <span className="rounded-lg border border-wewin-border px-3 py-2 opacity-40">Trước</span>}
    <span className="min-w-24 text-center text-zinc-600">Trang {page}/{totalPages}</span>
    {page < totalPages ? <Link href={href(page + 1)} className="rounded-lg border border-wewin-border bg-white px-3 py-2 font-medium">Sau</Link> : <span className="rounded-lg border border-wewin-border px-3 py-2 opacity-40">Sau</span>}
  </nav>;
}
