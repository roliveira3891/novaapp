export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  bg: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "a1", name: "Técnico", emoji: "👨‍🔧", bg: "#7C3AED" },
  { id: "a2", name: "Técnica", emoji: "👩‍🔧", bg: "#2563EB" },
  { id: "a3", name: "Analista", emoji: "🧑‍💻", bg: "#059669" },
  { id: "a4", name: "Engenheiro", emoji: "👷", bg: "#D97706" },
  { id: "a5", name: "Gestor", emoji: "👨‍💼", bg: "#DB2777" },
  { id: "a6", name: "Gestora", emoji: "👩‍💼", bg: "#0891B2" },
  { id: "a7", name: "Pesquisador", emoji: "🧑‍🔬", bg: "#4338CA" },
  { id: "a8", name: "Operador", emoji: "👨‍🏭", bg: "#B91C1C" },
  { id: "a9", name: "Operadora", emoji: "👩‍🏭", bg: "#15803D" },
  { id: "a10", name: "Montanha", emoji: "🏔️", bg: "#0F766E" },
  { id: "a11", name: "Robô", emoji: "🤖", bg: "#6D28D9" },
  { id: "a12", name: "Estrela", emoji: "⭐", bg: "#CA8A04" },
];

export function getAvatar(id: string): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.id === id) || AVATAR_OPTIONS[0];
}
