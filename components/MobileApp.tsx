"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Activity, ActivityInput, ActivityStatus, Armario, TipoAtividade, User } from "@/lib/types";
import { formatActivityNumber, formatDateTime } from "@/lib/format";
import Avatar from "./Avatar";
import Timer from "./Timer";
import ComboSelect from "./ComboSelect";
import ConclusionModal, { type ConclusionChoice } from "./ConclusionModal";

type Tab = "andamento" | "historico";

const STATUS_OPTIONS: { value: ActivityStatus; label: string }[] = [
  { value: "aguardando", label: "Aguardando tratativa" },
  { value: "execucao", label: "Em execução" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const STATUS_BADGE: Record<ActivityStatus, string> = {
  aguardando: "bg-violet-50 text-vivo-purple",
  execucao: "bg-blue-50 text-blue-600",
  concluida: "bg-emerald-50 text-emerald-600",
  cancelada: "bg-red-50 text-red-600",
  excluida: "bg-gray-100 text-gray-600",
};

export default function MobileApp({ user }: { user: User }) {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("andamento");
  const [creating, setCreating] = useState(false);
  const [concluding, setConcluding] = useState<Activity | null>(null);
  const [armarios, setArmarios] = useState<Armario[]>([]);
  const [tipos, setTipos] = useState<TipoAtividade[]>([]);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);

  const load = async () => {
    const res = await fetch("/api/activities?mine=1");
    const serverDate = res.headers.get("date");
    if (serverDate) {
      const t = new Date(serverDate).getTime();
      if (!Number.isNaN(t)) setClockOffsetMs(t - Date.now());
    }
    if (res.ok) setActivities(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
    (async () => {
      const [aRes, tRes] = await Promise.all([fetch("/api/armarios"), fetch("/api/tipos-atividade")]);
      if (aRes.ok) setArmarios(await aRes.json());
      if (tRes.ok) setTipos(await tRes.json());
    })();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const patch = async (id: number, body: Record<string, unknown>) => {
    const res = await fetch(`/api/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleStatusChange = (a: Activity, status: ActivityStatus) => {
    if (status === a.status) return;
    if (status === "concluida" || status === "cancelada") {
      setConcluding(a);
      return;
    }
    patch(a.id, { status });
  };

  const handleConclude = async (choice: ConclusionChoice, motivo: string) => {
    if (!concluding) return;
    const body: Record<string, unknown> =
      choice === "cancelada"
        ? { status: "cancelada", motivo }
        : { status: "concluida", conclusao: choice, motivo };
    await patch(concluding.id, body);
    setConcluding(null);
  };

  const handleCreate = async (data: ActivityInput) => {
    const res = await fetch("/api/activities?mine=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao cadastrar.");
    }
    const created = await res.json();
    setActivities((prev) => [created, ...prev]);
    setTab(created.status === "aguardando" || created.status === "execucao" ? "andamento" : "historico");
    setCreating(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isOpen = (a: Activity) => a.status === "aguardando" || a.status === "execucao";
  const list = activities.filter((a) => (tab === "andamento" ? isOpen(a) : !isOpen(a)));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-[#4A1F6F] to-[#6B2FA5] text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <Avatar id={user.avatar} size={36} ring />
        <div className="leading-tight min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{user.nome}</p>
          <p className="text-[11px] text-white/70 truncate">
            Mat. {user.matricula} &middot; {user.regional}
          </p>
        </div>
        <button onClick={handleLogout} className="text-xs bg-white/15 rounded-lg px-3 py-1.5">
          Sair
        </button>
      </header>

      <div className="grid grid-cols-2 bg-white border-b border-gray-100 sticky top-[60px] z-20">
        <TabButton active={tab === "andamento"} onClick={() => setTab("andamento")}>
          Em andamento ({activities.filter(isOpen).length})
        </TabButton>
        <TabButton active={tab === "historico"} onClick={() => setTab("historico")}>
          Histórico ({activities.filter((a) => !isOpen(a)).length})
        </TabButton>
      </div>

      <main className="flex-1 px-4 py-4 pb-24 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            {tab === "andamento" ? "Nenhum serviço em andamento." : "Nenhum serviço no histórico."}
          </p>
        ) : (
          list.map((a) => (
            <ServiceCard
              key={a.id}
              activity={a}
              clockOffsetMs={clockOffsetMs}
              onStatusChange={(s) => handleStatusChange(a, s)}
            />
          ))
        )}
      </main>

      <button
        onClick={() => setCreating(true)}
        className="fixed bottom-5 right-4 z-30 bg-vivo-purple text-white font-medium text-sm rounded-full shadow-lg px-5 py-3.5"
      >
        + Novo serviço
      </button>

      {creating && (
        <NewServiceSheet
          user={user}
          armarios={armarios}
          tipos={tipos}
          onClose={() => setCreating(false)}
          onSave={handleCreate}
        />
      )}

      {concluding && (
        <ConclusionModal activity={concluding} onClose={() => setConcluding(null)} onConfirm={handleConclude} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 text-sm font-medium border-b-2 ${
        active ? "border-vivo-purple text-vivo-purple" : "border-transparent text-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

function ServiceCard({
  activity: a,
  clockOffsetMs,
  onStatusChange,
}: {
  activity: Activity;
  clockOffsetMs: number;
  onStatusChange: (s: ActivityStatus) => void;
}) {
  const parcial = a.status === "concluida" && a.conclusao === "parcial";
  return (
    <div className="bg-white rounded-xl shadow-card p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-vivo-purple">{formatActivityNumber(a.id, a.sigla)}</span>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            parcial ? "bg-amber-50 text-amber-600" : STATUS_BADGE[a.status]
          }`}
        >
          {parcial ? "Concluída parcialmente" : STATUS_OPTIONS.find((o) => o.value === a.status)?.label ?? "Excluída"}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800">{a.atividade}</p>
      <p className="text-xs text-gray-500">
        Armário: {a.nome_armario}
        {a.numero_evento ? ` · Evento: ${a.numero_evento}` : ""}
      </p>
      {a.descricao && <p className="text-xs text-gray-600 whitespace-pre-wrap">{a.descricao}</p>}
      {a.motivo && <p className="text-xs text-gray-500 italic">Motivo: {a.motivo}</p>}
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>{formatDateTime(a.data_criacao)}</span>
        <span>
          Tempo:{" "}
          <Timer
            startedAt={a.started_at}
            baseSeconds={a.tempo_execucao_segundos}
            running={a.status === "execucao"}
            clockOffsetMs={clockOffsetMs}
          />
        </span>
      </div>
      {a.status !== "excluida" && (
        <select
          value={a.status}
          onChange={(e) => onStatusChange(e.target.value as ActivityStatus)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
          aria-label="Atualizar status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function NewServiceSheet({
  user,
  armarios,
  tipos,
  onClose,
  onSave,
}: {
  user: User;
  armarios: Armario[];
  tipos: TipoAtividade[];
  onClose: () => void;
  onSave: (data: ActivityInput) => Promise<void>;
}) {
  const [form, setForm] = useState({
    numero_evento: "",
    atividade: "",
    nome_armario: "",
    descricao: "",
    status: "aguardando" as ActivityStatus,
    conclusao: "total" as "total" | "parcial",
    motivo: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const askMotivo = form.status === "cancelada" || (form.status === "concluida" && form.conclusao === "parcial");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        numero_evento: form.numero_evento,
        atividade: form.atividade,
        nome_armario: form.nome_armario,
        descricao: form.descricao,
        nome_tecnico: user.nome,
        status: form.status,
        conclusao: form.status === "concluida" ? form.conclusao : null,
        motivo: askMotivo ? form.motivo : "",
      });
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar.");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-vivo-purple bg-white";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <form onSubmit={submit} className="bg-white w-full rounded-t-2xl p-4 max-h-[92vh] overflow-y-auto space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-vivo-purpleDark">Novo serviço</h3>
          <button type="button" onClick={onClose} className="text-gray-400 text-2xl leading-none">
            &times;
          </button>
        </div>

        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          Técnico: <b>{user.nome}</b> (Mat. {user.matricula})
        </p>

        <Field label="Número do evento">
          <input value={form.numero_evento} onChange={set("numero_evento")} className={input} placeholder="Ex: EV-1023" />
        </Field>
        <Field label="Atividade">
          <ComboSelect
            required
            value={form.atividade}
            onChange={(v) => setForm((f) => ({ ...f, atividade: v }))}
            options={tipos.map((t) => ({ value: t.nome, label: t.nome }))}
            placeholder={tipos.length ? "Selecione a atividade" : "Nenhuma atividade cadastrada"}
            className={input}
          />
        </Field>
        <Field label="Nome do armário">
          <ComboSelect
            required
            value={form.nome_armario}
            onChange={(v) => setForm((f) => ({ ...f, nome_armario: v }))}
            options={armarios.map((a) => ({ value: a.nome, label: a.nome }))}
            placeholder={armarios.length ? "Selecione o armário" : "Nenhum armário cadastrado"}
            className={input}
          />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set("status")} className={input}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        {form.status === "concluida" && (
          <Field label="Tipo de conclusão">
            <select value={form.conclusao} onChange={set("conclusao")} className={input}>
              <option value="total">Totalmente concluída</option>
              <option value="parcial">Concluída parcialmente</option>
            </select>
          </Field>
        )}
        {askMotivo && (
          <Field label="Ofensor / motivo da não conclusão">
            <textarea value={form.motivo} onChange={set("motivo")} className={`${input} min-h-[70px] resize-none`} />
          </Field>
        )}
        <Field label="Descrição">
          <textarea
            value={form.descricao}
            onChange={set("descricao")}
            className={`${input} min-h-[80px] resize-none`}
            placeholder="Detalhes do serviço..."
          />
        </Field>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-vivo-purple text-white font-medium text-sm rounded-lg py-3 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Cadastrar serviço"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
