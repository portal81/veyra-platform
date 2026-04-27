const MOJIBAKE_PATTERN = /[ØÙÐÑÃï�]/;
const ARABIC_PATTERN = /[\u0600-\u06FF]/;
const SAFE_TEXT_PATTERN = /[\w\s.,:;!?@#%&()\-_/+[\]{}"'`~|]/;

function scoreText(value: string) {
  let score = 0;

  for (const char of value) {
    if (ARABIC_PATTERN.test(char)) {
      score += 3;
      continue;
    }

    if (SAFE_TEXT_PATTERN.test(char)) {
      score += 1;
      continue;
    }

    if (char === "ï" || char === "�") {
      score -= 5;
      continue;
    }

    if ("ØÙÐÑÃï�".includes(char)) {
      score -= 2;
    }
  }

  return score;
}

function repairString(value: string) {
  if (!MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    let current = value;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const next = Buffer.from(current, "latin1").toString("utf8");
      if (!next || next === current) {
        break;
      }
      current = next;
      if (!MOJIBAKE_PATTERN.test(current)) {
        break;
      }
    }

    return scoreText(current) > scoreText(value) ? current : value;
  } catch {
    return value;
  }
}

export function repairTextDeep<T>(value: T): T {
  if (typeof value === "string") {
    return repairString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairTextDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const repaired = Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (accumulator, [key, entry]) => {
        accumulator[key] = repairTextDeep(entry);
        return accumulator;
      },
      {},
    );

    return repaired as T;
  }

  return value;
}
