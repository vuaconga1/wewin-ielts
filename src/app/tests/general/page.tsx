import { TestsModuleCatalog } from "@/components/tests/tests-module-catalog";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ skill?: string }>;
};

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: t("meta.testsGeneral", "IELTS General Training | Wewin IELTS"),
  };
}

export default async function TestsGeneralPage({ searchParams }: Props) {
  const { skill } = await searchParams;
  return <TestsModuleCatalog examType="GENERAL" initialSkill={skill} />;
}
