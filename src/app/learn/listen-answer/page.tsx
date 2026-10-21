import { PracticeGameHubPage, practiceGameMetadata } from "@/components/learn/practice-game-pages";

export const revalidate = 300;

export function generateMetadata() {
  return practiceGameMetadata("listen-answer");
}

export default function ListenAnswerCatalogPage() {
  return <PracticeGameHubPage game="listen-answer" />;
}
