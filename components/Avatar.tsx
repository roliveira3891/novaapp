import { getAvatar } from "@/lib/avatars";

export default function Avatar({
  id,
  size = 32,
  ring,
}: {
  id: string;
  size?: number;
  ring?: boolean;
}) {
  const avatar = getAvatar(id);
  return (
    <div
      style={{ width: size, height: size, backgroundColor: avatar.bg, fontSize: size * 0.55 }}
      className={`rounded-full flex items-center justify-center shrink-0 ${
        ring ? "ring-2 ring-white/40" : ""
      }`}
    >
      <span style={{ lineHeight: 1 }}>{avatar.emoji}</span>
    </div>
  );
}
