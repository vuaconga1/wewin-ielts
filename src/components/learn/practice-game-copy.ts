"use client";

import { Headphones, MessageCircleQuestion, Mic, TextCursorInput } from "lucide-react";
import type { PracticeGame } from "@/lib/learn/practice-games";
import { useTranslations } from "@/i18n/provider";

export function usePracticeGameCopy(game: PracticeGame) {
  const { t: tDictation } = useTranslations("dictation");
  const { t: tShadowing } = useTranslations("shadowing");
  switch (game) {
    case "fill-blank":
      return {
        Icon: TextCursorInput,
        title: tDictation("fillCatalogTitle", "Nghe điền từ"),
        desc: tDictation(
          "fillCatalogDesc",
          "Nghe audio, đọc transcript bị ẩn một số từ và điền phần còn thiếu vào từng ô trống.",
        ),
      };
    case "listen-answer":
      return {
        Icon: MessageCircleQuestion,
        title: tDictation("qaCatalogTitle", "Nghe & trả lời câu hỏi"),
        desc: tDictation(
          "qaCatalogDesc",
          "Nghe đoạn hội thoại hoặc đoạn văn ngắn rồi trả lời câu hỏi bằng vài từ tiếng Anh.",
        ),
      };
    case "shadowing":
      return {
        Icon: Mic,
        title: tShadowing("catalogTitle", "Shadowing — Nghe và đọc lại"),
        desc: tShadowing(
          "catalogDesc",
          "Nghe câu mẫu, ghi âm giọng đọc của bạn và xem hệ thống nhận diện khớp với câu mẫu đến đâu.",
        ),
      };
    default:
      return {
        Icon: Headphones,
        title: tDictation("catalogTitle", "Nghe chép chính tả"),
        desc: tDictation(
          "catalogDesc",
          "Nghe audio ngắn, gõ lại nội dung rồi bấm Kiểm tra để xem lỗi theo từng từ.",
        ),
      };
  }
}
