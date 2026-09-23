const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Gera uma sigla de 3 letras a partir do nome, evitando colisão com as siglas já usadas. */
export function generateSigla(nome: string, taken: Set<string>): string {
  const clean = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, " ")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const joined = words.join("");

  const candidates: string[] = [];
  if (words.length >= 3) candidates.push(words[0][0] + words[1][0] + words[2][0]);
  if (words.length === 2) {
    candidates.push(words[0][0] + words[1].slice(0, 2));
    candidates.push(words[0].slice(0, 2) + words[1][0]);
  }
  if (words[0] && words[0].length >= 3) candidates.push(words[0].slice(0, 3));
  for (let i = 0; i + 3 <= joined.length && i < 12; i++) candidates.push(joined.slice(i, i + 3));

  for (const c of candidates) {
    if (c.length === 3 && !taken.has(c)) return c;
  }

  for (const a of LETTERS) {
    for (const b of LETTERS) {
      for (const c of LETTERS) {
        const candidate = a + b + c;
        if (!taken.has(candidate)) return candidate;
      }
    }
  }
  throw new Error("Não foi possível gerar uma sigla única (esgotadas as combinações de 3 letras).");
}
