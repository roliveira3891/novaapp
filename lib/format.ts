export function formatActivityNumber(id: number, sigla?: string | null): string {
  const prefix = sigla && sigla.length === 3 ? sigla : "#";
  return `${prefix}${String(id).padStart(4, "0")}`;
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value.replace(" ", "T"));
  if (isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}  ${hh}:${min}`;
}
