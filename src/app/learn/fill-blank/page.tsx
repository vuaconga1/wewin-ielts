import { PracticeGameHubPage, practiceGameMetadata } from "@/components/learn/practice-game-pages";

export const revalidate = 300;

export function generateMetadata() {
  return practiceGameMetadata("fill-blank");
}

export default function FillBlankCatalogPage() {
  return <PracticeGameHubPage game="fill-blank" />;
}
