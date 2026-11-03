/**
 * Server-only utility to convert English text/sentences to IPA using CMUdict (free, local).
 * Never import this file in client components to prevent bundling the ~3-4MB dictionary.
 */
import { dictionary } from "cmu-pronouncing-dictionary";
import { spellOutNumbers } from "@/lib/shadowing/scoring";

const ARPABET_IPA: Record<string, string> = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɝ", EY: "eɪ",
  IH: "ɪ", IY: "i", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "u",
  B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "ɡ", HH: "h", JH: "dʒ", K: "k", L: "l",
  M: "m", N: "n", NG: "ŋ", P: "p", R: "r", S: "s", SH: "ʃ", T: "t", TH: "θ", V: "v",
  W: "w", Y: "j", Z: "z", ZH: "ʒ",
};

/**
 * Converts Arpabet phoneme string (e.g. "HH AH0 L OW1") to IPA (e.g. "həˈloʊ").
 * Primary stress (1) -> ˈ, secondary stress (2) -> ˌ, unstressed AH0 -> ə, ER0 -> ɚ.
 * Uses a maximal onset heuristic: pulls stress marks in front of the onset consonant(s).
 */
export function arpabetToIpa(arpabet: string): string {
  const tokens = arpabet.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return "";

  const parsed: { type: "vowel" | "consonant"; ipa: string; mark: string }[] = [];
  for (const raw of tokens) {
    const stressMatch = raw.match(/^([A-Z]+)([012])$/);
    if (stressMatch) {
      const base = stressMatch[1];
      const stress = stressMatch[2];
      let ipaVowel = ARPABET_IPA[base] || base.toLowerCase();
      if (stress === "0") {
        if (base === "AH") ipaVowel = "ə";
        else if (base === "ER") ipaVowel = "ɚ";
      }
      const mark = stress === "1" ? "ˈ" : stress === "2" ? "ˌ" : "";
      parsed.push({ type: "vowel", ipa: ipaVowel, mark });
    } else {
      const ipaConsonant = ARPABET_IPA[raw] || raw.toLowerCase();
      parsed.push({ type: "consonant", ipa: ipaConsonant, mark: "" });
    }
  }

  let result = "";
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item.type === "vowel" && item.mark) {
      let onsetLen = 0;
      const hasPrevVowel = parsed.slice(0, i).some((p) => p.type === "vowel");
      if (!hasPrevVowel) {
        // At start of word: all preceding consonants form the onset
        for (let j = i - 1; j >= 0; j--) onsetLen += parsed[j].ipa.length;
      } else if (i > 0 && parsed[i - 1].type === "consonant") {
        // Between vowels: 1 preceding consonant attached to onset (simple heuristic)
        onsetLen = parsed[i - 1].ipa.length;
      }

      if (onsetLen > 0) {
        const at = result.length - onsetLen;
        result = result.slice(0, at) + item.mark + result.slice(at) + item.ipa;
      } else {
        result += item.mark + item.ipa;
      }
    } else {
      result += item.ipa;
    }
  }
  return result;
}

/**
 * Dictionary IPA per word (reference only: weak forms and linking are not modelled).
 * Numbers are spelled out; unknown words (e.g. proper nouns) kept as-is.
 * Returns wrapped in /.../
 */
export function sentenceIpa(sentence: string): string {
  const spelled = spellOutNumbers(sentence.trim());
  const words = spelled.split(/\s+/).filter(Boolean);
  if (!words.length) return "";

  const ipas = words.map((w) => {
    const clean = w.toLowerCase().replace(/[^a-z']/g, "");
    if (!clean) return w;
    const arpa = dictionary[clean];
    return arpa ? arpabetToIpa(arpa) : clean;
  });

  return `/${ipas.join(" ")}/`;
}

