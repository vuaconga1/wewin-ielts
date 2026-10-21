import { PracticeGameHubPage, practiceGameMetadata } from "@/components/learn/practice-game-pages";

export const revalidate = 300;

export function generateMetadata() {
  return practiceGameMetadata("shadowing");
}

export default function ShadowingCatalogPage() {
  return <PracticeGameHubPage game="shadowing" />;
}
