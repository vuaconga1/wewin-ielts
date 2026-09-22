import { TestsModuleCatalog } from "@/components/tests/tests-module-catalog";
import { getTranslationsStatic } from "@/i18n/server";

export const revalidate = 300;

export async function generateMetadata() {
  const { t } = getTranslationsStatic();
  return {
    title: t("meta.testsGeneral", "IELTS General Training | Wewin IELTS"),
  };
}

/** Skill filter lives in client URL searchParams — keep page ISR-static. */
export default async function TestsGeneralPage() {
  return <TestsModuleCatalog examType="GENERAL" />;
}
