/**
 * Browser-side speech-to-text providers for shadowing. The rest of the feature only
 * depends on `SpeechRecognizerProvider`, so the test-only Web Speech backend can be
 * swapped for a production engine without touching the UI or the API contract.
 */

import type { SttProviderId } from "@/lib/shadowing/types";

export type SpeechErrorCode = "not-allowed" | "audio-capture" | "network" | "unsupported" | "other";

export type SpeechSession = {
  /** Stops listening and resolves with the full recognized text. */
  stop(): Promise<string>;
  abort(): void;
};

export type SpeechSessionOptions = {
  lang: string;
  onText?: (text: string) => void;
  onError?: (code: SpeechErrorCode) => void;
};

export interface SpeechRecognizerProvider {
  id: SttProviderId;
  isSupported(): boolean;
  start(options: SpeechSessionOptions): SpeechSession;
}

type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; 0: RecognitionAlternative; length: number };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const STOP_TIMEOUT_MS = 3_000;
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture", "network"]);

function mapError(error: string): SpeechErrorCode {
  if (error === "not-allowed" || error === "service-not-allowed") return "not-allowed";
  if (error === "audio-capture") return "audio-capture";
  if (error === "network") return "network";
  return "other";
}

/** TEST ONLY: Chrome/Edge/Safari built-in recognizer (audio is processed by the browser vendor). */
export const webSpeechProvider: SpeechRecognizerProvider = {
  id: "web-speech",
  isSupported: () => recognitionCtor() != null,
  start({ lang, onText, onError }) {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      onError?.("unsupported");
      return { stop: async () => "", abort: () => {} };
    }

    /** Finalized text from earlier recognition runs (Chrome ends runs after silences). */
    let committed = "";
    let runFinal = "";
    let runInterim = "";
    let stopping = false;
    let fatal = false;
    let rec: Recognition | null = null;
    let resolveStop: ((text: string) => void) | null = null;

    const fullText = () =>
      [committed, runFinal, runInterim].map((s) => s.trim()).filter(Boolean).join(" ");

    const finish = () => {
      const text = fullText();
      resolveStop?.(text);
      resolveStop = null;
    };

    const launch = () => {
      const r = new Ctor();
      r.lang = lang;
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.onresult = (e) => {
        let finals = "";
        let interim = "";
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finals += ` ${res[0].transcript}`;
          else interim += ` ${res[0].transcript}`;
        }
        runFinal = finals;
        runInterim = interim;
        onText?.(fullText());
      };
      r.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        if (FATAL_ERRORS.has(e.error)) fatal = true;
        onError?.(mapError(e.error));
      };
      r.onend = () => {
        committed = fullText();
        runFinal = "";
        runInterim = "";
        if (stopping || fatal) {
          finish();
          return;
        }
        launch();
      };
      rec = r;
      try {
        r.start();
      } catch {
        fatal = true;
        onError?.("other");
      }
    };

    launch();

    return {
      stop() {
        stopping = true;
        return new Promise<string>((resolve) => {
          resolveStop = resolve;
          window.setTimeout(finish, STOP_TIMEOUT_MS);
          try {
            rec?.stop();
          } catch {
            finish();
          }
        });
      },
      abort() {
        stopping = true;
        resolveStop = null;
        try {
          rec?.abort();
        } catch {
          /* ignore */
        }
      },
    };
  },
};

/** The recognizer used by the shadowing UI. Replace when the production engine is chosen. */
export const activeSpeechProvider: SpeechRecognizerProvider = webSpeechProvider;
