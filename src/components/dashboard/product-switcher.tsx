"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/i18n/provider";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Globe,
  GraduationCap,
  Sparkles,
  Trophy,
} from "lucide-react";

export type ProductItem = {
  id: string;
  name: string;
  shortName: string;
  category: string;
  subtitle: string;
  description: string;
  url: string;
  isCurrent?: boolean;
  buttonLabel?: string;
  theme: {
    accentBg: string;
    accentText: string;
    buttonBg: string;
    badgeBg: string;
    ringColor: string;
  };
  iconType: "globe" | "cambridge" | "elearning" | "vstep" | "chinese";
};

export const WEWIN_PRODUCTS: ProductItem[] = [
  {
    id: "cambridge",
    name: "WEWIN Exam",
    shortName: "Cambridge Exam",
    category: "CAMBRIDGE",
    subtitle: "Starters • Movers • Flyers • KET",
    description: "Luyện tập & bổ trợ đề thi, từ vựng ôn tập chuẩn Cambridge",
    url: "https://exam.wewin.edu.vn",
    buttonLabel: "Start →",
    iconType: "cambridge",
    theme: {
      accentBg: "bg-blue-50 text-blue-600",
      accentText: "text-blue-600",
      buttonBg: "bg-blue-600 hover:bg-blue-700 text-white",
      badgeBg: "bg-blue-100 text-blue-700",
      ringColor: "ring-blue-500/20",
    },
  },
  {
    id: "ielts",
    name: "WEWIN IELTS",
    shortName: "IELTS",
    category: "ACADEMIC",
    subtitle: "Academic & General",
    description: "Luyện thi IELTS 4 kỹ năng cùng AI & đề thi thực chiến",
    url: "/dashboard",
    isCurrent: true,
    iconType: "globe",
    theme: {
      accentBg: "bg-indigo-50 text-indigo-600",
      accentText: "text-indigo-600",
      buttonBg: "bg-indigo-600 hover:bg-indigo-700 text-white",
      badgeBg: "bg-indigo-100 text-indigo-700",
      ringColor: "ring-indigo-500/20",
    },
  },
  {
    id: "elearning",
    name: "WEWIN E-Learning",
    shortName: "Global Success",
    category: "K-12",
    subtitle: "Global Success 1 đến 9",
    description: "Học tốt tiếng Anh phổ thông theo SGK mới từ lớp 1 đến lớp 9",
    url: "https://elearning.wewin.edu.vn",
    buttonLabel: "Start →",
    iconType: "elearning",
    theme: {
      accentBg: "bg-amber-50 text-amber-700",
      accentText: "text-amber-700",
      buttonBg: "bg-amber-600 hover:bg-amber-700 text-white",
      badgeBg: "bg-amber-100 text-amber-700",
      ringColor: "ring-amber-500/20",
    },
  },
  {
    id: "vstep",
    name: "WEWIN VSTEP",
    shortName: "VSTEP",
    category: "VSTEP",
    subtitle: "Ôn thi VSTEP B1 • B2 • C1",
    description: "Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam",
    url: "https://vstep.wewin.edu.vn",
    buttonLabel: "Start →",
    iconType: "vstep",
    theme: {
      accentBg: "bg-rose-50 text-rose-600",
      accentText: "text-rose-600",
      buttonBg: "bg-rose-600 hover:bg-rose-700 text-white",
      badgeBg: "bg-rose-100 text-rose-700",
      ringColor: "ring-rose-500/20",
    },
  },
  {
    id: "chinese",
    name: "WEWIN Tiếng Trung",
    shortName: "HSK / Chinese",
    category: "HSK 1–9",
    subtitle: "HSK 1–9 & Giao tiếp",
    description: "Học tiếng Trung, luyện thi HSK 1–9 và giao tiếp ứng dụng",
    url: "https://chinese.wewin.edu.vn",
    buttonLabel: "Start →",
    iconType: "chinese",
    theme: {
      accentBg: "bg-emerald-50 text-emerald-800",
      accentText: "text-emerald-800",
      buttonBg: "bg-emerald-700 hover:bg-emerald-800 text-white",
      badgeBg: "bg-emerald-100 text-emerald-800",
      ringColor: "ring-emerald-500/20",
    },
  },
];

function ProductIcon({
  type,
  className = "h-5 w-5",
}: {
  type: ProductItem["iconType"];
  className?: string;
}) {
  switch (type) {
    case "globe":
      return <Globe className={className} />;
    case "cambridge":
      return <GraduationCap className={className} />;
    case "elearning":
      return <BookOpen className={className} />;
    case "vstep":
      return <Trophy className={className} />;
    case "chinese":
      return (
        <span
          className="font-serif font-black text-sm select-none leading-none"
          aria-hidden="true"
        >
          汉
        </span>
      );
    default:
      return <Sparkles className={className} />;
  }
}

type Props = {
  /** "sidebar": Full card on sidebar; "header": compact pill on top bar */
  variant?: "sidebar" | "header";
  /** Collapsed icon rail mode on desktop sidebar */
  compact?: boolean;
  /** Optional callback when a product is clicked or closed */
  onNavigate?: () => void;
};

export function ProductSwitcher({
  variant = "sidebar",
  compact = false,
  onNavigate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "bottom-left" | "right-start" | "bottom-center";
  }>({
    top: 0,
    left: 0,
    width: 320,
    placement: "bottom-left",
  });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate coordinates when opening
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    function updateCoords() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(340, window.innerWidth - 24);

      if (variant === "header") {
        // Place below header pill
        let left = rect.left;
        if (left + popoverWidth > window.innerWidth - 12) {
          left = window.innerWidth - popoverWidth - 12;
        }
        setCoords({
          top: rect.bottom + 8,
          left: Math.max(12, left),
          width: popoverWidth,
          placement: "bottom-left",
        });
      } else if (compact) {
        // Collapsed sidebar: fly out to the right
        setCoords({
          top: Math.max(12, Math.min(rect.top, window.innerHeight - 440)),
          left: rect.right + 12,
          width: popoverWidth,
          placement: "right-start",
        });
      } else {
        // Regular expanded sidebar: open right below trigger
        let left = rect.left;
        if (left + popoverWidth > window.innerWidth - 12) {
          left = window.innerWidth - popoverWidth - 12;
        }
        setCoords({
          top: rect.bottom + 6,
          left: Math.max(12, left),
          width: popoverWidth,
          placement: "bottom-left",
        });
      }
    }

    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);

    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open, variant, compact]);

  // Click outside and ESC key listener
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleTriggerClick() {
    setOpen((prev) => !prev);
  }

  function handleSelectProduct() {
    setOpen(false);
    onNavigate?.();
  }

  // Current active product
  const { t } = useTranslations("productSwitcher");

  const products: ProductItem[] = useMemo(
    () => [
      {
        id: "cambridge",
        name: t("cambridge.name", "WEWIN Exam"),
        shortName: t("cambridge.shortName", "Cambridge Exam"),
        category: t("cambridge.category", "CAMBRIDGE"),
        subtitle: t("cambridge.subtitle", "Starters • Movers • Flyers • KET"),
        description: t(
          "cambridge.desc",
          "Luyện tập & bổ trợ đề thi, từ vựng ôn tập chuẩn Cambridge",
        ),
        url: "https://exam.wewin.edu.vn",
        buttonLabel: t("start", "Start →"),
        iconType: "cambridge",
        theme: {
          accentBg: "bg-blue-50 text-blue-600",
          accentText: "text-blue-600",
          buttonBg: "bg-blue-600 hover:bg-blue-700 text-white",
          badgeBg: "bg-blue-100 text-blue-700",
          ringColor: "ring-blue-500/20",
        },
      },
      {
        id: "ielts",
        name: t("ielts.name", "WEWIN IELTS"),
        shortName: t("ielts.shortName", "IELTS"),
        category: t("ielts.category", "ACADEMIC"),
        subtitle: t("ielts.subtitle", "Academic & General"),
        description: t(
          "ielts.desc",
          "Luyện thi IELTS 4 kỹ năng cùng AI & đề thi thực chiến",
        ),
        url: "/dashboard",
        isCurrent: true,
        iconType: "globe",
        theme: {
          accentBg: "bg-indigo-50 text-indigo-600",
          accentText: "text-indigo-600",
          buttonBg: "bg-indigo-600 hover:bg-indigo-700 text-white",
          badgeBg: "bg-indigo-100 text-indigo-700",
          ringColor: "ring-indigo-500/20",
        },
      },
      {
        id: "elearning",
        name: t("elearning.name", "WEWIN E-Learning"),
        shortName: t("elearning.shortName", "Global Success"),
        category: t("elearning.category", "K-12"),
        subtitle: t("elearning.subtitle", "Global Success 1 đến 9"),
        description: t(
          "elearning.desc",
          "Học tốt tiếng Anh phổ thông theo SGK mới từ lớp 1 đến lớp 9",
        ),
        url: "https://elearning.wewin.edu.vn",
        buttonLabel: t("start", "Start →"),
        iconType: "elearning",
        theme: {
          accentBg: "bg-amber-50 text-amber-700",
          accentText: "text-amber-700",
          buttonBg: "bg-amber-600 hover:bg-amber-700 text-white",
          badgeBg: "bg-amber-100 text-amber-700",
          ringColor: "ring-amber-500/20",
        },
      },
      {
        id: "vstep",
        name: t("vstep.name", "WEWIN VSTEP"),
        shortName: t("vstep.shortName", "VSTEP"),
        category: t("vstep.category", "VSTEP"),
        subtitle: t("vstep.subtitle", "Ôn thi VSTEP B1 • B2 • C1"),
        description: t(
          "vstep.desc",
          "Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam",
        ),
        url: "https://vstep.wewin.edu.vn",
        buttonLabel: t("start", "Start →"),
        iconType: "vstep",
        theme: {
          accentBg: "bg-rose-50 text-rose-600",
          accentText: "text-rose-600",
          buttonBg: "bg-rose-600 hover:bg-rose-700 text-white",
          badgeBg: "bg-rose-100 text-rose-700",
          ringColor: "ring-rose-500/20",
        },
      },
      {
        id: "chinese",
        name: t("chinese.name", "WEWIN Tiếng Trung"),
        shortName: t("chinese.shortName", "HSK / Chinese"),
        category: t("chinese.category", "HSK 1–9"),
        subtitle: t("chinese.subtitle", "HSK 1–9 & Giao tiếp"),
        description: t(
          "chinese.desc",
          "Học tiếng Trung, luyện thi HSK 1–9 và giao tiếp ứng dụng",
        ),
        url: "https://chinese.wewin.edu.vn",
        buttonLabel: t("start", "Start →"),
        iconType: "chinese",
        theme: {
          accentBg: "bg-emerald-50 text-emerald-800",
          accentText: "text-emerald-800",
          buttonBg: "bg-emerald-700 hover:bg-emerald-800 text-white",
          badgeBg: "bg-emerald-100 text-emerald-800",
          ringColor: "ring-emerald-500/20",
        },
      },
    ],
    [t],
  );

  const currentProduct = products.find((p) => p.isCurrent) ?? products[1];
  const headerLabel = t("switchProduct", "SWITCH PRODUCT");

  // 1. Variant: Header Pill
  if (variant === "header") {
    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:border-white/30 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-gold/80"
          title="Chuyển sản phẩm trong hệ sinh thái WEWIN"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white">
            <Globe className="h-2.5 w-2.5" />
          </span>
          <span className="tracking-tight">{currentProduct.shortName}</span>
          <ChevronDown
            className={`h-3 w-3 text-white/70 transition-transform duration-200 ${
              open ? "rotate-180 text-white" : "group-hover:text-white"
            }`}
          />
        </button>

        {mounted && open
          ? createPortal(
              renderPopoverMenu({
                popoverRef,
                menuId,
                coords,
                products,
                headerLabel,
                onSelect: handleSelectProduct,
              }),
              document.body,
            )
          : null}
      </>
    );
  }

  // 2. Variant: Sidebar Compact (rail collapsed on desktop)
  if (compact) {
    return (
      <div className="relative flex justify-center">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
            open
              ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-xs"
              : "border-zinc-200/80 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
          }`}
          title="Chuyển sản phẩm (WEWIN Ecosystem)"
          aria-label="Chuyển sản phẩm (WEWIN Ecosystem)"
        >
          <ProductIcon type={currentProduct.iconType} className="h-5 w-5" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white shadow-xs">
            ▾
          </span>
        </button>

        {mounted && open
          ? createPortal(
              renderPopoverMenu({
                popoverRef,
                menuId,
                coords,
                products,
                headerLabel,
                onSelect: handleSelectProduct,
              }),
              document.body,
            )
          : null}
      </div>
    );
  }

  // 3. Variant: Sidebar Expanded (Full Toey style card)
  return (
    <div className="relative px-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border p-2 text-left transition select-none ${
          open
            ? "border-indigo-200 bg-indigo-50/40 shadow-xs"
            : "border-transparent bg-transparent hover:border-zinc-200/80 hover:bg-zinc-50/90"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Brand Mascot / Mark Icon */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs border border-zinc-200/70 p-1">
            <Image
              src="/brand/wewin-mark.png"
              alt="WEWIN"
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-bold tracking-tight text-zinc-900 group-hover:text-indigo-950">
                {currentProduct.name}
              </span>
            </div>
            <p className="truncate text-[11px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-indigo-600/80">
              {currentProduct.category}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center pr-1 text-zinc-400 transition-colors group-hover:text-zinc-600">
          <ChevronsUpDown className="h-4 w-4" />
        </div>
      </button>

      {mounted && open
        ? createPortal(
            renderPopoverMenu({
              popoverRef,
              menuId,
              coords,
              products,
              headerLabel,
              onSelect: handleSelectProduct,
            }),
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * Render the Popover Dropdown matching Toey style with pixel-perfect design
 */
function renderPopoverMenu({
  popoverRef,
  menuId,
  coords,
  products,
  headerLabel,
  onSelect,
}: {
  popoverRef: React.RefObject<HTMLDivElement | null>;
  menuId: string;
  coords: {
    top: number;
    left: number;
    width: number;
    placement: string;
  };
  products: ProductItem[];
  headerLabel: string;
  onSelect: () => void;
}) {
  return (
    <div
      ref={popoverRef}
      id={menuId}
      role="menu"
      tabIndex={-1}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 9999,
      }}
      className="animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/15 ring-1 ring-black/5"
    >
      {/* Header Label: SWITCH PRODUCT */}
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-2.5">
        <p className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 select-none">
          {headerLabel}
        </p>
      </div>

      {/* Product List */}
      <div className="flex flex-col gap-1.5 p-2">
        {products.map((product) => {
          const isCurrent = Boolean(product.isCurrent);

          if (isCurrent) {
            return (
              <div
                key={product.id}
                role="menuitem"
                aria-current="page"
                className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100/90 bg-indigo-50/70 p-2.5 transition select-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs`}
                  >
                    <ProductIcon
                      type={product.iconType}
                      className="h-5 w-5 stroke-[2.2]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-zinc-900">
                      {product.name}
                    </p>
                    <p className="truncate text-xs font-medium text-indigo-700/80">
                      {product.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center pr-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center text-indigo-600"
                    aria-label="Đang chọn"
                  >
                    <Check className="h-4 w-4 stroke-[2.6]" />
                  </span>
                </div>
              </div>
            );
          }

          return (
            <a
              key={product.id}
              href={product.url}
              role="menuitem"
              onClick={onSelect}
              rel="noreferrer"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-transparent p-2.5 transition hover:border-zinc-200/70 hover:bg-zinc-50 select-none"
              title={`${product.name} - ${product.description}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${product.theme.accentBg}`}
                >
                  <ProductIcon
                    type={product.iconType}
                    className="h-5 w-5 stroke-[2.2]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-zinc-800 group-hover:text-zinc-950">
                      {product.name}
                    </p>
                  </div>
                  <p className="truncate text-xs text-zinc-500 group-hover:text-zinc-600">
                    {product.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Button: Start → */}
              <div className="flex shrink-0 items-center">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-xs transition group-hover:opacity-95 group-hover:shadow-md ${product.theme.buttonBg}`}
                >
                  <span>Start</span>
                  <ArrowRight className="h-3 w-3 stroke-[2.5]" />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
