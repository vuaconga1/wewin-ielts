import type { LearnExercise } from "@/lib/learn/types";
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
  return {
    ...partial,
    id,
    stub,
    words: partial.words,
    exercises:
      partial.exercises ??
      stubExercises(
        id,
        partial.title.vi,
        partial.title.en,
      ),
  };
}

function word(w: VocabWord): VocabWord {
  return w;
}

/** Academic Word List basics — flashcard seed (first topic). */
const AWL_BASIC_WORDS: VocabWord[] = [
  word({
    word: "accountant",
    pos: "n",
    ipa: "/əˈkaʊn.tənt/",
    meaningVi: "một người chịu trách nhiệm về tiền trong một doanh nghiệp, kế toán",
    definitionEn: "a person responsible for the money in a business",
    exampleEn: "My [accountant] takes care of my taxes.",
    exampleVi: "Kế toán của tôi lo liệu thuế của tôi",
  }),
  word({
    word: "analyse",
    pos: "v",
    ipa: "/ˈæn.əl.aɪz/",
    meaningVi: "phân tích, xem xét chi tiết",
    definitionEn: "to examine something in detail in order to understand it",
    exampleEn: "Researchers [analyse] the data before drawing conclusions.",
    exampleVi: "Các nhà nghiên cứu phân tích dữ liệu trước khi đưa ra kết luận",
  }),
  word({
    word: "approach",
    pos: "n",
    ipa: "/əˈprəʊtʃ/",
    meaningVi: "cách tiếp cận, phương pháp",
    definitionEn: "a way of dealing with a situation or problem",
    exampleEn: "A collaborative [approach] often leads to better results.",
    exampleVi: "Cách tiếp cận hợp tác thường mang lại kết quả tốt hơn",
  }),
  word({
    word: "assess",
    pos: "v",
    ipa: "/əˈses/",
    meaningVi: "đánh giá, ước lượng",
    definitionEn: "to judge or decide the amount, value, or quality of something",
    exampleEn: "Teachers [assess] students through exams and coursework.",
    exampleVi: "Giáo viên đánh giá học sinh qua bài thi và bài tập",
  }),
  word({
    word: "benefit",
    pos: "n",
    ipa: "/ˈben.ɪ.fɪt/",
    meaningVi: "lợi ích, quyền lợi",
    definitionEn: "an advantage or useful result of something",
    exampleEn: "Regular exercise has many health [benefits].",
    exampleVi: "Tập thể dục đều đặn mang lại nhiều lợi ích sức khỏe",
  }),
  word({
    word: "concept",
    pos: "n",
    ipa: "/ˈkɒn.sept/",
    meaningVi: "khái niệm, ý niệm",
    definitionEn: "an idea or principle",
    exampleEn: "The [concept] of sustainability is central to the essay.",
    exampleVi: "Khái niệm bền vững là trọng tâm của bài luận",
  }),
  word({
    word: "consist",
    pos: "v",
    ipa: "/kənˈsɪst/",
    meaningVi: "bao gồm, cấu thành từ",
    definitionEn: "to be made of or formed from something",
    exampleEn: "The course [consists] of lectures and practical workshops.",
    exampleVi: "Khóa học bao gồm các buổi giảng và workshop thực hành",
  }),
  word({
    word: "create",
    pos: "v",
    ipa: "/kriˈeɪt/",
    meaningVi: "tạo ra, sáng tạo",
    definitionEn: "to make something new or invent something",
    exampleEn: "Designers [create] solutions that meet users’ needs.",
    exampleVi: "Các nhà thiết kế tạo ra giải pháp đáp ứng nhu cầu người dùng",
  }),
  word({
    word: "data",
    pos: "n",
    ipa: "/ˈdeɪ.tə/",
    meaningVi: "dữ liệu, số liệu",
    definitionEn: "facts or statistics used for reference or analysis",
    exampleEn: "The chart presents [data] from the last decade.",
    exampleVi: "Biểu đồ trình bày dữ liệu từ thập kỷ vừa qua",
  }),
  word({
    word: "define",
    pos: "v",
    ipa: "/dɪˈfaɪn/",
    meaningVi: "định nghĩa, xác định rõ",
    definitionEn: "to explain the exact meaning of a word or idea",
    exampleEn: "It is important to [define] key terms in academic writing.",
    exampleVi: "Việc định nghĩa các thuật ngữ chính trong viết học thuật rất quan trọng",
  }),
  word({
    word: "environment",
    pos: "n",
    ipa: "/ɪnˈvaɪ.rən.mənt/",
    meaningVi: "môi trường",
    definitionEn: "the natural world or the conditions in which people live",
    exampleEn: "Protecting the [environment] requires global cooperation.",
    exampleVi: "Bảo vệ môi trường đòi hỏi sự hợp tác toàn cầu",
  }),
  word({
    word: "factor",
    pos: "n",
    ipa: "/ˈfæk.tə/",
    meaningVi: "yếu tố, nhân tố",
    definitionEn: "one of several things that influence a result",
    exampleEn: "Cost is a major [factor] in students’ decisions.",
    exampleVi: "Chi phí là một yếu tố lớn trong quyết định của sinh viên",
  }),
];

function stubWords(topicEn: string): VocabWord[] {
  return [
    word({
      word: "example",
      pos: "n",
      ipa: "/ɪɡˈzɑːm.pəl/",
      meaningVi: "ví dụ (nội dung đang cập nhật)",
      definitionEn: `Sample word for ${topicEn}`,
      exampleEn: "This is an [example] sentence.",
      exampleVi: "Đây là một câu ví dụ",
    }),
    word({
      word: "practice",
      pos: "n",
      ipa: "/ˈpræk.tɪs/",
      meaningVi: "luyện tập (nội dung đang cập nhật)",
      definitionEn: "the act of doing something regularly to improve",
      exampleEn: "Daily [practice] improves fluency.",
      exampleVi: "Luyện tập hàng ngày giúp cải thiện độ trôi chảy",
    }),
  ];
}

function awlExercises(): LearnExercise[] {
  const id = "vocab-academic-basics";
  return [
    mcq(`${id}-q1`, "“Accountant” nghĩa là:", "“Accountant” means:", ["Kế toán", "Luật sư", "Bác sĩ", "Giáo viên"], 0),
    mcq(`${id}-q2`, "“Analyse” là từ loại:", "“Analyse” is a:", ["Noun", "Verb", "Adjective", "Adverb"], 1),
    mcq(`${id}-q3`, "“Benefit” gần nghĩa với:", "“Benefit” is closest to:", ["Advantage", "Problem", "Delay", "Noise"], 0),
    mcq(`${id}-q4`, "“Environment” liên quan đến:", "“Environment” relates to:", ["Natural world", "Only maths", "Furniture", "Punctuation"], 0),
    mcq(`${id}-q5`, "“Assess” nghĩa là:", "“Assess” means:", ["Evaluate", "Ignore", "Hide", "Sing"], 0),
    mcq(`${id}-q6`, "“Concept” là:", "A “concept” is:", ["An idea", "A tool only", "A colour", "A number only"], 0),
    mcq(`${id}-q7`, "The course ___ of lectures.", "The course ___ of lectures.", ["consist", "consists", "consisting", "consisted"], 1),
    mcq(`${id}-q8`, "“Data” thường dùng trong:", "“Data” is often used in:", ["Research/reports", "Cooking only", "Sports scores only", "Fashion"], 0),
    mcq(`${id}-q9`, "“Define” nghĩa là:", "“Define” means:", ["Explain the meaning", "Delete", "Borrow", "Travel"], 0),
    mcq(`${id}-q10`, "Cost is a major ___.", "Cost is a major ___.", ["factor", "accountant", "analyse", "create"], 0),
  ];
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

const GRAMMAR_TOPICS: TopicLesson[] = [
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

const VOCABULARY_TOPICS: TopicLesson[] = [
  topic(
    {
      slug: "academic-basics",
      track: "vocabulary",
      order: 1,
      title: loc("Academic Word List cơ bản", "Academic Word List basics"),
      summary: loc(
        "Nhóm từ học thuật thường gặp band 6–7.",
        "Core AWL words for band 6–7.",
      ),
      videoUrl: "",
      theoryHtml: loc(
        "<p>Học các từ Academic Word List cơ bản qua thẻ từ — phát âm, nghĩa và ví dụ.</p>",
        "<p>Learn core Academic Word List items via flashcards — pronunciation, meaning, and examples.</p>",
      ),
      words: AWL_BASIC_WORDS,
      exercises: awlExercises(),
    },
    false,
  ),
  topic(
    {
      slug: "topic-education",
      track: "vocabulary",
      order: 2,
      title: loc("Chủ đề: Giáo dục", "Topic: Education"),
      summary: loc(
        "Từ vựng giáo dục cho Task 2 & Speaking.",
        "Education vocabulary for Task 2 & Speaking.",
      ),
      videoUrl: "",
      theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>"),
      words: stubWords("Education"),
    },
    true,
  ),
  topic(
    {
      slug: "topic-environment",
      track: "vocabulary",
      order: 3,
      title: loc("Chủ đề: Môi trường", "Topic: Environment"),
      summary: loc("Climate, pollution, sustainability.", "Climate, pollution, sustainability."),
      videoUrl: "",
      theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>"),
      words: stubWords("Environment"),
    },
    true,
  ),
  topic(
    {
      slug: "topic-health",
      track: "vocabulary",
      order: 4,
      title: loc("Chủ đề: Sức khỏe", "Topic: Health"),
      summary: loc("Healthcare, lifestyle, mental health.", "Healthcare, lifestyle, mental health."),
      videoUrl: "",
      theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>"),
      words: stubWords("Health"),
    },
    true,
  ),
  topic(
    {
      slug: "topic-technology",
      track: "vocabulary",
      order: 5,
      title: loc("Chủ đề: Công nghệ", "Topic: Technology"),
      summary: loc("Digital, AI, innovation vocabulary.", "Digital, AI, innovation vocabulary."),
      videoUrl: "",
      theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>"),
      words: stubWords("Technology"),
    },
    true,
  ),
  topic(
    {
      slug: "synonyms-paraphrase",
      track: "vocabulary",
      order: 6,
      title: loc("Từ đồng nghĩa & paraphrase", "Synonyms & paraphrasing"),
      summary: loc(
        "Tránh lặp từ trong Writing/Speaking.",
        "Avoid repetition in Writing/Speaking.",
      ),
      videoUrl: "",
      theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>"),
      words: stubWords("Synonyms & paraphrasing"),
    },
    true,
  ),
  topic(
    {
      slug: "idioms-speaking",
      track: "vocabulary",
      order: 7,
      title: loc("Thành ngữ cho Speaking", "Idioms for Speaking"),
      summary: loc("Idiom tự nhiên, không gượng ép.", "Natural idioms, not forced."),
      videoUrl: "",
      theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>"),
      words: stubWords("Idioms for Speaking"),
    },
    true,
  ),
  topic(
    {
      slug: "writing-collocations",
      track: "vocabulary",
      order: 8,
      title: loc("Collocations cho Writing", "Collocations for Writing"),
      summary: loc(
        "Cụm từ học thuật Task 1 & Task 2.",
        "Academic phrases for Task 1 & Task 2.",
      ),
      videoUrl: "",
      theoryHtml: loc("<p>Nội dung đang được cập nhật.</p>", "<p>Content coming soon.</p>"),
      words: stubWords("Collocations for Writing"),
    },
    true,
  ),
];

export const SEED_VOCAB_GRAMMAR: VocabGrammarCatalog = {
  grammar: GRAMMAR_TOPICS,
  vocabulary: VOCABULARY_TOPICS,
};
