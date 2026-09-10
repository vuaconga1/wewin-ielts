import { parseKeysDocument, normalizeAnswerToken } from "../src/lib/import/parse-keys";

const listening = `STT	Đáp án	STT	Đáp án
1	Bittens	21	A
2	group	22	A
3	23	23	C
4	12.50	24	C
5	back	25	B
6	wheelchair	26	C
7	lift	27	C
8	library	28	A
9	vegetarian	29	F
10	pizza	30	G
11	A	31	company
12	B	32	original
13	C	33	description
14	A	34	engineering
15	B	35	communication
16	C	36	language
17	A	37	salary
18	B	38	lonley
19	C	39	industrial
20	A	40	government`;

const reading = `STT	Đáp án	STT	Đáp án
1	F	21	D
2	NGV	22	B
3	T	23	one-sixth
4	F	24	16th century
5	F	25	Mercator
6	T	26	John Gould
7	1906	27	K
8	Australia	28	G
9	family	29	D
10	bankruptcy	30	C
11	writers	31	J
12	reputation	32	B
13	husband	33	B
14	I	34	C
15	F	35	D
16	G	36	C
17	D	37	B
18	C	38	NGV
19	H	39	NGV
20	C	40	YES`;

for (const [name, text, skill] of [
  ["Listening", listening, "LISTENING"],
  ["Reading", reading, "READING"],
] as const) {
  const map = parseKeysDocument(text, { skill });
  console.log(`\n=== ${name} keys: ${map.size} entries ===`);
  for (let i = 1; i <= 40; i++) {
    const v = map.get(i);
    console.log(`Q${i}: ${v ? JSON.stringify(v.answer) : "MISSING"}`);
  }
}

console.log("\nNormalize:", normalizeAnswerToken("NGV"), normalizeAnswerToken("T"));
