import { notFound, redirect } from "next/navigation";
import { canEditTests, getSessionUser } from "@/lib/auth";
import { getTestBySlug } from "@/lib/store/test-store";
import { TestEditor } from "@/components/tests/test-editor";
import { SiteShell } from "@/components/layout/site-shell";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export default async function EditTestPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canEditTests(user)) redirect("/forbidden");
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test) notFound();
  return <SiteShell active="tests"><TestEditor initialTest={test} /></SiteShell>;
}
