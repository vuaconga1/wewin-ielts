import { getLearnOwnerKey } from "@/lib/learn/owner";
import { getProgress } from "@/lib/learn/store";
import { getVocabGrammarCatalog } from "@/lib/learn/vocab-grammar-store";
import { trackProgressStats } from "@/lib/learn/progress-utils";
import { SiteShell } from "@/components/layout/site-shell";
import { VocabGrammarHub } from "@/components/learn/vocab-grammar-hub";
import { getTranslations } from "@/i18n/server";
import { topicCourse } from "@/lib/learn/vocab-grammar-types";
import { getViewerRole } from "@/lib/auth";
import { canViewIeltsGrammar } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: `${t("learn.vocabGrammarCard", "Từ vựng và ngữ pháp")} | ${t("meta.learn")}`,
  };
}

export default async function VocabGrammarHubPage() {
  const ownerKey = await getLearnOwnerKey();
  const [progress, fullCatalog, role] = await Promise.all([
    getProgress(ownerKey),
    getVocabGrammarCatalog(),
    getViewerRole(),
  ]);
  const catalog = canViewIeltsGrammar(role)
    ? fullCatalog
    : {
        ...fullCatalog,
        grammar: fullCatalog.grammar.filter((tpc) => topicCourse(tpc) === "basic"),
      };

  const tracks = (["grammar", "vocabulary"] as const).map((track) => {
    const stats = trackProgressStats(catalog[track], progress);
    return {
      track,
      total: stats.total,
      completed: stats.completed,
      percent: stats.percent,
    };
  });

  return (
    <SiteShell active="learn" wide>
      <VocabGrammarHub tracks={tracks} />
    </SiteShell>
  );
}
