"use client";

export function StatsBar({
  total,
  execucao,
  concluidas,
  canceladas,
}: {
  total: number;
  execucao: number;
  concluidas: number;
  canceladas: number;
}) {
  const items = [
    { label: "Total de atividades", value: total, bg: "bg-vivo-purple", icon: <ClipboardIcon /> },
    { label: "Em execução", value: execucao, bg: "bg-blue-600", icon: <ClockIcon /> },
    { label: "Concluídas", value: concluidas, bg: "bg-emerald-600", icon: <CheckIcon /> },
    { label: "Canceladas", value: canceladas, bg: "bg-red-600", icon: <XIcon /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-2xl shadow-card px-4 py-3.5 flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center text-white shrink-0`}>
            {item.icon}
          </div>
          <div className="leading-tight">
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="text-2xl font-bold text-gray-800">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
