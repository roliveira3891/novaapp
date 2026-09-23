"use client";

import { AVATAR_OPTIONS } from "@/lib/avatars";
import Avatar from "./Avatar";

export default function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {AVATAR_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          title={opt.name}
          className="flex flex-col items-center gap-1 group"
        >
          <span
            className={`rounded-full p-0.5 transition-all ${
              value === opt.id
                ? "ring-2 ring-vivo-purple ring-offset-2"
                : "ring-1 ring-transparent group-hover:ring-2 group-hover:ring-gray-200"
            }`}
          >
            <Avatar id={opt.id} size={44} />
          </span>
          <span
            className={`text-[11px] truncate max-w-[64px] ${
              value === opt.id ? "text-vivo-purple font-semibold" : "text-gray-500"
            }`}
          >
            {opt.name}
          </span>
        </button>
      ))}
    </div>
  );
}
