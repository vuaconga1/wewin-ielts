"use client";

import type { VocabWord } from "@/lib/learn/vocab-grammar-types";
import { VocabAudioButton } from "@/components/learn/vocab-audio-button";
import { useTranslations } from "@/i18n/provider";

type Props = {
  entry: VocabWord;
};

/** Highlight [word] markers in example sentences. */
function ExampleText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("[") && part.endsWith("]")) {
          return (
            <strong key={i} className="font-semibold text-wewin-navy">
              {part.slice(1, -1)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function VocabWordCard({ entry }: Props) {
  const { t } = useTranslations("learn");
  const posLabel = entry.pos ? ` (${entry.pos})` : "";
  const speakText = entry.word;

  return (
    <article className="min-w-0 rounded-xl border border-zinc-200 bg-white px-4 py-4 sm:px-5 sm:py-5">
      <header className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="break-words text-lg font-bold text-zinc-900 sm:text-xl">
          {entry.word}
          {posLabel ? (
            <span className="font-semibold text-zinc-600">{posLabel}</span>
          ) : null}
        </h3>
        {entry.ipa ? (
          <span className="break-all font-mono text-sm text-zinc-600">{entry.ipa}</span>
        ) : null}
        <div className="flex flex-wrap items-center gap-0.5">
          <VocabAudioButton
            text={speakText}
            label={t("audioUk", "UK")}
            accent="uk"
            audioUrl={entry.audioUkUrl}
          />
          <VocabAudioButton
            text={speakText}
            label={t("audioUs", "US")}
            accent="us"
            audioUrl={entry.audioUsUrl}
          />
        </div>
      </header>

      <div className="mt-3 space-y-1 text-sm leading-relaxed text-zinc-800">
        <p className="font-semibold text-zinc-900">
          {t("definitionLabel", "Định nghĩa:")}
        </p>
        <p className="break-words">{entry.meaningVi}</p>
        {entry.definitionEn ? (
          <p className="break-words text-zinc-700">
            ={entry.definitionEn}
          </p>
        ) : null}
      </div>

      <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-zinc-800">
        <p className="font-semibold text-zinc-900">{t("exampleLabel", "Ví dụ:")}</p>
        <div className="flex min-w-0 items-start gap-2">
          <VocabAudioButton
            text={entry.exampleEn.replace(/[\[\]]/g, "")}
            label={t("playExample", "Nghe ví dụ")}
            accent="uk"
            iconOnly
            className="mt-0.5 shrink-0"
          />
          <div className="min-w-0 break-words">
            <p>
              <ExampleText text={entry.exampleEn} />
            </p>
            {entry.exampleVi ? (
              <p className="mt-0.5 text-zinc-600">
                ({t("exampleTranslation", "=Dịch:")} {entry.exampleVi})
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
