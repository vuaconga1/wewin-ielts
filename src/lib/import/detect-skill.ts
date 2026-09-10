import type { z } from "zod";
import { SkillSchema } from "./schemas";

export type Skill = z.infer<typeof SkillSchema>;

const SKILL_PATTERNS: { skill: Skill; re: RegExp }[] = [
  { skill: "LISTENING", re: /listen/i },
  { skill: "READING", re: /read/i },
  { skill: "WRITING", re: /writ/i },
  { skill: "SPEAKING", re: /speak/i },
];

export function detectSkillFromFilename(filename: string): Skill | null {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  for (const { skill, re } of SKILL_PATTERNS) {
    if (re.test(base)) return skill;
  }
  return null;
}

export function defaultTimeLimit(skill: Skill): number {
  switch (skill) {
    case "LISTENING":
      return 40;
    case "READING":
      return 60;
    case "WRITING":
      return 60;
    case "SPEAKING":
      return 15;
  }
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function titleFromFilename(filename: string): string {
  const base = (filename.split(/[/\\]/).pop() ?? filename).replace(
    /\.(docx|md|txt)$/i,
    "",
  );
  return base.replace(/[-_]+/g, " ").trim();
}
