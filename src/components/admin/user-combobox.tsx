"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { AdminUserOption } from "@/lib/admin/attempts";
import { useTranslations } from "@/i18n/provider";

function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function displayName(user: AdminUserOption): string {
  return user.fullName?.trim() || user.username;
}

function secondaryText(user: AdminUserOption): string {
  const parts = user.fullName?.trim() ? [user.username] : [];
  if (user.email) parts.push(user.email);
  return parts.join(" · ");
}

type Props = {
  users: AdminUserOption[];
  value: string;
  onChange: (userId: string) => void;
  id?: string;
};

type Item = { id: string; user: AdminUserOption | null };

export function UserCombobox({ users, value, onChange, id }: Props) {
  const { t } = useTranslations("attemptsAdmin");
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const listId = `${autoId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = useMemo(
    () => users.find((u) => u.id === value) ?? null,
    [users, value],
  );

  const indexed = useMemo(
    () =>
      users.map((user) => ({
        user,
        haystack: foldText(
          `${user.fullName ?? ""} ${user.username} ${user.email ?? ""}`,
        ),
      })),
    [users],
  );

  const items = useMemo<Item[]>(() => {
    const q = foldText(query.trim());
    const matches = q
      ? indexed.filter((entry) =>
          q.split(/\s+/).every((part) => entry.haystack.includes(part)),
        )
      : indexed;
    const list: Item[] = matches.map(({ user }) => ({ id: user.id, user }));
    return q ? list : [{ id: "", user: null }, ...list];
  }, [indexed, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function openList() {
    if (open) return;
    const idx = items.findIndex((item) => item.id === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function choose(item: Item) {
    onChange(item.id);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return openList();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openList();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const item = items[active];
      if (item) choose(item);
    } else if (e.key === "Escape") {
      if (!open) return;
      e.preventDefault();
      setOpen(false);
      setQuery("");
    } else if (e.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  }

  const inputValue = open
    ? query
    : selected
      ? displayName(selected)
      : "";

  return (
    <div ref={rootRef} className="relative min-w-0">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && items[active] ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          value={inputValue}
          placeholder={
            open
              ? t("learnerSearchPlaceholder", "Gõ tên hoặc username…")
              : t("allLearners", "Tất cả học viên")
          }
          onFocus={openList}
          onClick={openList}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-lg border border-wewin-border bg-white py-2 pl-9 pr-16 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-wewin-navy"
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label={t("clearLearner", "Bỏ chọn học viên")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <ChevronDown
            className="pointer-events-none mr-2 h-4 w-4 text-zinc-400"
            aria-hidden
          />
        </div>
      </div>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-lg border border-wewin-border bg-white py-1 shadow-lg"
        >
          {items.length === 0 ? (
            <li className="px-3 py-3 text-sm text-zinc-500">
              {t("learnerNoResults", "Không tìm thấy học viên")}
            </li>
          ) : (
            items.map((item, index) => {
              const isSelected = item.id === value;
              const isActive = index === active;
              const user = item.user;
              return (
                <li
                  key={item.id || "__all"}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(item)}
                  onMouseMove={() => setActive(index)}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                    isActive ? "bg-wewin-accent-blue-bg" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {user ? (
                      <>
                        <div className="break-words font-medium text-zinc-900">
                          {displayName(user)}
                        </div>
                        {secondaryText(user) ? (
                          <div className="break-all text-xs text-zinc-500">
                            {secondaryText(user)}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="font-medium text-zinc-700">
                        {t("allLearners", "Tất cả học viên")}
                      </div>
                    )}
                  </div>
                  {user && user.attemptCount ? (
                    <span className="shrink-0 rounded-full bg-wewin-navy/10 px-2 py-0.5 text-xs font-medium text-wewin-navy">
                      {user.attemptCount}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-wewin-navy" />
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
