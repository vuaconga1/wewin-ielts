export type WorksheetQuestionType =
  | "inline_gap_fill"
  | "passage_gap_fill"
  | "verb_conjugation"
  | "sentence_rewrite"
  | "multiple_choice"
  | "sentence_combine"
  | "question_formation"
  | "error_correction"
  | "sentence_building"
  | "matching"
  | "reading_qa";

export interface WorksheetQuestion {
  id: string;
  order: number;
  prompt: string;
  underlinedPart?: string;
  verbBase?: string;
  options?: string[];
  acceptedAnswers: string[];
  explanation?: string;
  sampleAnswer?: string;
}

export interface WorksheetSection {
  id: string;
  sectionKey: string;
  instruction: string;
  type: WorksheetQuestionType;
  contextText?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  wordBank?: string[];
  questions: WorksheetQuestion[];
}

export interface WorksheetLesson {
  id: string;
  order: number;
  part: 1 | 2 | 3 | 4 | 5;
  slug: string;
  title: string;
  subject: string;
  subjectVi: string;
  level: "A1" | "A2" | "B1" | "B2";
  pageRange: string;
  linkedGrammarTopics?: string[];
  sections: WorksheetSection[];
}

export interface WorksheetCatalogItem {
  id: string;
  order: number;
  part: 1 | 2 | 3 | 4 | 5;
  slug: string;
  title: string;
  subject: string;
  subjectVi: string;
  level: "A1" | "A2" | "B1" | "B2";
  pageRange: string;
  sectionCount: number;
  questionCount: number;
  linkedGrammarTopics?: string[];
}

export interface WorksheetUserProgress {
  worksheetId: string;
  completedAt?: string;
  score: number;
  totalQuestions: number;
  sectionScores: Record<string, { correct: number; total: number }>;
  userAnswers: Record<string, string>;
}

