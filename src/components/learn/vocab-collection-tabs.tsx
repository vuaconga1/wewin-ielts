import Link from "next/link";
import { learnVocabularyHref } from "@/lib/learn/hrefs";
import { VOCAB_COLLECTIONS, type VocabCollection } from "@/lib/learn/vocab-grammar-types";

type Props = {
  active: VocabCollection;
  labels: Record<VocabCollection, string>;
};

export function VocabCollectionTabs({ active, labels }: Props) {
  return (
    <nav
      role="tablist"
      className="flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden border-b border-zinc-200"
    >
      {VOCAB_COLLECTIONS.map((collection) => {
        const isActive = collection === active;
        return (
          <Link
            key={collection}
            role="tab"
            aria-selected={isActive}
            href={learnVocabularyHref(collection)}
            className={`-mb-px inline-flex shrink-0 items-center border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "border-wewin-navy text-wewin-navy"
                : "border-transparent text-zinc-500 hover:text-wewin-navy"
            }`}
          >
            {labels[collection]}
          </Link>
        );
      })}
    </nav>
  );
}
