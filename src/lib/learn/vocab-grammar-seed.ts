import type { LearnExercise } from "@/lib/learn/types";
import cambridgeVocabUnits from "@/lib/learn/data/cambridge-vocab-units.json";
import flyerVocabTopics from "@/lib/learn/data/flyer-vocab-topics.json";
import type {
  LocalizedText,
  TopicLesson,
  VocabGrammarCatalog,
  VocabWord,
} from "@/lib/learn/vocab-grammar-types";

const V = {
  short: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  med: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
};

function loc(vi: string, en: string): LocalizedText {
  return { vi, en };
}

function mcq(
  id: string,
  promptVi: string,
  promptEn: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
): LearnExercise {
  const letters = ["A", "B", "C", "D"] as const;
  const correct = letters[correctIndex];
  const labeled = options.map((o, i) => `${letters[i]}. ${o}`);
  return {
    id,
    type: "multiple_choice",
    prompt: promptVi,
    options: labeled,
    answers: [correct, labeled[correctIndex], options[correctIndex]],
  };
}

function stubExercises(
  idPrefix: string,
  topicVi: string,
  topicEn: string,
): LearnExercise[] {
  return Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    return mcq(
      `${idPrefix}-q${n}`,
      `[Mẫu] Câu ${n}: Chọn đáp án đúng về ${topicVi}.`,
      `[Sample] Q${n}: Choose the correct answer about ${topicEn}.`,
      ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      0,
    );
  });
}

function topic(
  partial: Omit<TopicLesson, "id" | "exercises"> & {
    exercises?: LearnExercise[];
    words?: VocabWord[];
  },
  stub = false,
): TopicLesson {
  const prefix = partial.track === "grammar" ? "gram" : "vocab";
  const id = `${prefix}-${partial.slug}`;
  // Vocabulary is flashcards-only (no exercises). Grammar still gets stub MCQs when omitted.
  const exercises =
    partial.exercises ??
    (partial.track === "vocabulary"
      ? []
      : stubExercises(id, partial.title.vi, partial.title.en));
  return {
    ...partial,
    id,
    stub,
    words: partial.words,
    exercises,
  };
}

const wordClassesTheory = loc(
  `<h2>Kiến thức cơ bản 1: từ loại và cụm từ</h2>
<p>Tiếng Anh có <strong>8 từ loại cơ bản</strong>: danh từ, đại từ, tính từ, trạng từ, động từ, giới từ, liên từ và thán từ. Hiểu từ loại giúp bạn xác định vị trí từ trong câu và chọn từ phù hợp trong IELTS Writing/Speaking.</p>
<h3>1. Từ loại</h3>
<h4>1.1. Danh từ (Noun)</h4>
<p>Danh từ chỉ người, vật, sự việc, khái niệm. Có thể chia thành <strong>đếm được</strong> (countable) và <strong>không đếm được</strong> (uncountable).</p>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin:1rem 0">
<tr><th colspan="2">Danh từ đếm được</th><th>Danh từ không đếm được</th></tr>
<tr><th>Số ít</th><th>Số nhiều</th><th>—</th></tr>
<tr><td>a doctor</td><td>doctors</td><td>air, money, advice</td></tr>
</table>
<p><strong>Lưu ý:</strong> Một số danh từ vừa đếm được vừa không đếm được tùy nghĩa (<em>paper</em> = giấy / <em>papers</em> = tài liệu).</p>
<p><strong>VD:</strong> What are your <strong>hopes</strong> and dreams for the future?<br><em>Bạn hy vọng và ước mơ gì cho tương lai?</em></p>
<h4>1.2. Đại từ (Pronoun)</h4>
<p>Thay thế danh từ để tránh lặp: <em>he, she, it, they, which, who</em>.</p>`,
  `<h2>Basic knowledge 1: word classes and phrases</h2>
<p>English has <strong>8 basic word classes</strong>: nouns, pronouns, adjectives, adverbs, verbs, prepositions, conjunctions, and interjections. Knowing word classes helps you place words correctly in IELTS Writing and Speaking.</p>
<h3>1. Word classes</h3>
<h4>1.1. Nouns</h4>
<p>Nouns name people, things, events, or ideas. They may be <strong>countable</strong> or <strong>uncountable</strong>.</p>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin:1rem 0">
<tr><th colspan="2">Countable nouns</th><th>Uncountable nouns</th></tr>
<tr><th>Singular</th><th>Plural</th><th>—</th></tr>
<tr><td>a doctor</td><td>doctors</td><td>air, money, advice</td></tr>
</table>
<p><strong>Note:</strong> Some nouns change meaning when countable vs uncountable (<em>paper</em> vs <em>papers</em>).</p>
<p><strong>Ex:</strong> What are your <strong>hopes</strong> and dreams for the future?</p>
<h4>1.2. Pronouns</h4>
<p>Replace nouns to avoid repetition: <em>he, she, it, they, which, who</em>.</p>`,
);

const clausesTheory = loc(
  `<h2>Kiến thức cơ bản 2: mệnh đề và câu</h2>
<p><strong>Mệnh đề</strong> (clause) là nhóm từ có chủ ngữ và vị ngữ. <strong>Câu</strong> (sentence) gồm một hoặc nhiều mệnh đề.</p>
<h3>1. Mệnh đề độc lập vs phụ thuộc</h3>
<ul>
<li><strong>Independent clause:</strong> đứng một mình vẫn là câu hoàn chỉnh.</li>
<li><strong>Dependent clause:</strong> cần mệnh đề chính (because, although, which…).</li>
</ul>
<p><strong>VD:</strong> <em>Although the weather was bad, we went hiking.</em><br><em>Mặc dù thời tiết xấu, chúng tôi vẫn đi leo núi.</em></p>
<h3>2. Câu đơn, ghép và phức</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin:1rem 0">
<tr><th>Loại</th><th>Cấu trúc</th><th>Ví dụ</th></tr>
<tr><td>Simple</td><td>1 mệnh đề</td><td>She studies hard.</td></tr>
<tr><td>Compound</td><td>2+ mệnh đề độc lập</td><td>She studied, and she passed.</td></tr>
<tr><td>Complex</td><td>1 chính + 1+ phụ</td><td>She passed because she studied.</td></tr>
</table>`,
  `<h2>Basic knowledge 2: clauses and sentences</h2>
<p>A <strong>clause</strong> has a subject and a verb. A <strong>sentence</strong> contains one or more clauses.</p>
<h3>1. Independent vs dependent clauses</h3>
<ul>
<li><strong>Independent:</strong> can stand alone as a full sentence.</li>
<li><strong>Dependent:</strong> needs a main clause (because, although, which…).</li>
</ul>
<p><strong>Ex:</strong> <em>Although the weather was bad, we went hiking.</em></p>
<h3>2. Simple, compound, and complex sentences</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin:1rem 0">
<tr><th>Type</th><th>Structure</th><th>Example</th></tr>
<tr><td>Simple</td><td>1 clause</td><td>She studies hard.</td></tr>
<tr><td>Compound</td><td>2+ independent</td><td>She studied, and she passed.</td></tr>
<tr><td>Complex</td><td>main + subordinate</td><td>She passed because she studied.</td></tr>
</table>`,
);

const presentTensesTheory = loc(
  `<h2>Thì hiện tại trong IELTS</h2>
<p>Thì hiện tại gồm <strong>Simple Present</strong>, <strong>Present Continuous</strong>, và <strong>Present Perfect</strong> (xem thêm bài Perfect tenses).</p>
<h3>1. Present Simple</h3>
<p>Dùng cho thói quen, sự thật, lịch trình cố định.</p>
<p><strong>Công thức:</strong> S + V(s/es) | S + do/does + not + V | Do/Does + S + V?</p>
<p><strong>VD:</strong> The graph <strong>shows</strong> an upward trend. / Water <strong>boils</strong> at 100°C.</p>
<h3>2. Present Continuous</h3>
<p>Diễn tả hành động đang diễn ra hoặc kế hoạch đã sắp xếp.</p>
<p><strong>Công thức:</strong> S + am/is/are + V-ing</p>
<p><strong>VD:</strong> I <strong>am preparing</strong> for IELTS this month.</p>
<h3>3. So sánh nhanh</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin:1rem 0">
<tr><th>Thì</th><th>Dấu hiệu</th><th>Ví dụ IELTS</th></tr>
<tr><td>Simple</td><td>always, every day</td><td>The chart illustrates…</td></tr>
<tr><td>Continuous</td><td>now, currently</td><td>Emissions are rising…</td></tr>
</table>`,
  `<h2>Present tenses in IELTS</h2>
<p>Present tenses include <strong>Simple Present</strong>, <strong>Present Continuous</strong>, and <strong>Present Perfect</strong> (see Perfect tenses lesson).</p>
<h3>1. Present Simple</h3>
<p>Habits, facts, fixed schedules.</p>
<p><strong>Form:</strong> S + V(s/es) | S + do/does + not + V | Do/Does + S + V?</p>
<p><strong>Ex:</strong> The graph <strong>shows</strong> an upward trend.</p>
<h3>2. Present Continuous</h3>
<p>Actions in progress or arranged plans.</p>
<p><strong>Form:</strong> S + am/is/are + V-ing</p>
<p><strong>Ex:</strong> I <strong>am preparing</strong> for IELTS this month.</p>
<h3>3. Quick comparison</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin:1rem 0">
<tr><th>Tense</th><th>Signals</th><th>IELTS example</th></tr>
<tr><td>Simple</td><td>always, every day</td><td>The chart illustrates…</td></tr>
<tr><td>Continuous</td><td>now, currently</td><td>Emissions are rising…</td></tr>
</table>`,
);

function fullWordClassesExercises(): LearnExercise[] {
  const id = "gram-word-classes";
  return [
    mcq(`${id}-q1`, "Danh từ chỉ gì?", "What do nouns name?", ["Động tác", "Người/vật/sự việc", "Mối quan hệ", "Thời gian"], 1),
    mcq(`${id}-q2`, "“Advice” là danh từ:", "“Advice” is a:", ["Đếm được", "Không đếm được", "Động từ", "Tính từ"], 1),
    mcq(`${id}-q3`, "Số nhiều của “child” là:", "The plural of “child” is:", ["childs", "children", "childes", "childrens"], 1),
    mcq(`${id}-q4`, "Đại từ thay cho danh từ là:", "A pronoun replaces a:", ["Verb", "Noun", "Adverb", "Preposition"], 1),
    mcq(`${id}-q5`, "Tính từ bổ nghĩa cho:", "Adjectives modify:", ["Nouns", "Only verbs", "Only adverbs", "Punctuation"], 0),
    mcq(`${id}-q6`, "Trạng từ thường bổ nghĩa cho:", "Adverbs often modify:", ["Nouns only", "Verbs/adjectives", "Articles", "Commas"], 1),
    mcq(`${id}-q7`, "Giới từ đi kèm:", "Prepositions go with:", ["Only subjects", "Nouns/pronouns", "Exclamation marks", "Titles"], 1),
    mcq(`${id}-q8`, "“Beautiful” là:", "“Beautiful” is a:", ["Noun", "Adjective", "Verb", "Conjunction"], 1),
    mcq(`${id}-q9`, "Liên từ dùng để:", "Conjunctions are used to:", ["Join clauses", "Replace nouns", "Show tense", "Count nouns"], 0),
    mcq(`${id}-q10`, "Cụm danh từ gồm:", "A noun phrase includes:", ["Article + noun (+ modifiers)", "Only verbs", "Only adverbs", "Two subjects"], 0),
  ];
}

function fullClausesExercises(): LearnExercise[] {
  const id = "gram-clauses-sentences";
  return [
    mcq(`${id}-q1`, "Mệnh đề độc lập:", "An independent clause:", ["Cần mệnh đề khác", "Đứng một mình được", "Không có chủ ngữ", "Chỉ có giới từ"], 1),
    mcq(`${id}-q2`, "“Because she studied” là:", "“Because she studied” is a:", ["Independent clause", "Dependent clause", "Simple sentence", "Noun phrase"], 1),
    mcq(`${id}-q3`, "Câu ghép có:", "A compound sentence has:", ["1 clause", "2+ independent clauses", "No verb", "Only adjectives"], 1),
    mcq(`${id}-q4`, "“Although” bắt đầu:", "“Although” starts a:", ["Noun clause", "Adverbial clause", "Question", "Title"], 1),
    mcq(`${id}-q5`, "Câu phức có:", "A complex sentence has:", ["Main + subordinate", "No main clause", "Only nouns", "Two subjects only"], 0),
    mcq(`${id}-q6`, "Relative clause thường bắt đầu bằng:", "Relative clauses often start with:", ["who/which/that", "and/but", "wow/oh", "the/a"], 0),
    mcq(`${id}-q7`, "Comma splice là lỗi:", "A comma splice is:", ["Two clauses joined only by comma", "Missing subject", "Wrong article", "Long noun"], 0),
    mcq(`${id}-q8`, "Mệnh đề quan hệ bổ nghĩa:", "Relative clauses modify:", ["Nouns", "Only verbs", "Only adverbs", "Punctuation"], 0),
    mcq(`${id}-q9`, "“She passed; she studied hard” là:", "“She passed; she studied hard” is:", ["Simple", "Compound", "Fragment", "Noun phrase"], 1),
    mcq(`${id}-q10`, "Fragment là câu:", "A fragment is a sentence that:", ["Lacks complete structure", "Has two mains", "Is too long", "Uses perfect tense"], 0),
  ];
}

function fullPresentTensesExercises(): LearnExercise[] {
  const id = "gram-present-tenses";
  return [
    mcq(`${id}-q1`, "Present Simple dùng cho:", "Present Simple is used for:", ["Habits/facts", "Past events only", "Future perfect", "Questions only"], 0),
    mcq(`${id}-q2`, "He ___ to school every day.", "He ___ to school every day.", ["go", "goes", "going", "gone"], 1),
    mcq(`${id}-q3`, "Present Continuous: S +", "Present Continuous: S +", ["V-ed", "am/is/are + V-ing", "have + V3", "will + V"], 1),
    mcq(`${id}-q4`, "“Currently” gợi ý thì:", "“Currently” suggests:", ["Past simple", "Present continuous", "Past perfect", "Future in past"], 1),
    mcq(`${id}-q5`, "The chart ___ sales data.", "The chart ___ sales data.", ["show", "shows", "showing", "shown"], 1),
    mcq(`${id}-q6`, "Stative verbs thường:", "Stative verbs usually:", ["Use continuous rarely", "Always -ing", "No subject", "Past only"], 0),
    mcq(`${id}-q7`, "Do/Does + S + V là:", "Do/Does + S + V is:", ["Affirmative", "Question form", "Passive", "Perfect"], 1),
    mcq(`${id}-q8`, "They ___ for the exam now.", "They ___ for the exam now.", ["study", "are studying", "studied", "have studied"], 1),
    mcq(`${id}-q9`, "Facts dùng:", "Facts use:", ["Present simple", "Past continuous", "Future perfect", "Modal only"], 0),
    mcq(`${id}-q10`, "IELTS Writing Task 1 thường dùng:", "IELTS Writing Task 1 often uses:", ["Present simple", "Past perfect only", "Imperatives", "Questions"], 0),
  ];
}

/** Video + exercise grammar course, hidden while the slide-based course is live. */
const SHOW_LEGACY_GRAMMAR = false;

const LEGACY_GRAMMAR_TOPICS: TopicLesson[] = [
  topic({
    slug: "word-classes",
    track: "grammar",
    order: 1,
    title: loc("Từ loại và cụm từ", "Word classes & phrases"),
    summary: loc(
      "8 từ loại cơ bản, danh từ đếm được/không đếm được, cụm danh từ.",
      "8 basic word classes, countable/uncountable nouns, noun phrases.",
    ),
    videoUrl: V.short,
    durationSec: 15,
    theoryHtml: wordClassesTheory,
    slidesHtml: loc("<p>Slide 1: Danh từ · Slide 2: Đại từ · Slide 3: Tính từ</p>", "<p>Slide 1: Nouns · Slide 2: Pronouns · Slide 3: Adjectives</p>"),
    exercises: fullWordClassesExercises(),
  }, false),
  topic({
    slug: "clauses-sentences",
    track: "grammar",
    order: 2,
    title: loc("Mệnh đề và câu", "Clauses & sentences"),
    summary: loc(
      "Mệnh đề độc lập/phụ thuộc, câu đơn/ghép/phức.",
      "Independent/dependent clauses, simple/compound/complex sentences.",
    ),
    videoUrl: V.med,
    durationSec: 15,
    theoryHtml: clausesTheory,
    exercises: fullClausesExercises(),
  }, false),
  topic({
    slug: "present-tenses",
    track: "grammar",
    order: 3,
    title: loc("Thì hiện tại", "Present tenses"),
    summary: loc(
      "Present Simple, Present Continuous và cách dùng trong IELTS.",
      "Present Simple, Present Continuous and IELTS usage.",
    ),
    videoUrl: V.short,
    durationSec: 15,
    theoryHtml: presentTensesTheory,
    exercises: fullPresentTensesExercises(),
  }, false),
  topic({ slug: "past-tenses", track: "grammar", order: 4, title: loc("Thì quá khứ", "Past tenses"), summary: loc("Past Simple, Past Continuous, Past Perfect.", "Past Simple, Past Continuous, Past Perfect."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "future-tenses", track: "grammar", order: 5, title: loc("Thì tương lai", "Future tenses"), summary: loc("Will, be going to, Present for future.", "Will, be going to, Present for future."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "perfect-tenses", track: "grammar", order: 6, title: loc("Thì hoàn thành", "Perfect tenses"), summary: loc("Present/Past Perfect và cách dùng.", "Present/Past Perfect and usage."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "passive-voice", track: "grammar", order: 7, title: loc("Câu bị động", "Passive voice"), summary: loc("Cấu trúc và dùng trong Academic Writing.", "Structure and Academic Writing usage."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "modals", track: "grammar", order: 8, title: loc("Động từ khiếm khuyết", "Modals"), summary: loc("Can, could, must, should, may, might.", "Can, could, must, should, may, might."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "conditionals", track: "grammar", order: 9, title: loc("Câu điều kiện", "Conditionals"), summary: loc("Zero, first, second, third và mixed.", "Zero, first, second, third and mixed."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "relative-clauses", track: "grammar", order: 10, title: loc("Mệnh đề quan hệ", "Relative clauses"), summary: loc("Defining/non-defining, who/which/that.", "Defining/non-defining, who/which/that."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "noun-phrases", track: "grammar", order: 11, title: loc("Cụm danh từ", "Noun phrases"), summary: loc("Mở rộng danh từ cho Writing Task 2.", "Expanding nouns for Writing Task 2."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "articles", track: "grammar", order: 12, title: loc("Mạo từ a/an/the", "Articles"), summary: loc("Quy tắc a, an, the và zero article.", "Rules for a, an, the and zero article."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "prepositions", track: "grammar", order: 13, title: loc("Giới từ", "Prepositions"), summary: loc("Giới từ thời gian, nơi chốn, cụm động.", "Time, place, and verb-preposition collocations."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "comparatives", track: "grammar", order: 14, title: loc("So sánh hơn & nhất", "Comparatives & superlatives"), summary: loc("-er/-est, more/most, as…as.", "-er/-est, more/most, as…as."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "cohesion-linking", track: "grammar", order: 15, title: loc("Liên kết & mạch lạc", "Cohesion & linking"), summary: loc("However, therefore, moreover, referencing.", "However, therefore, moreover, referencing."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "reported-speech", track: "grammar", order: 16, title: loc("Câu tường thuật", "Reported speech"), summary: loc("Chuyển thì, đại từ, trạng từ.", "Tense backshift, pronouns, adverbs."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "inversion", track: "grammar", order: 17, title: loc("Đảo ngữ", "Inversion"), summary: loc("Not only, hardly, never, conditional inversion.", "Not only, hardly, never, conditional inversion."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "cleft-sentences", track: "grammar", order: 18, title: loc("Câu chẻ", "Cleft sentences"), summary: loc("It is… that/who, What… is.", "It is… that/who, What… is."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "gerunds-infinitives", track: "grammar", order: 19, title: loc("Gerund & Infinitive", "Gerunds & infinitives"), summary: loc("V-ing vs to-V sau động từ/tính từ.", "V-ing vs to-V after verbs/adjectives."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "subject-verb-agreement", track: "grammar", order: 20, title: loc("Hòa hợp chủ-vị", "Subject-verb agreement"), summary: loc("Số ít/nhiều, collective nouns, there is/are.", "Singular/plural, collective nouns, there is/are."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "parallel-structure", track: "grammar", order: 21, title: loc("Cấu trúc song song", "Parallel structure"), summary: loc("Liệt kê, so sánh, correlative conjunctions.", "Lists, comparisons, correlative conjunctions."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "word-formation", track: "grammar", order: 22, title: loc("Cấu tạo từ", "Word formation"), summary: loc("Prefix, suffix, chuyển từ loại.", "Prefixes, suffixes, changing word class."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "collocations", track: "grammar", order: 23, title: loc("Collocations", "Collocations"), summary: loc("Cụm từ cố định cho Speaking/Writing.", "Fixed phrases for Speaking/Writing."), videoUrl: V.short, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
  topic({ slug: "punctuation", track: "grammar", order: 24, title: loc("Dấu câu cho IELTS Writing", "Punctuation for IELTS Writing"), summary: loc("Comma, semicolon, colon, apostrophe.", "Comma, semicolon, colon, apostrophe."), videoUrl: V.med, theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>") }, true),
];

function googleSlidesEmbed(fileId: string): string {
  return `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=60000`;
}

/** WeWIN IELTS Grammar decks (Google Drive folder "WeWIN IELTS Grammar – Dễ học & Minh họa"); teacher guide omitted. */
const SLIDE_GRAMMAR_DECKS: {
  slug: string;
  fileId: string;
  label: string;
  vi: string;
  en: string;
}[] = [
  { slug: "g1-four-core-tenses", fileId: "1iHe1MP1bw4Df5H4tbvldD6U47J0mx_hPrKmDY_YFVgI", label: "Grammar 1", vi: "Bốn thì nền tảng", en: "Four core tenses" },
  { slug: "g2-subject-verb-agreement", fileId: "13mw0w6ju5czLOP8c4AXG6t5ZW0RozhlyDS5U7X2hEBQ", label: "Grammar 2", vi: "Hòa hợp chủ ngữ và động từ", en: "Subject-verb agreement" },
  { slug: "g3-passive-voice", fileId: "1qZGL7IsjEm1SUE1spsBG1g6FemPXkUNGdKqAYBCWB08", label: "Grammar 3", vi: "Câu bị động", en: "Passive voice" },
  { slug: "g4-relative-clauses", fileId: "198fWHNASOlMSRN_2HGX-JA7mJ64HNRy3y57_O13ItDY", label: "Grammar 4", vi: "Mệnh đề quan hệ", en: "Relative clauses" },
  { slug: "g5-1-prepositions-time-place-movement", fileId: "1Nq0mYf9asV9iUZaYCzogCCw7-HdnC1SKapCGG40lAsI", label: "Grammar 5.1", vi: "Giới từ thời gian, nơi chốn và chuyển động", en: "Prepositions of time, place and movement" },
  { slug: "g5-2-dependent-prepositions", fileId: "1Pv3FzyhvYiK9ckVsgI8rg-rXQJ3S57yj3ext1mnUq1I", label: "Grammar 5.2", vi: "Giới từ đi với tính từ, động từ và danh từ", en: "Prepositions after adjectives, verbs and nouns" },
  { slug: "g6-1-nouns-quantity", fileId: "1yYCnunmT_Z6ciXuADZ_Zy8mL_YrA3osIO0oqyjg7Ym0", label: "Grammar 6.1", vi: "Danh từ và số lượng", en: "Nouns and quantity" },
  { slug: "g6-2-articles", fileId: "1uA2RG1zH6hqIMWcgguPC9KFBXCzx646e557S_wsxtDQ", label: "Grammar 6.2", vi: "Mạo từ a, an, the và không mạo từ", en: "Articles: a, an, the and zero article" },
  { slug: "g7-1-verb-patterns", fileId: "1GIG1C2G4Py2I4nzVCoARyFhEY4OEFh1elaf1EKW__-E", label: "Grammar 7.1", vi: "Động từ và dạng động từ theo sau", en: "Verbs and verb patterns" },
  { slug: "g7-2-modal-verbs", fileId: "1_XweIx5U8-9FCc8IYNXohVwgj9oqsJrcOlz1eJJepBA", label: "Grammar 7.2", vi: "Động từ khuyết thiếu", en: "Modal verbs" },
  { slug: "g8-1-adjectives", fileId: "1ts6dDBK6LrONJ1UGFke7aXZsRMYCb_z1bg1OjfPQNVg", label: "Grammar 8.1", vi: "Tính từ và cụm tính từ", en: "Adjectives and adjective phrases" },
  { slug: "g8-2-adverbs", fileId: "1xZGEmyaM0kfDJScpxRz5IQcpwZj5-5WHPITxgymP5mY", label: "Grammar 8.2", vi: "Trạng từ và vị trí trạng từ", en: "Adverbs and adverb position" },
  { slug: "g9-1-comparisons", fileId: "13H7d-_XC22gRvUOuW5HJ-Rxo5nZdN4I26MN1fJnjbGM", label: "Grammar 9.1", vi: "So sánh hơn, nhất và bằng", en: "Comparatives, superlatives and equality" },
  { slug: "g9-2-advanced-comparisons", fileId: "1PMoG6Z8IOsuWw9PGBfGg_LnrvUdoZsENpwMUe3AfTzM", label: "Grammar 9.2", vi: "Các cấu trúc so sánh mở rộng", en: "Extended comparison structures" },
  { slug: "g10-1-cause-effect", fileId: "1T3gz9Oo5WrGFx4njw3Fr42SMt1PP5ZvGw10w4B4L4iE", label: "Grammar 10.1", vi: "Liên kết nguyên nhân và kết quả", en: "Linking cause and effect" },
  { slug: "g10-2-contrast-concession", fileId: "1oMuTwH-XzpfcdHz-CLD4FTofn7MjzIavOGslpj9cOPk", label: "Grammar 10.2", vi: "Liên kết tương phản và nhượng bộ", en: "Linking contrast and concession" },
  { slug: "g10-3-purpose", fileId: "1decXT4mP3KPtP2m5l-OkmQF5VmRINOryXxlBnx2QZGU", label: "Grammar 10.3", vi: "Diễn đạt mục đích", en: "Expressing purpose" },
  { slug: "g10-4-conditionals", fileId: "1uimvmKD948jAnZetz1vN0U_qM3njgra-UTQP6_2m6HI", label: "Grammar 10.4", vi: "Câu điều kiện", en: "Conditionals" },
  { slug: "g10-5-time-addition-sequence", fileId: "1RVVb7sJRh37wgxdnQ_9IY6VZ_EopGa-ErEg4bSdYl5s", label: "Grammar 10.5", vi: "Liên kết thời gian, bổ sung và trình tự", en: "Linking time, addition and sequence" },
  { slug: "g11-1-very-too-enough-so-such", fileId: "1j4O1OiEk1xRMs8TivZ_0UC8NYb-hKV5H0uEM_xy0sHQ", label: "Grammar 11.1", vi: "Very, too, enough, so và such", en: "Very, too, enough, so and such" },
  { slug: "g11-2-quantifiers-confusables", fileId: "1Twn8xDEs_nj6TSnlOMVVShZaEPAhIIJVCBH64BjY5eM", label: "Grammar 11.2", vi: "Lượng từ và các cặp từ dễ nhầm", en: "Quantifiers and commonly confused words" },
];

/** WeWIN IELTS 3.0–4.0 decks (Google Drive folder "IELTS 3.0_4.0"); teacher guide omitted. */
const IELTS_34_DECKS: { n: number; slug: string; fileId: string; title: string }[] = [
  { n: 1, slug: "ielts34-01-daily-life-vocabulary-and-listening", fileId: "1ruxhDpLfAmTFdWDPMKy71VeEkFafDXnIN9ovbNn2cpU", title: "Daily Life Vocabulary and Listening" },
  { n: 2, slug: "ielts34-02-daily-life-reading-and-grammar", fileId: "1OZqwAehGy5vZg3GYcinBrVAroouud5hZQ4-W-miEe1k", title: "Daily Life Reading and Grammar" },
  { n: 3, slug: "ielts34-03-daily-life-speaking-and-pronunciation", fileId: "1QosNfOWa8Xw3IGr7zvKii4BY265REcSb3r1FahfCSks", title: "Daily Life Speaking and Pronunciation" },
  { n: 4, slug: "ielts34-04-daily-life-writing-and-application", fileId: "1_yDNCb_53f6So8d3YK4TXAs5VMrTVFVt4gr1GVCdMGQ", title: "Daily Life Writing and Application" },
  { n: 5, slug: "ielts34-05-house-and-home-vocabulary-and-listening", fileId: "1tIWDsgoqGn5gR9E_PLlmkqEntuy434a4TS2oGf9cBRA", title: "House and Home Vocabulary and Listening" },
  { n: 6, slug: "ielts34-06-house-and-home-reading-and-grammar", fileId: "1gZAeyUAskRuE2DygIdhvsQMhZp84wjEm3-BMLgAwEY8", title: "House and Home Reading and Grammar" },
  { n: 7, slug: "ielts34-07-house-and-home-speaking-and-pronunciation", fileId: "19N3KA3hCp1Fq2fWDgtrjqk56kEqZ3lp6S3shJJ8xktA", title: "House and Home Speaking and Pronunciation" },
  { n: 8, slug: "ielts34-08-house-and-home-writing-and-application", fileId: "1uVdmW7lRzN_nLeEm9NmvE9_QuyxeCeY-wk95UmjCpJE", title: "House and Home Writing and Application" },
  { n: 9, slug: "ielts34-09-hobbies-leisure-and-entertainment-vocabulary-and-listening", fileId: "1GU7QY2uxYU0ZoHqVrGWY8WVZ-huouBuLJCPp46ftqNc", title: "Hobbies, Leisure and Entertainment Vocabulary and Listening" },
  { n: 10, slug: "ielts34-10-hobbies-leisure-and-entertainment-reading-and-grammar", fileId: "1bZlYRpNyOjmq9DeQB21vsLhJ_2ImytM56SaznPMK2Y8", title: "Hobbies, Leisure and Entertainment Reading and Grammar" },
  { n: 11, slug: "ielts34-11-hobbies-leisure-and-entertainment-speaking-and-pronunciation", fileId: "1JXkxWnh80apDLCxGT9k8LXHkN5NVho9m7UC7vgcu81A", title: "Hobbies, Leisure and Entertainment Speaking and Pronunciation" },
  { n: 12, slug: "ielts34-12-hobbies-leisure-and-entertainment-writing-and-application", fileId: "1QzbtbjywZFUVHysrgxlZfpaKodMGAVxTCeAfzETA9xg", title: "Hobbies, Leisure and Entertainment Writing and Application" },
  { n: 13, slug: "ielts34-13-travel-and-holidays-vocabulary-and-listening", fileId: "1xBz46KyV86OlQSYwMeNUFq5Ihae3ketvobNTcyJskGY", title: "Travel and Holidays Vocabulary and Listening" },
  { n: 14, slug: "ielts34-14-travel-and-holidays-reading-and-grammar", fileId: "1uRm_WbJAydpGewrK-ZwKuHDfTBptjOwxM_-v2stCaOo", title: "Travel and Holidays Reading and Grammar" },
  { n: 15, slug: "ielts34-15-travel-and-holidays-speaking-and-pronunciation", fileId: "10U_B5o0OLmurCWRAJXIYkKUIr6PcYP7cDT0t9OGPfi8", title: "Travel and Holidays Speaking and Pronunciation" },
  { n: 16, slug: "ielts34-16-travel-and-holidays-writing-and-application", fileId: "1jmb0pwWUCVEyuJv5R5pQCtzTJMbH0tDHWYcu7RF2N0o", title: "Travel and Holidays Writing and Application" },
  { n: 17, slug: "ielts34-17-food-vocabulary-and-listening", fileId: "1F2LoWcJ4UozfJeVXm-BJqNOwIU5zqtusWYoXHGZJFDI", title: "Food Vocabulary and Listening" },
  { n: 18, slug: "ielts34-18-food-reading-and-grammar", fileId: "1pn-AEKxKg1sgV6qzgD9cR6J_OWCQC0jWSWxv6aD7lhc", title: "Food Reading and Grammar" },
  { n: 19, slug: "ielts34-19-food-speaking-and-pronunciation", fileId: "1_mQd85y2VCSzgIook9Nt-1umbT4caOOooXO_si0ik0Y", title: "Food Speaking and Pronunciation" },
  { n: 20, slug: "ielts34-20-food-writing-and-application", fileId: "1Kf0WhvJ87k6eUfmf0P-1AWzM5-ujxFgi4NYy6KMMKKk", title: "Food Writing and Application" },
  { n: 21, slug: "ielts34-21-progress-check-1", fileId: "1yvAB_JiFZclTjj-z1ZmGuIHKTmzRDWSq4jtUtImOr0k", title: "Progress Check 1" },
  { n: 22, slug: "ielts34-22-transport-and-places-in-town-vocabulary-and-listening", fileId: "1-5wYFRMbgzJgrwLBFCoRxoGfsRUXJzEVCoqtu_Lh5JE", title: "Transport and Places in Town Vocabulary and Listening" },
  { n: 23, slug: "ielts34-23-transport-and-places-in-town-reading-and-grammar", fileId: "1B3c63S174NteEJBkDlg7M79GPViZQJjg0NhGsCYazow", title: "Transport and Places in Town Reading and Grammar" },
  { n: 24, slug: "ielts34-24-transport-and-places-in-town-speaking-and-pronunciation", fileId: "1z8RiiSltibGWwJiFkAZ18CbpH3LxEsNG2FzCEUPT3nU", title: "Transport and Places in Town Speaking and Pronunciation" },
  { n: 25, slug: "ielts34-25-transport-and-places-in-town-writing-and-application", fileId: "1osQPDAA6nkijf6-g3ZctlqmFyF2uHNEsUaKZyqRON4U", title: "Transport and Places in Town Writing and Application" },
  { n: 26, slug: "ielts34-26-jobs-work-and-study-vocabulary-and-listening", fileId: "17wW0Tx2DeHY3j-wbOaM99dkbmBljTXcFgqXsvt-I0b4", title: "Jobs, Work and Study Vocabulary and Listening" },
  { n: 27, slug: "ielts34-27-jobs-work-and-study-reading-and-grammar", fileId: "1Rs0szr77wzk-LeGWDNi5ZQB_Zjk9uCFw8W9wEFaLVAw", title: "Jobs, Work and Study Reading and Grammar" },
  { n: 28, slug: "ielts34-28-jobs-work-and-study-speaking-and-pronunciation", fileId: "1Fvh47bkT9JiBdr0WS3xMp_g2zEZQy72fHJ6ODLSBuvU", title: "Jobs, Work and Study Speaking and Pronunciation" },
  { n: 29, slug: "ielts34-29-jobs-work-and-study-writing-and-application", fileId: "1JlVS4rxGKk84iX8mKa_Ys7975uSQ4Kk_fMPRbIigpPU", title: "Jobs, Work and Study Writing and Application" },
  { n: 30, slug: "ielts34-30-health-and-medicine-vocabulary-and-listening", fileId: "1klbeZgasf_hHYv4nSGRNEVKNgSgnwN0tJ3SRWT-h-Cw", title: "Health and Medicine Vocabulary and Listening" },
  { n: 31, slug: "ielts34-31-health-and-medicine-reading-and-grammar", fileId: "1fwfC-VkHBU44y5zzgeLsU_hJKboX4mNaz3M0Yc-14-E", title: "Health and Medicine Reading and Grammar" },
  { n: 32, slug: "ielts34-32-health-and-medicine-speaking-and-pronunciation", fileId: "1Li49xTc4aO6rdOoU9NXjNDRReiVfwjuYOjOu9pqWNV8", title: "Health and Medicine Speaking and Pronunciation" },
  { n: 33, slug: "ielts34-33-health-and-medicine-writing-and-application", fileId: "16rUesXRai89icMLC9bxH8HplhQ3kwDktoIkn4vGsm0s", title: "Health and Medicine Writing and Application" },
  { n: 34, slug: "ielts34-34-language-vocabulary-and-listening", fileId: "1gRo_Qk3WbwRBoAxNf-gQoZOGJFH6vem_hH3RrBJ1vFs", title: "Language Vocabulary and Listening" },
  { n: 35, slug: "ielts34-35-language-reading-and-grammar", fileId: "1s8WCnhOYw1dW7n95nBehklyehsL_nyXdrLUxT-PRCl4", title: "Language Reading and Grammar" },
  { n: 36, slug: "ielts34-36-language-speaking-and-pronunciation", fileId: "12jaQAnAbPMLQCplBr72TLgcOWbzpvN4c5Hp70DxiTjI", title: "Language Speaking and Pronunciation" },
  { n: 37, slug: "ielts34-37-language-writing-and-application", fileId: "1a2KjKEPWXSHF0_g59LTaDAsJTYYJOTkvmEs8QSbtDtE", title: "Language Writing and Application" },
  { n: 38, slug: "ielts34-38-science-and-technology-vocabulary-and-listening", fileId: "1hTmaoOju9C-lYJss4lRRhY-GpU696Dp8H5nyauKZO3k", title: "Science and Technology Vocabulary and Listening" },
  { n: 39, slug: "ielts34-39-science-and-technology-reading-and-grammar", fileId: "1QkoCVpTJu3fJOuci5OJWOBhOekEHH2FKGRpdGglxw54", title: "Science and Technology Reading and Grammar" },
  { n: 40, slug: "ielts34-40-science-and-technology-speaking-and-pronunciation", fileId: "1uQTJhekDQJWs_fy1kmLcG4mvHvYHEQKYLQ2BD85K7qc", title: "Science and Technology Speaking and Pronunciation" },
  { n: 41, slug: "ielts34-41-science-and-technology-writing-and-application", fileId: "1o_PkRgd0ePc7u7G0JLIZDAKOIvGy53neficRIQIJKUs", title: "Science and Technology Writing and Application" },
  { n: 42, slug: "ielts34-42-progress-check-2", fileId: "1YXp5chCoCiCbWPjXp-ToxonK-zFoU_FezkZXDWvI8YA", title: "Progress Check 2" },
  { n: 43, slug: "ielts34-43-listening-and-reading-bridge", fileId: "11FrgqBVBp9ymYQACWJVoZFo56RoXFrX2JAUwVmvmkQw", title: "Listening and Reading Bridge" },
  { n: 44, slug: "ielts34-44-academic-writing-and-speaking-bridge", fileId: "1DejpjS4hr7zE3Ag2IhYxflegmmVf9zp7j0kQfaS-h7s", title: "Academic Writing and Speaking Bridge" },
  { n: 45, slug: "ielts34-45-internal-listening-and-reading-assessment", fileId: "1e0gTwdpgyYMOCpcHwObBJi_ivgb3heRP4UaVGGEgYmk", title: "Internal Listening and Reading Assessment" },
  { n: 46, slug: "ielts34-46-writing-practice-test-and-speaking-review", fileId: "1W9DNsyJmV1scKT8rsnVqMNFqtjHJivjEWuwhn7LE1AM", title: "Writing Practice Test and Speaking Review" },
  { n: 47, slug: "ielts34-47-error-clinic-and-individual-repair", fileId: "100tQQcVBStAPqCx3CFK2FzRkWUSMNsrMOx24XkhBMbo", title: "Error Clinic and Individual Repair" },
  { n: 48, slug: "ielts34-48-exit-assessment-and-next-steps", fileId: "1rpyY1M5MD1WpnCtMV9RjsPkgCfZQlsuyhhbCF96bQyg", title: "Exit Assessment and Next Steps" },
];

/** WeWIN IELTS 4.0–5.0 decks (Google Drive folder "01 Slides - 60 lessons"); index + 1 = lesson number. */
const IELTS_45_DECKS: { fileId: string; title: string }[] = [
  { fileId: "1NTk7MXWuqsbdAI9q9Yp2-dIIj109GM73AyghCRJ_fDo", title: "Entry Diagnostic and Learning Plan" },
  { fileId: "1OsCWK2OWOL37h-zsyP1YcOVANIZc0NBT8XgecjRgxH8", title: "Grammar and Sentence Repair" },
  { fileId: "1rvBo8IBurMY1Vzo60iktIxK0cMGKolmNe_dm4kYMM8M", title: "Relationships Reading and Vocabulary" },
  { fileId: "1tZTIYmAcV261FL-VxtiVrOl22guYsSZxMQ9y-uMtJf0", title: "Relationships Grammar and Reading Practice" },
  { fileId: "1MGqt8nENvnDEFypeYe-THR_eQPsiDOGGRJ_1F6v1Y8U", title: "Relationships Listening Skills" },
  { fileId: "155v7NjFDBfbsP1xBEcFLY-sv-5JdAuluSiMlyP9K8uE", title: "Relationships Speaking and Pronunciation" },
  { fileId: "1L20An0sGCqOKOnb-SdurcqbaZly3rVgxgIjLPEfGwfA", title: "Relationships Academic Writing Task 1" },
  { fileId: "1W68EpfVkw5ACorL_vZ4Oa5XD4sjUciSUresSMsvF2_0", title: "Relationships Academic Writing Task 2" },
  { fileId: "1L2vIQdlVh_LeVig0KXNFk0nlTUm4lUAq9DD20CYeyaY", title: "Places and Buildings Reading and Vocabulary" },
  { fileId: "1KtAs8wy-4pBNVx2nn6a6-OYoHZ6SWt9UsRaeNYJkMHY", title: "Places and Buildings Grammar and Reading Practice" },
  { fileId: "1oVcTEYdgkZ8REyj7RMO6dE2pYs_9UaVEJvguDzObwNM", title: "Places and Buildings Listening Skills" },
  { fileId: "1e8V58o2WFzzya04nB4ZyFiGK0zb6JtYopYq0YaqOj_8", title: "Places and Buildings Speaking and Pronunciation" },
  { fileId: "1WDge_URAMnBPWROWcGA61OuIEpEGcKD_pI9IbTXjcY4", title: "Places and Buildings Academic Writing Task 1" },
  { fileId: "1E5MdxgVdX-aYeW_QnMijWcFO_URoi4_JmnZsbHys6F8", title: "Places and Buildings Academic Writing Task 2" },
  { fileId: "13HVReZ9Ir7fJHwOXJptH5SiXVmAS47KePjYumKw6P-c", title: "Review 1: Relationships and Places" },
  { fileId: "1HHopx6OqgFEydInqtgWCh6JPs2K5P6kWlE3FGLEazgA", title: "Education and Employment Reading and Vocabulary" },
  { fileId: "1na3bLo4kemz_2rs-W2h461F4VrhlWltqcUoUUTXKdIA", title: "Education and Employment Grammar and Reading Practice" },
  { fileId: "1cqyJZS3JuZxD0DOlaRMW_vM2BZZZYMpDptyqbc0AGtI", title: "Education and Employment Listening Skills" },
  { fileId: "11is-FRShyv58XeCFp8P1NW3T5tjjxFgRYEeiniHuMlI", title: "Education and Employment Speaking and Pronunciation" },
  { fileId: "11AcB1ssA1zhH4_J8OCnTIkW0MPy_JoDy9yC2Vm1IWG8", title: "Education and Employment Academic Writing Task 1" },
  { fileId: "1766iTeipU4K7ALgFBBeHYMwr_u7lybys0sXtDIKgyY4", title: "Education and Employment Academic Writing Task 2" },
  { fileId: "1VWt_3ORU0DL9on-rExDiRCr4sxf_4FnKtgBgpu4hgwI", title: "Food and Drink Reading and Vocabulary" },
  { fileId: "1vljEXVsLk4Yhp8zusOWZWVhET0rdbC93rtFtUBsh0KA", title: "Food and Drink Grammar and Reading Practice" },
  { fileId: "16OqK4uO2uZX2aC3tGc47DTbBlnJGDbon4e0zzv65Eqw", title: "Food and Drink Listening Skills" },
  { fileId: "1gVUl2ZtoGcn2oW3zlCnjkD-0u-BCGf4wOI6yywgq8B0", title: "Food and Drink Speaking and Pronunciation" },
  { fileId: "1Jo8esuV8IEPKDSRmlGLlTkgwpBDiwHskFvjvC6RT2lw", title: "Food and Drink Academic Writing Task 1" },
  { fileId: "1KN9GjZ4ocfJiqvkWROVL7W7Wt3a1ccp4kuVrWTIGmKs", title: "Food and Drink Academic Writing Task 2" },
  { fileId: "1aiPQZY80EoshgR8Vtxh-ax19DlSywtXMMalbTeLFBRI", title: "Progress Check 1" },
  { fileId: "1eOOz_T7-Yp3v02Yu2QeVP2WeyKJqKkU9WFDv8PFYJk0", title: "Consumerism Reading and Vocabulary" },
  { fileId: "1DTyCzLLgC7FyhUzG8rAJpFwKHucpCuZQM76Y6WQbXCg", title: "Consumerism Grammar and Reading Practice" },
  { fileId: "1_CD0vne3-ZjOiu7W1EzsQtnAWobS1osMwOSp-AuEV_o", title: "Consumerism Listening Skills" },
  { fileId: "1gkO-TenaIAkcFGiBOjsADxJSBdcFLXiEvUWIw2agrWo", title: "Consumerism Speaking and Pronunciation" },
  { fileId: "1bgPgcYx4G8Q8qZdO__z17927DpGWZFfDvNsYO1M-xts", title: "Consumerism Academic Writing Task 1" },
  { fileId: "1FpbSEqS6zUwFKlWDTu6eGGKGD7ndCnBcPpjOmO6GMDk", title: "Consumerism Academic Writing Task 2" },
  { fileId: "1YbM1qYmNiepdTK7S8i8qq4BdcPR5plz1uzd2jz_TF0s", title: "Leisure Time Reading and Vocabulary" },
  { fileId: "1tJC0oimd4NfRWQR6vQAyzjHKKK-__l52GA-JIk3EmOQ", title: "Leisure Time Grammar and Reading Practice" },
  { fileId: "1HVs6eSJrmcILM7SeanhhJ5VXDSsbcv6z8JrvyW04Sd8", title: "Leisure Time Listening Skills" },
  { fileId: "10WdZDqCjyI0g7p0EreOTy-xlcsmkIaNiTtBmrJYxyZs", title: "Leisure Time Speaking and Pronunciation" },
  { fileId: "1zkjLJvrjEeo_Vy5aoJ1QUeX3TP3JPmceCSPPvMbOIpY", title: "Leisure Time Academic Writing Task 1" },
  { fileId: "1Gph0AU0ojh6qfj3twiyEYttgXu4h2X1roNrgZnYjlvA", title: "Leisure Time Academic Writing Task 2" },
  { fileId: "1kF9_J2_HH6V_a01odgLFvsnnPC36ZLRLt68Az7TQ4XA", title: "Review 2: Consumerism and Leisure" },
  { fileId: "1fAxbgOgPYE1_Q_JIfD-gdr4DjdOYlJvs4GXrJrolkV8", title: "Fame and the Media Reading and Vocabulary" },
  { fileId: "1tJFhlQJ_l16IzBiy5nsIgfIp4obK-g9FFsBOyEQjz2k", title: "Fame and the Media Grammar and Reading Practice" },
  { fileId: "1CXotQXAyCqqPWjvsyVtKhN131eO5n-Hv9XQlDUe575I", title: "Fame and the Media Listening Skills" },
  { fileId: "1yacP-0C9FpZcs3C6TnIf9GgobdvWtxCh5Y5VxE5yrCk", title: "Fame and the Media Speaking and Pronunciation" },
  { fileId: "1qBwTY-OpqUgBAuuQYJPxa4aMEC8nY8Ck7kxMzEajsDs", title: "Fame and the Media Academic Writing Task 1" },
  { fileId: "1lkhyhobMzSG7ywFJhWLi6TTfWDKtxY2uLxNRKN4gL4c", title: "Fame and the Media Academic Writing Task 2" },
  { fileId: "1dZRoIf1rrXxUSE7Zwj2JaQ0pqcJmJMA07O-kxEA_YZc", title: "Natural World Reading and Vocabulary" },
  { fileId: "1kOLwLt-LRpmGsQyo5twO26wNRuIRPFj2TzFdgz3aNm0", title: "Natural World Grammar and Reading Practice" },
  { fileId: "1fmMbtoHaVHfIih5g96IwCM-tgro1_7ixB4DXQ3BxVuU", title: "Natural World Listening Skills" },
  { fileId: "1zBdvLLxTv-IyQubeEQsMiYS12J1mDlX-WWq0hewKDbc", title: "Natural World Speaking and Pronunciation" },
  { fileId: "1RNRdokW9WjT5BDhiFIMsAfjfA1uKxX1MCo5iJtJDv2Y", title: "Natural World Academic Writing Task 1" },
  { fileId: "1yqSp7x-3SesAYgKHmIxyPaQ6IgXTsSgrwb0utDufdsI", title: "Natural World Academic Writing Task 2" },
  { fileId: "1Yh0SmQfYmO6bGFgO1OFGzAFcrJWObA7CFAP4g-wKFBc", title: "Progress Check 2" },
  { fileId: "1EobFCgYh1s180uRcb1Y8bfq3CUU73Gv0taw7yWnXmbY", title: "Listening and Reading Exam Workshop" },
  { fileId: "18gJ_Lm2QHlqvalmi_YArIBhCz4jsd44-KdwPWNVR0R4", title: "Academic Writing Practice Test" },
  { fileId: "1tZ_2eHKPSw70DZgqU7mZDGK3Hqs4bhJFGY0dqjUozlA", title: "Speaking Interview Workshop" },
  { fileId: "1_3KzJoOVlAOXrGwThgcdk5NrhBoc1bbh-AZB6fSMbEA", title: "Error Clinic and Individual Repair" },
  { fileId: "1c1k0Jkra048syUTYduN9ZGcgxA4KmGZRaRwDv8SK7PA", title: "Internal Listening and Reading Assessment" },
  { fileId: "1JLPVVffL07fyxvp01dC1lZgRaAeJ0jh55TQAu6-lBWA", title: "Exit Portfolio and Next Steps" },
];

/** WeWIN IELTS 5.0–6.0 decks (Google Drive folder "01 Slides"); index + 1 = lesson number. */
const IELTS_56_DECKS: { fileId: string; title: string }[] = [
  { fileId: "1F04ai6U4AOr9jAPlVRURZo8n-9COeZ60nMBAt6XcnWs", title: "Entry diagnostic and learning plan" },
  { fileId: "1xWq8uCf63ONZEldGgNQ72RcDymeT_8mYUvGItN8nKDc", title: "Sentence control and evidence: Grammar and sentence control" },
  { fileId: "1-7Ux7EDtIWg2_T8mottAWCQ7JTlpCVz1l-bsmxuvoFY", title: "Education and lifelong learning: Reading and vocabulary" },
  { fileId: "1YPHx3GnHswDnLDOcStwqkpnwlz8W4UXqf5TYTR5eKI8", title: "Education and lifelong learning: Grammar and sentence control" },
  { fileId: "1fBDjaSyhGsA4HgNWZ1DoagZupacCgEslfddICSIXBR4", title: "Education and lifelong learning: Listening and note completion" },
  { fileId: "1jiHasfXEwFeAH-B4DmlB2wJ5e0CqAS1MEudlCdKzrZs", title: "Education and lifelong learning: Speaking development" },
  { fileId: "1ked7mUYczFiMg8D1bUdlhmFPYCZUo6WkatT2QRbr4t8", title: "Education and lifelong learning: Academic Writing Task 1" },
  { fileId: "1Phkj1kcvLGcSBxYGZOFaUA9XRO22AXXwfQ_4mnNuevI", title: "Education and lifelong learning: Academic Writing Task 2" },
  { fileId: "1bWCKlE3LIf6jXGQbmBX5sxoO1qkTe9sMXU0GlIOaFQk", title: "Urban life and transport: Reading and vocabulary" },
  { fileId: "1k3BBk48HJfDgjEwoUR76AzYBnwqwWxK-gqUeXjRDSn0", title: "Urban life and transport: Grammar and sentence control" },
  { fileId: "1tH_lh1TBJTfr4KnWoSZHrxDNSNaCd12j9DBhxUJ7kxo", title: "Urban life and transport: Listening and note completion" },
  { fileId: "15TyUz2Rv1GEteP67nZV2Pxh2HdCoD2WAUNqp-sepOQM", title: "Urban life and transport: Speaking development" },
  { fileId: "1n-m3tb6c1d_IiDS1J3r1q_svgq8Jo_e-T8JVLxYfUzU", title: "Urban life and transport: Academic Writing Task 1" },
  { fileId: "1z4EoW5-WpCaB1y8rfRj0XfP1RKfhRftN7PbR8n4uyxw", title: "Urban life and transport: Academic Writing Task 2" },
  { fileId: "1oEHCgzh9VfB98HfYd_gdZ-wrq1ZOMB9RPvtyy_F62Hw", title: "Progress review 1" },
  { fileId: "1T8IKdz66aa2oD9T4IuYjJ-ReP2nVW92NHQGvebp05YU", title: "Work and technology: Reading and vocabulary" },
  { fileId: "12SMnKd7QcVwxrsLq4vAlL_vIU0xKlAnQf74Pu2b1wCE", title: "Work and technology: Grammar and sentence control" },
  { fileId: "1TbU8tqsVwUGeRJ0vG4XzBoHdgUHx3cmLS62Fzbc9-c4", title: "Work and technology: Listening and note completion" },
  { fileId: "1CNmIVGtNmF7KYIEo5JhcWaHJxaL8SpGXbmFlFaCdGw0", title: "Work and technology: Speaking development" },
  { fileId: "1xBJ_9jm6a920CIPam2SMgyhRRXPhKWihMRsK_euFN5c", title: "Work and technology: Academic Writing Task 1" },
  { fileId: "1Hst4I7ccTWlkXl_zQQGwQXOhMnQWNIo8rnSWquGjNiA", title: "Work and technology: Academic Writing Task 2" },
  { fileId: "1Y5JemVY5AdT7LCE-EKNnHxQ8YL8ched6Mxjzo5DKKlY", title: "Health and everyday lifestyles: Reading and vocabulary" },
  { fileId: "1-Nvw1I67650iGHzKH1IOm33CFyyZI1YusE_jTPEfWcg", title: "Health and everyday lifestyles: Grammar and sentence control" },
  { fileId: "18R-wo7OEvpJNtcmcQ0ZhzXwoSpkm-7J5YkHNE_xydLE", title: "Health and everyday lifestyles: Listening and note completion" },
  { fileId: "1fZ4U_3pArwevRCvsBOJQFqW3dXBrk0xcHcOuovjxSds", title: "Health and everyday lifestyles: Speaking development" },
  { fileId: "11cFUx-0eLKQ9UmXxqJetDU1OUrxf0YhPqEGP-dCzzS0", title: "Health and everyday lifestyles: Academic Writing Task 1" },
  { fileId: "1FPi4QfpVXEcU51WnKFen-JZ27dF1ubOOaXEqeOVDanc", title: "Health and everyday lifestyles: Academic Writing Task 2" },
  { fileId: "1WAIK0QeTREghzSPIJwwySyJiqiMaYt8G3hphiLCHXFM", title: "Progress review 2" },
  { fileId: "1Yg45b6-9-oo1x2KgmJmiwjF9jzqE0JYxk0fUSWPYQxE", title: "Environment and resources: Reading and vocabulary" },
  { fileId: "1X7paSKCL4J5VY3dpC1hQfNZr4zRk2irQ4Vq7aiQJ85c", title: "Environment and resources: Grammar and sentence control" },
  { fileId: "1KaMnCSY0XSt_qO88TVCin4HmGs8a2hDx_2CZRoOeyyw", title: "Environment and resources: Listening and note completion" },
  { fileId: "1bDcdSGD3hOGTspgXMjITwMbpt3IrA2XSzsWUq-v6VKY", title: "Environment and resources: Speaking development" },
  { fileId: "15PQISNHQbFfazCfLVgMY4jf7X_qszo_8jdNMuXTodnY", title: "Environment and resources: Academic Writing Task 1" },
  { fileId: "1tVez_4T2IIjmhh_hREBr39AWIDrOsUYcj7aNyiXzCxw", title: "Environment and resources: Academic Writing Task 2" },
  { fileId: "17ybphG9aEReCm-coflRHQKrQ96hcV0uW-uhk1SiVE1o", title: "Media and cultural life: Reading and vocabulary" },
  { fileId: "19B6xinhWi7JLXkuvdCguKJPakY6RHpIHtjR2B3DKwfw", title: "Media and cultural life: Grammar and sentence control" },
  { fileId: "1lKHfsa-xlOzFXRgorfoGpPORcIXpCeVq7xB8sCwqos8", title: "Media and cultural life: Listening and note completion" },
  { fileId: "1IKeIWzCVgtsgut1yyTA1ZgxlvP269fhiJD0eQiZkCGw", title: "Media and cultural life: Speaking development" },
  { fileId: "1tHTVigU9Ci1gRnftJUZjoBUPnOL5T9IUk6lWyd1nBYk", title: "Media and cultural life: Academic Writing Task 1" },
  { fileId: "19BTmYPuzNA3omQNjEnKVs-7-XMzWmoH07Gwy4QUuBRU", title: "Media and cultural life: Academic Writing Task 2" },
  { fileId: "1HT7lG7gASeBWXPmqW5xJfboH8F12Fc5OqQ1FbyOshJo", title: "Progress review 3" },
  { fileId: "1I55ZtUT7DqQawGq02t8FGNgMr2Ob6FYC7p_RnukoOo4", title: "Science and innovation: Reading and vocabulary" },
  { fileId: "1C7R3BB1epiuqoO-J_Y4ppu1JImlqMoch9xZwCRJeU4o", title: "Science and innovation: Grammar and sentence control" },
  { fileId: "1tCsdGN4ubPLETq8xiY3ASB7JwTLDnGCc1mZFfQFObkM", title: "Science and innovation: Listening and note completion" },
  { fileId: "179y7d1vq9wiWS0Vy9Pnsdsv8iBMXU4v3__xOLe2Lf-U", title: "Science and innovation: Speaking development" },
  { fileId: "1L2RiHallln6pair5xSU18cx_ln53SZsfWSKLfDvYo6g", title: "Science and innovation: Academic Writing Task 1" },
  { fileId: "1VwhpQhmN8SGTqNcQLFNvBdeSWGdHP03lWDCoUIt-Hlo", title: "Science and innovation: Academic Writing Task 2" },
  { fileId: "1wKUyguosqDvk6TryvUIhScp5raHEJmd4RontLG92tQE", title: "Society and global connections: Reading and vocabulary" },
  { fileId: "1eMHnbtAjRV3FmUsS8fJlrBXNdKJRV2louB33laow_v4", title: "Society and global connections: Grammar and sentence control" },
  { fileId: "1onNo-aQh5a1L7QUvU0m1vJV6SCP5f4Szf1-1cYlsibY", title: "Society and global connections: Listening and note completion" },
  { fileId: "1Tq5ExUJPtmiyKnTqnd2_9QAr8Sw6J12D1U1R63cAOic", title: "Society and global connections: Speaking development" },
  { fileId: "13uiAfJGBzgCLnQ6QreRETa1pJ--VHfYHnqRMn8GMLbA", title: "Society and global connections: Academic Writing Task 1" },
  { fileId: "1CwEwrnjTYJhlEYfzNbCdm9TM9GI67ovQ2zpFanoDelA", title: "Society and global connections: Academic Writing Task 2" },
  { fileId: "1eAmmlcDJP_rmhSv35EXlcLU65W1XovPoa2FUdixNuyg", title: "Progress review 4" },
  { fileId: "1ovEGsOC1R-eK_DZSKtgmQDKg-c-81yh87oUXRnlfy4Y", title: "Mock assessment A: Listening and Reading" },
  { fileId: "17-zAW_cuLMssWTtpQbnKWGj6JVCnaYBtKbSVy7AaK4E", title: "Writing mock assessment and feedback" },
  { fileId: "1YzGw7Tzeq2_V-A1ny6rt1sKTuSrABwtAXn_mPcah2cg", title: "Speaking mock interviews" },
  { fileId: "1hKSJ7D-xjeJl2zdnv6xoLGHAlDyJe6oHdcfIiP5iauE", title: "Accuracy clinic and paraphrase" },
  { fileId: "1JhmSRG5oXrl46ieXyFnzhqo44RJHU0tYV_wJ0SHYFT0", title: "Mock assessment B: Listening and Reading" },
  { fileId: "12xosRwxYHC8tfn_QxZ5OBD0N4rNNpXheq-1Y4azgXEI", title: "Exit writing and learning portfolio" },
];

function deckSlug(prefix: string, n: number, title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${String(n).padStart(2, "0")}-${words}`;
}

const SLIDE_GRAMMAR_TOPICS: TopicLesson[] = [
  ...SLIDE_GRAMMAR_DECKS.map((deck, i) =>
    topic({
      slug: deck.slug,
      track: "grammar",
      course: "basic",
      order: i + 1,
      title: loc(deck.vi, deck.en),
      summary: loc(`${deck.label} – ${deck.vi}`, `${deck.label} – ${deck.en}`),
      videoUrl: "",
      slidesUrl: googleSlidesEmbed(deck.fileId),
      theoryHtml: loc("", ""),
      exercises: [],
    }),
  ),
  // Orders 101+ keep the two courses apart; each course is ordered on its own.
  ...IELTS_34_DECKS.map((deck) =>
    topic({
      slug: deck.slug,
      track: "grammar",
      course: "ielts-3-4",
      order: 100 + deck.n,
      title: loc(deck.title, deck.title),
      summary: loc(`IELTS 3.0–4.0 · Bài ${deck.n}`, `IELTS 3.0–4.0 · Lesson ${deck.n}`),
      videoUrl: "",
      slidesUrl: googleSlidesEmbed(deck.fileId),
      theoryHtml: loc("", ""),
      exercises: [],
    }),
  ),
  ...IELTS_45_DECKS.map((deck, i) =>
    topic({
      slug: deckSlug("ielts45", i + 1, deck.title),
      track: "grammar",
      course: "ielts-4-5",
      order: 200 + i + 1,
      title: loc(deck.title, deck.title),
      summary: loc(`IELTS 4.0–5.0 · Bài ${i + 1}`, `IELTS 4.0–5.0 · Lesson ${i + 1}`),
      videoUrl: "",
      slidesUrl: googleSlidesEmbed(deck.fileId),
      theoryHtml: loc("", ""),
      exercises: [],
    }),
  ),
  ...IELTS_56_DECKS.map((deck, i) =>
    topic({
      slug: deckSlug("ielts56", i + 1, deck.title),
      track: "grammar",
      course: "ielts-5-6",
      order: 300 + i + 1,
      title: loc(deck.title, deck.title),
      summary: loc(`IELTS 5.0–6.0 · Bài ${i + 1}`, `IELTS 5.0–6.0 · Lesson ${i + 1}`),
      videoUrl: "",
      slidesUrl: googleSlidesEmbed(deck.fileId),
      theoryHtml: loc("", ""),
      exercises: [],
    }),
  ),
];

const GRAMMAR_TOPICS = SHOW_LEGACY_GRAMMAR ? LEGACY_GRAMMAR_TOPICS : SLIDE_GRAMMAR_TOPICS;

const VOCABULARY_TOPICS: TopicLesson[] = cambridgeVocabUnits.topics.map((unit) =>
  topic(
    {
      slug: unit.slug,
      track: "vocabulary",
      order: unit.order,
      title: loc(unit.title.vi, unit.title.en),
      summary: loc(unit.summary.vi, unit.summary.en),
      videoUrl: "",
      theoryHtml: loc(
        `<p>Học ${unit.words.length} từ vựng Cambridge Vocabulary for IELTS qua thẻ từ — phát âm, nghĩa và ví dụ.</p>`,
        `<p>Learn ${unit.words.length} Cambridge Vocabulary for IELTS items via flashcards — pronunciation, meaning, and examples.</p>`,
      ),
      words: unit.words as VocabWord[],
      exercises: [],
    },
    false,
  ),
);

const TOPIC_VOCABULARY: TopicLesson[] = flyerVocabTopics.topics.map((unit) =>
  topic(
    {
      slug: unit.slug,
      track: "vocabulary",
      collection: "topics",
      order: unit.order,
      title: loc(unit.title.vi, unit.title.en),
      summary: loc(unit.summary.vi, unit.summary.en),
      videoUrl: "",
      theoryHtml: loc(
        `<p>Học ${unit.words.length} từ vựng IELTS thông dụng chủ đề ${unit.summary.vi} qua flashcard.</p>`,
        `<p>Learn ${unit.words.length} common IELTS words about ${unit.title.en} with flashcards.</p>`,
      ),
      words: unit.words as VocabWord[],
      exercises: [],
    },
    false,
  ),
);

export const SEED_VOCAB_GRAMMAR: VocabGrammarCatalog = {
  grammar: GRAMMAR_TOPICS,
  vocabulary: [...VOCABULARY_TOPICS, ...TOPIC_VOCABULARY],
};
