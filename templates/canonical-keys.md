# Canonical answer keys — Key 9 format (WEWIN default)

Use this layout for `Key N.docx` / `Key N.md` so Listening + Reading import
auto-merge answers. One file may contain both skills.

```
Listening

Section 1
1. answer
2. answer
…
10. answer

Section 2
11. answer
…
20. answer

Section 3
21. A
…
30. D

Section 4
31. traffic flows
…
40. B

Reading

Passage 1
1. FALSE
2. TRUE
…
13. money

Passage 2
14. visual memory
…
26. D

Passage 3
27. YES
…
40. B
```

Rules:
- Typed text or a real Word table (not a screenshot).
- Each answer: `N. answer` (period/colon/paren OK).
- Reading TFNG: `TRUE` / `FALSE` / `NOT GIVEN` (also accepts `T` / `F` / `NGV`).
- Listening matching: letter `A`–`G` as needed.
- Optional `Section 1–4` / `Passage 1–3` labels (ignored by parser, kept for humans).

Other layouts (STT|Đáp án sheets, alternating number/answer lines) are
auto-normalized to this shape on import. Screenshot-only keys cannot be read.
