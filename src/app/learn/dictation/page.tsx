import { PracticeGameHubPage, practiceGameMetadata } from "@/components/learn/practice-game-pages";

export const revalidate = 300;

export function generateMetadata() {
  return practiceGameMetadata("dictation");
}

export default function DictationCatalogPage() {
  return <PracticeGameHubPage game="dictation" />;
}
