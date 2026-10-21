import {
  gameLevelStaticParams,
  redirectToGameLevel,
  type GameLevelParams,
} from "@/components/learn/practice-game-pages";

export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = gameLevelStaticParams;

export default async function FillBlankLevelPage({ params }: GameLevelParams) {
  return redirectToGameLevel("fill-blank", params);
}
