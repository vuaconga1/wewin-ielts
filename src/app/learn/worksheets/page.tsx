import { redirect } from "next/navigation";

export default function WorksheetsIndexRedirect() {
  redirect("/learn/vocab-grammar/grammar?tab=exercises");
}
