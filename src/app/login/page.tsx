import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.login") };
}

export default async function LoginPage() {
  const { t } = await getTranslations("auth");

  return (
    <SiteShell active="login">
      <div className="flex justify-center py-4 sm:py-10">
        <Suspense
          fallback={
            <p className="text-sm text-zinc-500">{t("loadingForm")}</p>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </SiteShell>
  );
}
