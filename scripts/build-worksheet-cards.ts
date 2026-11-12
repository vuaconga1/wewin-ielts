import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import type {
  WorksheetLesson,
  WorksheetSection,
  WorksheetQuestion,
} from "../src/lib/learn/worksheet-types";

export interface CardDef {
  id: string;
  order: number;
  slug: string;
  title: string;
  subject: string;
  subjectVi: string;
  category: "tenses_verbs" | "sentence_structures" | "parts_of_speech";
  categoryVi: string;
  level: "A1 - A2" | "A2" | "A2 - B1" | "B1" | "B1 - B2" | "B2";
  worksheetIds: string[];
}

export const CARD_DEFINITIONS: CardDef[] = [
  {
    id: "card-01",
    order: 1,
    slug: "card-01-dong-tu-to-be-dai-tu-nhan-xung",
    title: "THẺ BÀI TẬP 01",
    subject: "Verb \"To Be\" & Subject Pronouns",
    subjectVi: "Động từ \"To Be\" & Đại từ nhân xưng",
    category: "tenses_verbs",
    categoryVi: "Hệ thống Thì & Động từ",
    level: "A1 - A2",
    worksheetIds: ["ws-01", "ws-05", "ws-06"],
  },
  {
    id: "card-02",
    order: 2,
    slug: "card-02-hien-tai-don-hien-tai-tiep-dien",
    title: "THẺ BÀI TẬP 02",
    subject: "Present Simple & Present Continuous",
    subjectVi: "Thì Hiện tại đơn & Hiện tại tiếp diễn",
    category: "tenses_verbs",
    categoryVi: "Hệ thống Thì & Động từ",
    level: "A1 - A2",
    worksheetIds: ["ws-02", "ws-03", "ws-04", "ws-07-review"],
  },
  {
    id: "card-03",
    order: 3,
    slug: "card-03-qua-khu-don-qua-khu-tiep-dien",
    title: "THẺ BÀI TẬP 03",
    subject: "Past Simple & Past Continuous",
    subjectVi: "Thì Quá khứ đơn & Quá khứ tiếp diễn",
    category: "tenses_verbs",
    categoryVi: "Hệ thống Thì & Động từ",
    level: "A2",
    worksheetIds: ["ws-07", "ws-08", "ws-09"],
  },
  {
    id: "card-04",
    order: 4,
    slug: "card-04-hien-tai-hoan-thanh-tiep-dien",
    title: "THẺ BÀI TẬP 04",
    subject: "Present Perfect & Continuous",
    subjectVi: "Thì Hiện tại hoàn thành & Tiếp diễn",
    category: "tenses_verbs",
    categoryVi: "Hệ thống Thì & Động từ",
    level: "A2 - B1",
    worksheetIds: ["ws-10", "ws-11", "ws-12"],
  },
  {
    id: "card-05",
    order: 5,
    slug: "card-05-qua-khu-hoan-thanh-tiep-dien",
    title: "THẺ BÀI TẬP 05",
    subject: "Past Perfect & Continuous",
    subjectVi: "Thì Quá khứ hoàn thành & Tiếp diễn",
    category: "tenses_verbs",
    categoryVi: "Hệ thống Thì & Động từ",
    level: "A2 - B1",
    worksheetIds: ["ws-13", "ws-14"],
  },
  {
    id: "card-06",
    order: 6,
    slug: "card-06-cac-thi-va-cau-truc-tuong-lai",
    title: "THẺ BÀI TẬP 06",
    subject: "Future Forms & Expressions",
    subjectVi: "Các thì & Cấu trúc Tương lai",
    category: "tenses_verbs",
    categoryVi: "Hệ thống Thì & Động từ",
    level: "A2 - B1",
    worksheetIds: ["ws-15", "ws-16", "ws-17", "ws-18", "ws-19"],
  },
  {
    id: "card-07",
    order: 7,
    slug: "card-07-tong-on-va-phoi-hop-cac-thi",
    title: "THẺ BÀI TẬP 07",
    subject: "Master Tenses Review & Voice",
    subjectVi: "Tổng ôn & Phối hợp các Thì",
    category: "tenses_verbs",
    categoryVi: "Hệ thống Thì & Động từ",
    level: "A2 - B1",
    worksheetIds: ["ws-20", "ws-21", "ws-22"],
  },
  {
    id: "card-08",
    order: 8,
    slug: "card-08-cau-bi-dong-toan-dien",
    title: "THẺ BÀI TẬP 08",
    subject: "Passive Voice Mastery",
    subjectVi: "Câu bị động toàn diện",
    category: "sentence_structures",
    categoryVi: "Cấu trúc Biến đổi câu",
    level: "B1",
    worksheetIds: ["ws-23", "ws-24", "ws-25"],
  },
  {
    id: "card-09",
    order: 9,
    slug: "card-09-cau-gian-tiep-tuong-thuat",
    title: "THẺ BÀI TẬP 09",
    subject: "Reported Speech",
    subjectVi: "Câu gián tiếp / Tường thuật",
    category: "sentence_structures",
    categoryVi: "Cấu trúc Biến đổi câu",
    level: "B1",
    worksheetIds: ["ws-26", "ws-27"],
  },
  {
    id: "card-10",
    order: 10,
    slug: "card-10-cau-dieu-kien-va-cau-uoc",
    title: "THẺ BÀI TẬP 10",
    subject: "Conditionals & Wishes",
    subjectVi: "Câu điều kiện & Câu ước",
    category: "sentence_structures",
    categoryVi: "Cấu trúc Biến đổi câu",
    level: "B1",
    worksheetIds: ["ws-30", "ws-31", "ws-32"],
  },
  {
    id: "card-11",
    order: 11,
    slug: "card-11-menh-de-quan-he",
    title: "THẺ BÀI TẬP 11",
    subject: "Relative Clauses",
    subjectVi: "Mệnh đề quan hệ",
    category: "sentence_structures",
    categoryVi: "Cấu trúc Biến đổi câu",
    level: "B1",
    worksheetIds: ["ws-36", "ws-37"],
  },
  {
    id: "card-12",
    order: 12,
    slug: "card-12-dong-tu-khuyet-thieu-va-thoi-quen-qua-khu",
    title: "THẺ BÀI TẬP 12",
    subject: "Modals & Habits in the Past",
    subjectVi: "Động từ khuyết thiếu & Thói quen quá khứ",
    category: "sentence_structures",
    categoryVi: "Cấu trúc Biến đổi câu",
    level: "B1 - B2",
    worksheetIds: ["ws-38", "ws-39", "ws-40", "ws-55", "ws-56"],
  },
  {
    id: "card-13",
    order: 13,
    slug: "card-13-tinh-tu-trang-tu-cap-so-sanh",
    title: "THẺ BÀI TẬP 13",
    subject: "Adjectives, Adverbs & Comparison",
    subjectVi: "Tính từ, Trạng từ & Cấp so sánh",
    category: "parts_of_speech",
    categoryVi: "Từ loại & Cấu trúc bổ trợ",
    level: "B1",
    worksheetIds: ["ws-28", "ws-29", "ws-33"],
  },
  {
    id: "card-14",
    order: 14,
    slug: "card-14-gioi-tu-thoi-gian-va-noi-chon",
    title: "THẺ BÀI TẬP 14",
    subject: "Prepositions: At, In, On & Phrases",
    subjectVi: "Giới từ thời gian & nơi chốn",
    category: "parts_of_speech",
    categoryVi: "Từ loại & Cấu trúc bổ trợ",
    level: "B1",
    worksheetIds: ["ws-34", "ws-35"],
  },
  {
    id: "card-15",
    order: 15,
    slug: "card-15-tu-chi-luong-va-dai-tu-bat-dinh",
    title: "THẺ BÀI TẬP 15",
    subject: "Quantifiers & Indefinite Pronouns",
    subjectVi: "Từ chỉ lượng & Đại từ bất định",
    category: "parts_of_speech",
    categoryVi: "Từ loại & Cấu trúc bổ trợ",
    level: "B1",
    worksheetIds: ["ws-41", "ws-42"],
  },
  {
    id: "card-16",
    order: 16,
    slug: "card-16-mao-tu-a-an-the",
    title: "THẺ BÀI TẬP 16",
    subject: "Articles & Zero Article",
    subjectVi: "Mạo từ: A, An, The",
    category: "parts_of_speech",
    categoryVi: "Từ loại & Cấu trúc bổ trợ",
    level: "B2",
    worksheetIds: ["ws-46"],
  },
  {
    id: "card-17",
    order: 17,
    slug: "card-17-lien-tu-va-menh-de-trang-ngu",
    title: "THẺ BÀI TẬP 17",
    subject: "Conjunctions & Adverbial Clauses",
    subjectVi: "Liên từ & Mệnh đề trạng ngữ",
    category: "sentence_structures",
    categoryVi: "Cấu trúc Biến đổi câu",
    level: "B1 - B2",
    worksheetIds: ["ws-45", "ws-47", "ws-48", "ws-49"],
  },
  {
    id: "card-18",
    order: 18,
    slug: "card-18-danh-dong-tu-va-dong-tu-nguyen-mau",
    title: "THẺ BÀI TẬP 18",
    subject: "Gerund or Infinitive",
    subjectVi: "Danh động từ & Động từ nguyên mẫu",
    category: "tenses_verbs",
    categoryVi: "Hệ thống Thì & Động từ",
    level: "B2",
    worksheetIds: ["ws-50", "ws-51"],
  },
  {
    id: "card-19",
    order: 19,
    slug: "card-19-he-thong-dai-tu-va-so-huu",
    title: "THẺ BÀI TẬP 19",
    subject: "Pronouns & Possessive Forms",
    subjectVi: "Hệ thống Đại từ & Sở hữu",
    category: "parts_of_speech",
    categoryVi: "Từ loại & Cấu trúc bổ trợ",
    level: "B2",
    worksheetIds: ["ws-52", "ws-53", "ws-54", "ws-57"],
  },
  {
    id: "card-20",
    order: 20,
    slug: "card-20-cau-truc-dac-biet-va-viet-lai-cau-tong-hop",
    title: "THẺ BÀI TẬP 20",
    subject: "Special Structures & Master Rewrite",
    subjectVi: "Cấu trúc câu đặc biệt & Viết lại câu",
    category: "sentence_structures",
    categoryVi: "Cấu trúc Biến đổi câu",
    level: "B1 - B2",
    worksheetIds: ["ws-43", "ws-44", "ws-58", "ws-59", "ws-60"],
  },
];

function getAlphabetKey(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < 26) {
    return letters[index];
  }
  const first = letters[Math.floor(index / 26) - 1];
  const second = letters[index % 26];
  return `${first}${second}`;
}

export function buildWorksheetCards() {
  const root = path.join(__dirname, "..", "data", "learn");
  const wsDir = path.join(root, "worksheets");
  const outDir = path.join(root, "worksheet-cards");
  const catalogPath = path.join(root, "worksheet-cards-catalog.json");

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const catalogItems = [];

  for (const cardDef of CARD_DEFINITIONS) {
    const mergedSections: WorksheetSection[] = [];
    let sectionIdx = 0;

    for (const wsId of cardDef.worksheetIds) {
      const wsFile = path.join(wsDir, `${wsId}.json`);
      if (!existsSync(wsFile)) {
        console.error(`Worksheet file missing: ${wsFile}`);
        continue;
      }

      const lesson = JSON.parse(readFileSync(wsFile, "utf8")) as WorksheetLesson;
      for (const sec of lesson.sections) {
        const letterKey = getAlphabetKey(sectionIdx);
        sectionIdx++;

        mergedSections.push({
          ...sec,
          id: `${cardDef.id}-sec-${sectionIdx}`,
          sectionKey: letterKey,
        });
      }
    }

    const questionCount = mergedSections.reduce((acc, s) => acc + s.questions.length, 0);

    const cardLesson: WorksheetLesson = {
      id: cardDef.id,
      order: cardDef.order,
      part: 1,
      slug: cardDef.slug,
      title: cardDef.title,
      subject: cardDef.subject,
      subjectVi: cardDef.subjectVi,
      level: (cardDef.level.includes("A1") ? "A1" : cardDef.level.includes("A2") ? "A2" : cardDef.level.includes("B1") ? "B1" : "B2"),
      pageRange: `${cardDef.worksheetIds.map((id) => id.toUpperCase()).join(", ")}`,
      sections: mergedSections,
    };

    const cardOutPath = path.join(outDir, `${cardDef.id}.json`);
    writeFileSync(cardOutPath, JSON.stringify(cardLesson, null, 2), "utf8");

    catalogItems.push({
      id: cardDef.id,
      order: cardDef.order,
      slug: cardDef.slug,
      title: cardDef.title,
      subject: cardDef.subject,
      subjectVi: cardDef.subjectVi,
      category: cardDef.category,
      categoryVi: cardDef.categoryVi,
      level: cardDef.level,
      sourceWorksheets: cardDef.worksheetIds.map((id) => id.toUpperCase()),
      sectionCount: mergedSections.length,
      questionCount,
    });

    console.log(
      `✓ Built ${cardDef.id}: ${cardDef.title} - ${mergedSections.length} sections (${mergedSections[0]?.sectionKey || ""}..${mergedSections[mergedSections.length - 1]?.sectionKey || ""}), ${questionCount} questions`,
    );
  }

  writeFileSync(catalogPath, JSON.stringify({ cards: catalogItems }, null, 2), "utf8");
  console.log(`\nSuccessfully created ${catalogItems.length} cards and updated ${catalogPath}`);
}

if (require.main === module) {
  buildWorksheetCards();
}

