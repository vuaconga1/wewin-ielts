const SKILL_ORDER: Record<string, number> = {
  LISTENING: 0,
  READING: 1,
  WRITING: 2,
  SPEAKING: 3,
};

function testNumber(value: { title: string; slug?: string }): number {
  const source = `${value.title} ${value.slug ?? ""}`;
  const match = source.match(/\btest[-\s]+(\d+)\b/i);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

/** 0 for tests outside a volume series, so "Test n" comes before "Vol 1 Test n". */
function volumeNumber(value: { title: string; slug?: string }): number {
  const match = `${value.title} ${value.slug ?? ""}`.match(/\bvol[-\s]+(\d+)\b/i);
  return match ? Number(match[1]) : 0;
}

/** Sort Test 1, Test 2, ... Test 10, then Vol 1 Test 1, ...; then Listening, Reading, Writing, Speaking. */
export function compareTestsAscending(
  a: { title: string; slug?: string; skill?: string },
  b: { title: string; slug?: string; skill?: string },
): number {
  const byVolume = volumeNumber(a) - volumeNumber(b);
  if (byVolume !== 0) return byVolume;

  const byNumber = testNumber(a) - testNumber(b);
  if (byNumber !== 0) return byNumber;

  const bySkill =
    (SKILL_ORDER[a.skill ?? ""] ?? Number.MAX_SAFE_INTEGER) -
    (SKILL_ORDER[b.skill ?? ""] ?? Number.MAX_SAFE_INTEGER);
  if (bySkill !== 0) return bySkill;

  return a.title.localeCompare(b.title, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}