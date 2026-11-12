"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Loader2, CheckCircle2, AlertCircle, Calendar, Users, Layers } from "lucide-react";
import type { WorksheetCardCatalogItem } from "@/lib/learn/worksheet-types";

interface ClassOption {
  id: string;
  name: string;
  code: string;
  status: string;
  timezone?: string;
}

interface Props {
  card: WorksheetCardCatalogItem | null;
  onClose: () => void;
}

function defaultDeadline(): string {
  const d = new Date(Date.now() + 7 * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AssignWorksheetModal({ card, onClose }: Props) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [deadline, setDeadline] = useState<string>(defaultDeadline());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/classes");
        if (!res.ok) throw new Error("Failed to load classes");
        const data = (await res.json()) as { classes?: ClassOption[] };
        const activeClasses = (data.classes || []).filter((c) => c.status === "ACTIVE");
        setClasses(activeClasses);
        if (activeClasses.length > 0) {
          setSelectedClassId(activeClasses[0].id);
        }
      } catch {
        setNotice({ kind: "error", text: "Không thể tải danh sách lớp học của bạn." });
      } finally {
        setLoadingClasses(false);
      }
    }
    void load();
  }, []);

  if (!card) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClassId) {
      setNotice({ kind: "error", text: "Vui lòng chọn lớp học." });
      return;
    }
    if (!deadline) {
      setNotice({ kind: "error", text: "Vui lòng chọn hạn nộp bài." });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/classes/${selectedClassId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: [
            {
              testSlug: `worksheets/${card!.slug}`,
              deadlineWallTime: deadline,
            },
          ],
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.code || "Không thể giao bài tập");
      }

      setNotice({
        kind: "ok",
        text: `Đã giao "${card!.title} - ${card!.subjectVi}" cho lớp thành công!`,
      });
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      setNotice({ kind: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-zinc-100">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-[#7a5f12] text-xs font-bold border border-amber-200 mb-1.5">
              <Send className="w-3 h-3 text-amber-600" /> Giáo viên giao bài tập
            </span>
            <h3 className="text-lg font-bold text-wewin-navy truncate">
              {card.title}: {card.subjectVi}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cấp độ {card.level} • {card.sectionCount} phần bài tập ({card.questionCount} câu)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {notice && (
          <div
            className={`mb-4 flex items-center gap-2.5 rounded-xl p-3 text-sm ${
              notice.kind === "ok"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {notice.kind === "ok" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              <Users className="w-3.5 h-3.5 inline mr-1 text-wewin-navy" /> Chọn lớp học nhận bài tập
            </label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-wewin-navy" /> Đang tải danh sách lớp...
              </div>
            ) : classes.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Bạn chưa có lớp học nào đang hoạt động. Vui lòng tạo lớp học trong trang Quản lý Lớp học trước.
              </p>
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} — {cls.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              <Layers className="w-3.5 h-3.5 inline mr-1 text-wewin-navy" /> Phạm vi bài tập
            </label>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-700">
              <span className="font-semibold text-wewin-navy">Toàn bộ thẻ bài tập</span> (Gồm {card.sectionCount} phần: {card.sourceWorksheets.join(", ")})
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-wewin-navy" /> Hạn nộp bài
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg"
            />
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || classes.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wewin-navy text-white text-sm font-bold hover:bg-wewin-navy-hover transition-colors disabled:opacity-50 shadow-md shadow-wewin-navy/15"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang giao bài...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Giao bài cho lớp
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

