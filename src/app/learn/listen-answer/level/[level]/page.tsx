import {
  gameLevelStaticParams,
  redirectToGameLevel,
  type GameLevelParams,
} from "@/components/learn/practice-game-pages";

export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = gameLevelStaticParams;

export default async function ListenAnswerLevelPage({ params }: GameLevelParams) {
  return redirectToGameLevel("listen-answer", params);
}
