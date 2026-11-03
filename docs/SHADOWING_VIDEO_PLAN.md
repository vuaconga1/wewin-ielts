# WEWIN — Shadowing Video: Plan triển khai chi tiết (cho AI coding agent)

> Tài liệu này dành cho agent tiếp quản (ví dụ Gemini). Đọc **toàn bộ** mục 0–3 trước khi code.
> Mỗi giai đoạn có: mục tiêu, file cần sửa/tạo, kiểu dữ liệu chính xác, code mẫu, tiêu chí nghiệm thu.
> Làm **tuần tự từng giai đoạn**, chạy kiểm tra (mục 9) sau mỗi giai đoạn, không gộp nhiều giai đoạn vào một lần sửa.

---

## 0. Quy tắc bắt buộc của dự án (vi phạm = làm lại)

Các rule nằm ở `.cursor/rules/*.mdc`. Tóm tắt những điều liên quan:

1. **Không dùng dịch vụ trả phí khi chưa được người dùng đồng ý** (`paid-services-consent.mdc`).
   - KHÔNG gọi OpenAI / Google Translate / DeepL / Gemini API / ElevenLabs… trong code app hay script, kể cả "test thử 1 lần".
   - Mọi thứ trong plan này đều **miễn phí, chạy local**: yt-dlp, FFmpeg, stable-ts/Whisper local, CMUdict.
   - Nếu thấy cần dịch vụ trả phí → DỪNG, hỏi người dùng (dịch vụ gì, bao nhiêu lượt, ước tính chi phí, có phương án miễn phí nào).
   - Không in / hardcode secret trong `.env`.
2. **i18n** (`ui-i18n-responsive.mdc`):
   - Locale `vi` (mặc định) và `en`. Mọi chữ giao diện (nút, nhãn, lỗi, trạng thái rỗng) phải có key trong **cả** `src/i18n/messages/vi.json` và `en.json`, cùng namespace.
   - Client: `const { t } = useTranslations("shadowing")` từ `@/i18n/provider`; gọi `t("key", "Chữ tiếng Việt mặc định")`.
   - Server: `getTranslations("namespace")` từ `@/i18n/server`.
   - Không hiển thị key thô (`shadowing.xxx`) hay enum SCREAMING_SNAKE (`PUBLISHED`, `DRAFT`) cho học viên.
   - **Không dịch nội dung bài học** (transcript, câu tiếng Anh). Bản dịch tiếng Việt của câu là *nội dung bài*, lưu trong DB, hiển thị nguyên văn ở cả 2 locale.
   - Namespace dùng cho feature này: `shadowing` (học viên), `shadowingAdmin` (admin). Hai namespace này bắt đầu ở khoảng dòng 1974 và 2088 trong mỗi file json.
3. **Responsive**: mobile → desktop, dùng `min-w-0`, `break-words`, không tràn ngang, nút bấm cao ≥ 44px (`min-h-11`).
4. **Theme**: màu chủ đạo `wewin-navy` (class `bg-wewin-navy`, `text-wewin-navy`, `hover:bg-wewin-navy-hover`). Không tự chế bảng màu tím/kem.
5. **Hiệu năng** (`runtime-performance.mdc`):
   - Trang học viên `/learn/shadowing/[slug]` là ISR (`export const revalidate = 300`). Không thêm `cookies()`/auth/Prisma vào layout hay shell.
   - Dữ liệu bài lấy qua `unstable_cache` trong `src/lib/shadowing/store.ts`. **Mỗi khi đổi shape dữ liệu trả về, tăng cache key** (`"shadowing-exercise-v4"` → `"-v5"`).
   - Prisma: chỉ `select` trường cần dùng.
   - Media phục vụ từ R2/CDN qua `mediaUrl()` (`src/lib/media/url.ts`).
6. **Phong cách code**: viết giống code xung quanh. Comment chỉ để nêu ràng buộc mà code không tự thể hiện; không comment kiểu "dòng sau làm gì" hay "đã sửa theo yêu cầu".
7. **Database**: Neon Postgres (dùng chung với production). Migration chỉ được **thêm** (cột nullable, bảng mới). Không xoá/đổi tên cột. Tạo migration bằng file SQL trong `prisma/migrations/<timestamp>_<name>/migration.sql`, rồi `npx prisma generate`. **Hỏi người dùng trước khi chạy `npx prisma migrate deploy`.**
8. **Repo dev fallback**: `src/lib/shadowing/repo.ts` có 2 backend (Prisma và file JSON cho dev). Thêm trường nào thì phải thêm ở **cả** `exerciseSelect`, type `ExerciseRecord`, và `toExerciseRecord()` của file repo.

---

## 1. Bối cảnh & kiến trúc hiện tại

### 1.1. Mục tiêu tổng thể
Nâng cấp Shadowing thành dạng **video + chữ chạy đồng bộ** (giống app luyện nói):
- Video mẫu (tự lưu trên R2, không nhúng YouTube) với phụ đề đè lên video.
- Danh sách câu bên cạnh: highlight câu đang phát, tự cuộn, bấm câu để tua tới.
- Mỗi câu có 3 tầng: tiếng Anh, IPA (xám), bản dịch tiếng Việt (ẩn/hiện được).
- Luyện và chấm **từng câu**.
- Thanh điều khiển nổi ở đáy: [Nghe lại] [Câu trước] [Phát/Dừng] [Câu sau] [Ghi âm], phím tắt Space / ← / → / R.
- Admin tạo bài từ link YouTube (video đã được cấp bản quyền) bằng script local.

### 1.2. Quyết định đã chốt với người dùng (không thay đổi)
- Video đến từ kênh YouTube khác nhưng **đã được cấp bản quyền** → được tải về.
- **Tự lưu video trên Cloudflare R2** (bucket `wewin-ielts-media`, đang dùng ~2 GB / 10 GB free). Không dùng YouTube iframe.
- Video nén 720p H.264 CRF 26 (~9 MB/phút).
- IPA và bản dịch: **không dùng API trả phí**. IPA sinh bằng CMUdict (miễn phí); bản dịch do admin nhập/dán, hoặc nhập hàng loạt từ file JSON.

### 1.3. Các file chính (đọc trước khi sửa)

| File | Vai trò |
|---|---|
| `prisma/schema.prisma` → `model ShadowingExercise` | Bảng bài. Trường: `slug, title, level, instructions, audioUrl, videoUrl?, transcript, cues Json?, maxRecordSeconds, status, order` |
| `src/lib/shadowing/repo.ts` | Lớp lưu trữ (Prisma + file JSON dev). `ExerciseRecord`, `ExerciseData`, `ShadowingRepo` |
| `src/lib/shadowing/store.ts` | Logic nghiệp vụ: `getPublicShadowing`, `submitShadowingAttempt`, admin CRUD, `normalizeInput` |
| `src/lib/shadowing/types.ts` | `PublicShadowingExercise` (gửi xuống browser), `ShadowingGrade`, … |
| `src/lib/shadowing/transcript.ts` | `transcriptLines(transcript)` → `{ speaker, text }[]`: tách transcript thành câu. **Nguồn sự thật cho thứ tự câu** |
| `src/lib/shadowing/cues.ts` | Mốc thời gian câu: `StoredCueSet` (lưu DB), `validCueTimings()`, `estimateCues()`, `cueIndexAt()` |
| `src/lib/shadowing/scoring.ts` | `gradeShadowing(transcript, recognized)` → `ShadowingGrade` (thuần TS, chạy được cả client) |
| `src/lib/shadowing/stt/client.ts` | Nhận diện giọng nói trên browser (Web Speech API), `activeSpeechProvider` |
| `src/components/shadowing/shadowing-practice.tsx` | Màn luyện tập chính (ghi âm, nộp bài, ghép các component) |
| `src/components/shadowing/shadowing-audio-player.tsx` | Trình phát audio **hoặc video** (`videoSrc`), phụ đề đè (`caption`), tốc độ, âm lượng |
| `src/components/shadowing/shadowing-transcript.tsx` | Danh sách câu + thanh điều khiển câu |
| `src/components/shadowing/use-sentence-playback.ts` | Hook đồng bộ câu ↔ media: `index, playing, goTo, replay, togglePlay`, phím tắt |
| `src/components/shadowing/shadowing-result.tsx` | Màn kết quả; dùng `AlignedTranscript` từ `src/components/dictation/dictation-result.tsx` để tô màu từ đúng/sai |
| `src/components/admin/shadowing-admin-form.tsx` | Form admin tạo/sửa bài |
| `src/app/api/admin/shadowing/route.ts`, `[id]/route.ts` | API admin POST / PUT / DELETE (body JSON = `ShadowingInput`) |
| `src/app/api/shadowing/[slug]/submit/route.ts` | API nộp bài (multipart: `recognizedText`, `alternatives`, `sttProvider`, `durationMs`, `recording`) |
| `src/app/learn/shadowing/[slug]/page.tsx` | Trang học viên (ISR 300s) |
| `scripts/shadowing-cues.ts` + `scripts/align-shadowing.py` | Căn mốc thời gian câu bằng stable-ts (local) |
| `scripts/shadowing-import-video.ts` + `scripts/transcribe-shadowing.py` | Nhập bài từ link YouTube (Giai đoạn 1) |

### 1.4. Luồng dữ liệu mốc thời gian (quan trọng)
1. `transcript` (text) → `transcriptLines()` → danh sách câu theo thứ tự.
2. `scripts/shadowing-cues.ts` gửi câu + audio sang `align-shadowing.py` → nhận `{ text, start, end }[]` → lưu vào `cues` dạng:
   ```ts
   type StoredCueSet = { version: 1; aligner: string; audioUrl: string; lines: { text: string; start: number; end: number }[] };
   ```
3. Khi đọc, `validCueTimings(stored, transcript, audioUrl)` trả `CueTiming[]` **chỉ khi** `audioUrl` khớp và từng `lines[i].text === transcriptLines(transcript)[i].text`. Nếu admin sửa transcript hoặc đổi audio → cues coi như hết hạn → browser tự ước lượng mốc (`estimateCues`) cho tới khi chạy lại script căn mốc.
4. Với bài video: `audioUrl` = âm thanh tách từ chính video đó (cùng timeline) → cues dùng chung cho video.

---

## 2. Giai đoạn 1 — ĐÃ XONG (chỉ cần nghiệm thu)

Đã làm:
- Migration `20261031090000_add_shadowing_video` (cột `videoUrl TEXT NULL`) — **đã áp lên Neon**.
- `repo.ts`, `store.ts`, `types.ts`: thêm `videoUrl` (store trả `mediaUrl(videoUrl)`; cache key `shadowing-exercise-v4`).
- `shadowing-audio-player.tsx`: prop `videoSrc` → render `<video playsInline>` thay `<audio>`; prop `caption` → phụ đề đè (nút CC bật/tắt); tốc độ `[0.5, 0.75, 1, 1.25]`; ref kiểu `HTMLMediaElement`.
- `use-sentence-playback.ts`, `shadowing-transcript.tsx`: ref kiểu `HTMLMediaElement`; transcript có prop `onSentenceChange(text)` để đẩy câu hiện tại lên phụ đề.
- `shadowing-practice.tsx`: truyền `videoSrc`, `caption`; khi bắt đầu ghi âm đã có `sampleRef.current?.pause()` (video tự dừng → micro không thu tiếng loa).
- Form admin: ô `videoUrl` + xem trước video.
- i18n: `shadowing.sampleVideo/showSubtitle/hideSubtitle`, `shadowingAdmin.fieldVideo/videoUrlPlaceholder/videoHint`.
- Script `scripts/shadowing-import-video.ts` (npm: `shadowing:import-video`), `scripts/transcribe-shadowing.py`. `yt-dlp` đã cài trong `.venv-align`.

### 2.1. Việc cần làm để nghiệm thu Giai đoạn 1
1. Xin người dùng 1 link YouTube. Chạy thử:
   ```powershell
   npx tsx scripts/shadowing-import-video.ts --url <link> --dry-run
   ```
   Kiểm tra: tải được video, file `video.mp4` khoảng 9 MB/phút, transcript tách câu hợp lý (mỗi dòng 1 câu, không có `[Music]`, không lặp câu).
2. Nếu ổn, chạy thật (không `--dry-run`, kèm `--level B1`). Bài tạo ở trạng thái DRAFT. Mở `/admin/shadowing`, đặt PUBLISHED, mở `/learn/shadowing/<slug>`.
3. Kiểm tra trên trình duyệt (desktop + giả lập mobile 375px):
   - Video phát, phụ đề đè đổi theo câu, nút CC bật/tắt được.
   - Bấm câu trong danh sách → video tua đúng câu. Nút "Nghe lại" phát đúng 1 câu rồi dừng.
   - Space / ← / → / R hoạt động. Bấm ghi âm → video dừng.
   - Không tràn ngang trên mobile.
4. Lỗi hay gặp của script:
   - yt-dlp báo thiếu JS runtime / định dạng → `.venv-align\Scripts\python -m pip install -U yt-dlp`.
   - Phụ đề tự sinh (auto-captions) bị bỏ qua có chủ ý (không có dấu câu) → script tự dùng Whisper. Có thể ép bằng `--whisper` hoặc đưa transcript sẵn `--transcript file.txt`.

---

## 3. Bản đồ các giai đoạn còn lại

| Giai đoạn | Nội dung | Cần migration? |
|---|---|---|
| 2 | IPA + bản dịch theo câu (dữ liệu, admin, UI thẻ câu 3 tầng) | Có (`annotations Json?`) |
| 3 | Luyện & chấm **từng câu** (client-side), chế độ "shadow tự động" | Không |
| 4 | Thanh điều khiển nổi ở đáy + karaoke từng từ (cues v2 có mốc từng từ) | Không |
| 5 | Dọn dẹp, kiểm tra tổng, tài liệu hướng dẫn admin | Không |

---

## 4. Giai đoạn 2 — IPA & bản dịch theo câu

### 4.1. Nguyên tắc thiết kế
- **Tách khỏi `cues`**: cues bị coi là hết hạn mỗi khi transcript/audio đổi; bản dịch admin đã duyệt **không được mất** theo. Vì vậy lưu ở cột riêng `annotations`.
- Ghép annotation với câu **theo nội dung câu** (đã chuẩn hoá), không theo vị trí. Admin sửa 1 câu thì chỉ câu đó mất annotation, các câu khác giữ nguyên.

### 4.2. Database
Tạo `prisma/migrations/20261101090000_add_shadowing_annotations/migration.sql`:
```sql
-- AlterTable
ALTER TABLE "ShadowingExercise" ADD COLUMN "annotations" JSONB;
```
`schema.prisma`, trong `model ShadowingExercise` ngay sau `cues`:
```prisma
  /// Per-sentence IPA + Vietnamese translation, matched to transcript sentences by text (see lib/shadowing/annotations.ts)
  annotations      Json?
```
Chạy `npx prisma generate`. Hỏi người dùng rồi mới `npx prisma migrate deploy`.

### 4.3. Kiểu dữ liệu — tạo `src/lib/shadowing/annotations.ts`
```ts
import { transcriptLines } from "@/lib/shadowing/transcript";

/** Stored in `ShadowingExercise.annotations`. */
export type StoredAnnotationSet = {
  version: 1;
  lines: { text: string; ipa?: string; translation?: string }[];
};

export type LineAnnotation = { ipa: string | null; translation: string | null };

const MAX_FIELD_CHARS = 1_000;

/** Case/punctuation/whitespace-insensitive key so small edits elsewhere keep a sentence's annotation. */
export function sentenceKey(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, " ").trim();
}

/** One entry per `transcriptLines(transcript)` sentence (null where none), or null when nothing matches. */
export function annotationsFor(stored: unknown, transcript: string): LineAnnotation[] | null {
  if (!stored || typeof stored !== "object") return null;
  const set = stored as Partial<StoredAnnotationSet>;
  if (set.version !== 1 || !Array.isArray(set.lines)) return null;
  const byKey = new Map<string, LineAnnotation>();
  for (const l of set.lines) {
    if (!l || typeof l.text !== "string") continue;
    const ipa = typeof l.ipa === "string" && l.ipa.trim() ? l.ipa.trim() : null;
    const translation = typeof l.translation === "string" && l.translation.trim() ? l.translation.trim() : null;
    if (ipa || translation) byKey.set(sentenceKey(l.text), { ipa, translation });
  }
  if (byKey.size === 0) return null;
  const out = transcriptLines(transcript).map((l) => byKey.get(sentenceKey(l.text)) ?? { ipa: null, translation: null });
  return out.some((a) => a.ipa || a.translation) ? out : null;
}

/** Validates admin input into a storable set (drops empty rows, trims, caps length). */
export function normalizeAnnotations(raw: unknown): StoredAnnotationSet | null {
  if (!Array.isArray(raw)) return null;
  const lines: StoredAnnotationSet["lines"] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { text, ipa, translation } = r as Record<string, unknown>;
    if (typeof text !== "string" || !text.trim()) continue;
    const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, MAX_FIELD_CHARS) : undefined);
    const row = { text: text.trim(), ipa: clean(ipa), translation: clean(translation) };
    if (row.ipa || row.translation) lines.push(row);
  }
  return lines.length ? { version: 1, lines } : null;
}
```

### 4.4. Repo / store / types
- `repo.ts`:
  - `ExerciseRecord` thêm `annotations: unknown;` (giống `cues`, raw).
  - `exerciseSelect` thêm `annotations: true`.
  - `ExerciseData = Omit<ExerciseRecord, "id" | "slug" | "cues">` → giữ nguyên, nghĩa là `annotations` nằm trong `ExerciseData`. Prisma cần `Prisma.DbNull` khi null: trong `createExercise`/`updateExercise` của prismaRepo map `annotations: data.annotations ?? Prisma.DbNull` (xem cách `setCues` làm).
  - File repo: `toExerciseRecord` thêm `annotations: e.annotations ?? null`; `createExercise` giữ `...data`.
- `types.ts` → `PublicShadowingExercise` thêm:
  ```ts
  /** Per-sentence IPA / translation aligned with `transcriptLines(transcript)`; null → none. */
  annotations: LineAnnotation[] | null;
  ```
- `store.ts`:
  - `getPublishedShadowingRow`: thêm `annotations: annotationsFor(row.annotations, row.transcript)`; **tăng cache key lên `"shadowing-exercise-v5"`**.
  - `ShadowingAdminDetail` thêm `annotations: unknown`.
  - `ShadowingInput` thêm `annotations?: unknown` (mảng `{text, ipa, translation}` từ form).
  - `normalizeInput`: `annotations: normalizeAnnotations(input.annotations)`.
- `scripts/import-wewin-listening-games.ts` và `scripts/shadowing-import-video.ts` đang dựng `ExerciseData` đầy đủ → thêm `annotations: existing?.annotations ?? null` (giữ annotation cũ khi cập nhật).

### 4.5. Sinh IPA tự động (miễn phí, CMUdict)
- Cài: `npm i cmu-pronouncing-dictionary` (dữ liệu CMUdict dạng `{ word: "HH AH0 L OW1" }`). **Chỉ import ở server** (file ~3–4 MB, không được lọt vào bundle client). Kiểm tra license của package trước khi cài; nếu package không phù hợp thì tải file `cmudict.dict` vào `src/lib/shadowing/data/` và tự parse.
- Tạo `src/lib/shadowing/ipa.ts` (server-only, đầu file `import "server-only";` nếu dự án có package này; nếu không thì chỉ import từ API route / script):
  ```ts
  import { dictionary } from "cmu-pronouncing-dictionary";

  const ARPABET_IPA: Record<string, string> = {
    AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɝ", EY: "eɪ",
    IH: "ɪ", IY: "i", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "u",
    B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "ɡ", HH: "h", JH: "dʒ", K: "k", L: "l",
    M: "m", N: "n", NG: "ŋ", P: "p", R: "r", S: "s", SH: "ʃ", T: "t", TH: "θ", V: "v",
    W: "w", Y: "j", Z: "z", ZH: "ʒ",
  };

  /** "HH AH0 L OW1" → "həˈloʊ": stress 1 → ˈ before the syllable's vowel, unstressed AH → ə, ER0 → ɚ. */
  function arpabetToIpa(arpabet: string): string { /* … */ }

  /** Dictionary IPA per word (reference only: weak forms and linking are not modelled). Unknown words kept as-is. */
  export function sentenceIpa(sentence: string): string { /* tokenize words, lowercase, strip punctuation, look up, join with " ", wrap in /…/ */ }
  ```
  Chi tiết `arpabetToIpa`:
  - Tách theo dấu cách. Với nguyên âm có số stress cuối (`AH0`, `OW1`, `EY2`): `0` → không dấu (AH0 → `ə`, ER0 → `ɚ`, IH0 giữ `ɪ`), `1` → chèn `ˈ`, `2` → chèn `ˌ`.
  - Đặt dấu nhấn **trước phụ âm đầu của âm tiết** là chuẩn, nhưng để đơn giản được phép đặt ngay trước nguyên âm (ghi rõ trong comment rằng là đơn giản hoá). Nếu muốn chuẩn hơn: dời dấu nhấn về trước cụm phụ âm đứng ngay trước nguyên âm, tối đa 1 phụ âm nếu cụm > 1 (heuristic onset tối đa).
  - Từ có nhiều cách đọc (`word(2)`) → lấy cách đầu.
  - Từ không có trong từ điển (tên riêng) → giữ nguyên chữ, không bỏ.
  - Số → dùng `spellOutNumbers` từ `scoring.ts` trước khi tra.
- API admin: `src/app/api/admin/shadowing/ipa/route.ts`
  - `POST { sentences: string[] }` → `{ ipa: string[] }`. Dùng `requireAdminResponse(getSessionUser)` như các route admin khác; giới hạn ≤ 500 câu, mỗi câu ≤ 500 ký tự; `export const runtime = "nodejs"`.

### 4.6. Bản dịch tiếng Việt (KHÔNG dùng API trả phí)
Hai cách, đều miễn phí:
1. **Admin nhập/dán** trong bảng duyệt (mục 4.7). Có nút "Dán hàng loạt": textarea, mỗi dòng 1 bản dịch, ghép theo thứ tự câu.
2. **Script nhập/xuất file**: `scripts/shadowing-annotations.ts`
   ```powershell
   npx tsx scripts/shadowing-annotations.ts --slug <slug> --export tmp/<slug>.json   # xuất [{ text, ipa, translation }]
   npx tsx scripts/shadowing-annotations.ts --slug <slug> --import tmp/<slug>.json   # nhập (normalizeAnnotations rồi updateExercise)
   npx tsx scripts/shadowing-annotations.ts --slug <slug> --fill-ipa                 # điền IPA còn trống bằng sentenceIpa
   ```
   File JSON xuất ra có thể được người dùng (hoặc agent trong chat) dịch rồi nhập lại. Script **không** gọi API dịch nào.
   Sau khi nhập, nhắc: trang live cập nhật trong 5 phút (ISR).

### 4.7. Admin UI — bảng duyệt câu
Tạo `src/components/admin/shadowing-annotations-editor.tsx` (client), nhúng vào `shadowing-admin-form.tsx` dưới ô transcript.
- Props: `transcript: string`, `value: AnnotationRow[]`, `onChange(rows)`. `type AnnotationRow = { text: string; ipa: string; translation: string }`.
- Mỗi lần `transcript` thay đổi: tính `transcriptLines(transcript)`, ghép với `value` theo `sentenceKey` (giữ dữ liệu câu không đổi).
- Hiển thị dạng danh sách thẻ (mobile) / bảng (≥ `md`): số thứ tự, câu tiếng Anh (chỉ đọc), input IPA, textarea bản dịch (2 dòng).
- Nút:
  - "Điền IPA tự động" → gọi `/api/admin/shadowing/ipa` cho các câu **chưa có IPA**, không ghi đè IPA admin đã sửa.
  - "Dán bản dịch hàng loạt" → mở textarea, mỗi dòng ứng với 1 câu theo thứ tự; báo lỗi nếu số dòng ≠ số câu (vẫn cho áp phần khớp).
- Đếm "Đã có bản dịch: x/y câu".
- Form gửi `annotations: rows` trong body POST/PUT.
- Trang `src/app/admin/shadowing/[id]/page.tsx`: chuyển `exercise.annotations` (raw) thành `AnnotationRow[]` ở server: `(annotationsFor(exercise.annotations, exercise.transcript) ?? []).map((a, i) => ({ text: lines[i].text, ipa: a.ipa ?? "", translation: a.translation ?? "" }))`.
- i18n `shadowingAdmin`: `annotationsTitle`, `annotationsHint`, `fillIpa`, `fillingIpa`, `pasteTranslations`, `pasteTranslationsHint`, `applyPaste`, `translationCount` (`"Đã có bản dịch: {n}/{total} câu"`), `colSentence`, `colIpa`, `colTranslation`, `pasteCountMismatch`, `errors.ipaFailed`. Thêm cả `vi.json` và `en.json`.

### 4.8. UI học viên — thẻ câu 3 tầng
Sửa `src/components/shadowing/shadowing-transcript.tsx`:
- Prop mới `annotations?: LineAnnotation[] | null` (truyền từ `shadowing-practice.tsx`: `exercise.annotations`).
- Trong mỗi thẻ câu, dưới câu tiếng Anh:
  ```tsx
  {showIpa && ann?.ipa ? <p className="mt-1 break-words font-mono text-[13px] text-slate-500">{ann.ipa}</p> : null}
  {ann?.translation ? (
    showTranslation || revealed.has(idx)
      ? <p className="mt-1 break-words text-sm italic text-slate-600">{ann.translation}</p>
      : <button type="button" onClick={(e) => { e.stopPropagation(); reveal(idx); }} className="mt-1 text-xs font-semibold text-wewin-navy hover:underline">{t("revealTranslation", "Xem nghĩa")}</button>
  ) : null}
  ```
- Header transcript thêm 2 nút toggle nhỏ (pill): "IPA" và "Dịch". Lưu trạng thái vào `localStorage` key `wewin_shadowing_show_ipa` / `wewin_shadowing_show_translation` (đọc trong `useEffect` để tránh lệch hydration). Mặc định: IPA bật, bản dịch **tắt** (học viên tự dịch trước).
- Chỉ hiện 2 toggle khi `annotations` có ít nhất 1 câu có dữ liệu tương ứng.
- Câu đang phát: giữ style highlight hiện có (`border-indigo-400 bg-indigo-50/70 ring-1`).
- Sửa luôn 3 chữ đang hardcode trong file này (vi phạm i18n): `"Transcript"`, `"{n} câu"`, `"{n} từ"`, `title="Thu nhỏ chữ"`, `title="Phóng to chữ"` → dùng `t()` với key mới (`transcriptTitle`, `sentencesCount`, `wordsCountShort`, `fontSmaller`, `fontLarger`).
- i18n `shadowing`: `showIpa`, `hideIpa`, `showTranslation`, `hideTranslation`, `revealTranslation`, và các key ở trên.

### 4.9. Nghiệm thu Giai đoạn 2
- Admin: điền IPA tự động → IPA hiện cho các câu, sửa tay 1 câu rồi bấm lại không bị ghi đè. Dán 10 dòng bản dịch cho bài 10 câu → khớp đúng thứ tự. Lưu → mở lại vẫn còn.
- Sửa chữ 1 câu trong transcript, lưu → chỉ câu đó mất bản dịch.
- Học viên: thấy IPA xám, bản dịch ẩn mặc định, bấm "Xem nghĩa" từng câu, toggle toàn bộ, tải lại trang vẫn nhớ toggle.
- Bài cũ không có annotations: giao diện y như trước, không có toggle.
- `npx tsc --noEmit` sạch; không có chữ hardcode mới.

---

## 5. Giai đoạn 3 — Luyện & chấm từng câu

### 5.1. Lý do
Video dài 1–5 phút; ghi âm cả bài (tối đa 300 s) quá dài và khó. Shadowing thực tế là: nghe 1 câu → nhại lại câu đó → xem kết quả → câu tiếp.

### 5.2. Thiết kế
- Thêm **chế độ luyện** trong `shadowing-practice.tsx`: `mode: "sentence" | "full"`.
  - Mặc định `"sentence"` nếu bài có video **hoặc** ≥ 4 câu; `"full"` giữ nguyên luồng hiện tại (ghi cả bài + nộp server + lịch sử).
  - Toggle chế độ dạng segmented control ở đầu khu ghi âm. i18n: `modeSentence` ("Luyện từng câu"), `modeFull` ("Đọc cả bài").
- Chế độ từng câu **chấm hoàn toàn ở client**, không gọi API, không lưu DB (tránh ghi DB mỗi câu):
  - Dùng `activeSpeechProvider.start({ lang: "en-US", onText })` (giống `startRecording` hiện tại, nhưng **không cần MediaRecorder** trừ khi muốn cho nghe lại; nên có MediaRecorder để học viên nghe lại giọng mình cho câu đó, giữ blob trong bộ nhớ, `URL.revokeObjectURL` khi bỏ).
  - Tự dừng sau `max(4, (cue.end - cue.start) * 2 + 2)` giây, hoặc khi người dùng bấm dừng.
  - Chấm: `gradeShadowing(lineText, pickClosestAlternatives(lineText, segments) ?? text)` — cả hai hàm trong `src/lib/shadowing/scoring.ts` là thuần TS, import được ở client.
  - Lưu kết quả theo câu trong state: `Map<number, { score: number; wordResults: ShadowingWordResult[]; recordingUrl?: string }>`; đồng thời lưu điểm (không lưu audio) vào `localStorage` key `wewin_shadowing_progress_<slug>` để lần sau thấy câu nào đã luyện.
- Hiển thị trong thẻ câu (`shadowing-transcript.tsx`), nhận prop `sentenceResults?: Map<number, SentenceResult>`:
  - Badge điểm ở góc phải (xanh ≥ 80, vàng 60–79, đỏ < 60) thay icon check.
  - Khi thẻ đang chọn và có kết quả: hiện câu đã tô màu bằng `AlignedTranscript` (export từ `src/components/dictation/dictation-result.tsx`, xem cách `shadowing-result.tsx` dùng) + nút nghe lại giọng mình (`UserAudioPlayer`).
- Nút **Ghi âm** ở thanh điều khiển: trong chế độ từng câu → ghi âm cho **câu đang chọn**. Trước khi ghi: `media.pause()`.
- **Chế độ "Shadow tự động"** (toggle, mặc định tắt, i18n `autoShadow`): bấm phát → phát câu hiện tại (`replay()`), khi câu kết thúc (`stopAtRef` trong hook đạt `end`) → tự bắt đầu ghi âm → dừng → chấm → chuyển câu tiếp. Cần bổ sung vào `use-sentence-playback.ts` callback `onSentenceEnd?: (index: number) => void`, gọi tại chỗ đang `el.pause()` khi `currentTime >= stopAt`.
- Thanh tổng kết trên đầu danh sách câu: "Đã luyện x/y câu · Điểm TB z". Nút "Luyện lại câu dưới 60 điểm" nhảy tới câu yếu đầu tiên.

### 5.3. Ràng buộc
- Trong lúc ghi âm: khoá điều hướng câu (prop `disabled` đã có).
- Web Speech không có trên Firefox → giữ cảnh báo `errors.unsupported` hiện có.
- Không thay đổi API `/api/shadowing/[slug]/submit` và bảng `ShadowingAttempt`.

### 5.4. Nghiệm thu
- Bài video 20 câu: ghi âm câu 3 → thấy điểm + từ sai tô đỏ, nghe lại giọng mình. Chuyển câu 4, quay lại câu 3 vẫn còn kết quả. Tải lại trang: badge điểm còn (từ localStorage), audio không còn (đúng thiết kế).
- Shadow tự động chạy hết 3 câu liên tiếp không cần bấm.
- Chế độ "Đọc cả bài" hoạt động y như trước (nộp, lịch sử, kết quả).

---

## 6. Giai đoạn 4 — Thanh điều khiển nổi + karaoke từng từ

### 6.1. Thanh điều khiển nổi ở đáy
- Tách phần điều khiển cuối `shadowing-transcript.tsx` thành component `src/components/shadowing/shadowing-control-bar.tsx`.
- Desktop (`xl`): giữ trong khung transcript như hiện tại.
- Mobile/tablet (< `xl`): `fixed inset-x-0 bottom-0 z-30`, nền trắng mờ `bg-white/95 backdrop-blur`, viền trên, `pb-[env(safe-area-inset-bottom)]`. Thêm `pb-24` cho container trang để nội dung không bị che. Kiểm tra không đè lên widget chat (`src/components/chat/wewin-chat-widget.tsx`) — nếu đè thì đẩy widget lên hoặc ẩn widget trên trang luyện.
- Nút: [↺ Nghe lại] [‹ Câu trước] [▶/⏸] [Câu sau ›] [🎙 Ghi âm] + chỉ số "Câu x/y". Icon từ `lucide-react` (đã dùng: `RotateCcw, ChevronLeft, Play, Pause, ChevronRight, Mic`). Nút cao ≥ 44px.
- Phím tắt đã có trong `use-sentence-playback.ts` (Space, ←, →, R). Thêm phím `M` = ghi âm/dừng (chỉ khi không gõ trong input; dùng `isTypingTarget` có sẵn).

### 6.2. Karaoke từng từ (cues version 2)
- `scripts/align-shadowing.py` → trong `timings_for`, ngoài `start/end` mỗi câu, thu thêm `words: [{ "w": str, "s": float, "e": float }]` (từ `result.all_words()`, `w.word.strip()`, làm tròn 3 chữ số). Từ thuộc câu nào xác định như cách hiện tại (theo `mid` và `ends[li]`).
- `src/lib/shadowing/cues.ts`:
  ```ts
  export type CueWord = { w: string; s: number; e: number };
  export type CueTiming = { start: number; end: number; words?: CueWord[] };
  export type StoredCueSet = { version: 1 | 2; aligner: string; audioUrl: string; lines: { text: string; start: number; end: number; words?: CueWord[] }[] };
  ```
  `validCueTimings` chấp nhận `version` 1 hoặc 2; với v2 copy `words` đã lọc (số hữu hạn, `s <= e`). `scripts/shadowing-cues.ts` ghi `version: 2`.
- `use-sentence-playback.ts`: trả thêm `currentTime` **chỉ khi cần karaoke**, cập nhật bằng `requestAnimationFrame` khi đang phát (timeupdate chỉ ~4 lần/giây, không đủ mượt). Để tránh render lại cả danh sách 60 lần/giây, đưa phần karaoke vào component con `KaraokeLine` chỉ render cho **câu đang phát**, tự subscribe rAF đọc `media.currentTime`.
- `KaraokeLine`: ghép `words` với chữ hiển thị theo thứ tự (so khớp không phân biệt hoa thường/dấu câu; nếu số từ lệch thì fallback hiển thị câu thường). Từ đã đọc: `text-wewin-navy font-semibold`; từ đang đọc: `rounded bg-wewin-navy text-white px-1` (pill); từ chưa đọc: `text-slate-800`.
- Phụ đề đè trên video cũng dùng `KaraokeLine` (biến thể nền tối).
- Sau khi đổi script: chạy `npx tsx scripts/shadowing-cues.ts --all` để căn lại tất cả (miễn phí, chạy CPU, có thể lâu).

### 6.3. Nghiệm thu
- Mobile 375px: thanh nổi không che nội dung cuối, không đè widget chat, nút dễ bấm.
- Karaoke chạy mượt, từ sáng lên khớp tiếng (lệch ≤ 0,2 s), không giật khi danh sách dài 50 câu (kiểm tra Performance tab: không render lại toàn danh sách mỗi frame).
- Bài có cues v1 (chưa căn lại) vẫn chạy bình thường, chỉ không có karaoke.

---

## 7. Giai đoạn 5 — Dọn dẹp & hoàn thiện
- Sửa `shadowingAdmin.transcriptHint` (đang nói "học viên chỉ thấy sau khi nộp bài" — không còn đúng): "Mỗi dòng một câu. Sửa transcript xong cần chạy lại căn mốc thời gian."
- Trong form admin, nếu bài có `videoUrl` mà cues hết hạn → hiện cảnh báo + lệnh cần chạy (`npx tsx scripts/shadowing-cues.ts --slug <slug>`). Cần thêm cờ `cuesValid: boolean` vào `ShadowingAdminDetail` (tính bằng `validCueTimings(...) !== null`).
- Thẻ trong danh sách bài học viên (`/learn/shadowing`) và admin: icon video cho bài có video (cần thêm `hasVideo` vào `ShadowingCatalogItem` / `ExerciseListRow`, select `videoUrl: true` rồi map boolean — không gửi URL trong danh sách).
- Viết `docs/SHADOWING_VIDEO_ADMIN_GUIDE.md` (tiếng Việt, ngắn): cách nhập video, duyệt transcript, điền IPA/bản dịch, xuất bản.

---

## 8. Những điều KHÔNG làm
- Không nhúng YouTube iframe, không gọi YouTube Data API.
- Không gọi bất kỳ API AI/dịch thuật trả phí nào (xem mục 0.1).
- Không upload video qua form web (Vercel giới hạn body và thời gian chạy) — video chỉ vào R2 qua script local.
- Không đổi định dạng bảng `ShadowingAttempt`, không đổi API submit.
- Không chuyển trang học viên sang dynamic rendering.
- Không xoá các bài audio cũ hay đổi hành vi của chúng.

---

## 9. Kiểm tra sau mỗi giai đoạn

```powershell
npx prisma generate                      # nếu sửa schema
npx tsc --noEmit -p .                    # phải sạch
npx eslint src/components/shadowing src/components/admin src/lib/shadowing scripts/shadowing-*.ts
npm run test:shadowing-scoring           # test chấm điểm hiện có, phải pass
npm run dev                              # mở http://localhost:3000/learn/shadowing/<slug>
```
Kiểm tra thủ công trên trình duyệt: desktop 1440px và mobile 375px; locale `vi` và `en` (đổi bằng language switcher) — không được thấy key thô hay chữ tiếng Việt khi đang ở `en` (trừ nội dung bản dịch của bài).

So khớp key i18n giữa 2 file (phải in ra rỗng):
```powershell
node -e "const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=new Set(f(require('./src/i18n/messages/vi.json'))),b=new Set(f(require('./src/i18n/messages/en.json')));console.log([...a].filter(k=>!b.has(k)),[...b].filter(k=>!a.has(k)))"
```

---

## 10. Bẫy đã biết
- **Tiếng loa lọt vào micro**: luôn `media.pause()` trước khi ghi âm; khuyên đeo tai nghe (đã có ở chế độ cả bài, phải giữ ở chế độ từng câu và shadow tự động).
- **Seek đầu câu**: `use-sentence-playback.ts` có `SEEK_SLACK_SEC = 0.05` để không bị nhận nhầm câu trước; giữ nguyên khi sửa hook.
- **Hydration**: không đọc `localStorage`/`window` trong render; chỉ trong `useEffect`.
- **ISR cache**: đổi dữ liệu trả về từ `getPublishedShadowingRow` mà quên tăng cache key → trang live trả dữ liệu cũ thiếu trường → lỗi runtime.
- **Prisma Json null**: ghi `null` vào cột Json phải dùng `Prisma.DbNull`.
- **Thứ tự câu**: mọi mảng theo câu (cues, annotations, kết quả từng câu) phải ứng với `transcriptLines(transcript)`; không tự tách câu theo cách khác.
- **PowerShell**: `npm run x -- --flag` làm mất tham số; gọi `npx tsx scripts/... --flag` trực tiếp.
- **iOS Safari**: `<video>` cần `playsInline` (đã có); `play()` chỉ chạy sau thao tác người dùng — không tự phát khi tải trang.
- **Bundle client**: không import `ipa.ts`/CMUdict, `repo.ts`, `prisma` vào component `"use client"`.
