"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Activity, ActivityInput, ActivityStatus, Tecnico, Armario, TipoAtividade, User } from "@/lib/types";
import { formatActivityNumber } from "@/lib/format";
import Header from "./Header";
import { StatsBar } from "./StatsBar";
import { FiltersBar } from "./FiltersBar";
import KanbanColumn from "./KanbanColumn";
import ActivityModal from "./ActivityModal";
import ActivityDetailsModal from "./ActivityDetailsModal";
import HistoryTable from "./HistoryTable";
import CadastrosModal from "./CadastrosModal";
import ConclusionModal, { type ConclusionChoice } from "./ConclusionModal";
import ProfileModal from "./ProfileModal";
import UsuariosModal from "./UsuariosModal";

const COLUMNS: {
  key: ActivityStatus;
  title: string;
  headerColor: string;
  bgClass: string;
  dragOverClass: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "aguardando",
    title: "Atividades aguardando tratativas",
    headerColor: "text-vivo-purple",
    bgClass: "bg-[#F6F2FC] border-[#EBE1F7]",
    dragOverClass: "bg-violet-100/70",
    icon: <ClockOutline />,
  },
  {
    key: "execucao",
    title: "Atividades em execução",
    headerColor: "text-blue-600",
    bgClass: "bg-[#EFF4FE] border-[#DEE8FC]",
    dragOverClass: "bg-blue-100/70",
    icon: <PlayIcon />,
  },
  {
    key: "concluida",
    title: "Atividades concluídas",
    headerColor: "text-emerald-600",
    bgClass: "bg-[#EFFAF3] border-[#DBF2E3]",
    dragOverClass: "bg-emerald-100/70",
    icon: <CheckCircleIcon />,
  },
];

export default function Dashboard({ user: initialUser }: { user: User }) {
  const [user, setUser] = useState<User>(initialUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [tecnicoFilter, setTecnicoFilter] = useState("Todos");
  const [armarioFilter, setArmarioFilter] = useState("Todos");
  const [periodoFilter, setPeriodoFilter] = useState("Todos");
  const [dataInicioFilter, setDataInicioFilter] = useState("");
  const [dataFimFilter, setDataFimFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  const [tecnicosList, setTecnicosList] = useState<Tecnico[]>([]);
  const [armariosList, setArmariosList] = useState<Armario[]>([]);
  const [tiposAtividadeList, setTiposAtividadeList] = useState<TipoAtividade[]>([]);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [usuariosOpen, setUsuariosOpen] = useState(false);
  const [concludingActivity, setConcludingActivity] = useState<Activity | null>(null);
  const [revertStatus, setRevertStatus] = useState<ActivityStatus | null>(null);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);

  const load = async () => {
    const res = await fetch("/api/activities");
    const serverDateHeader = res.headers.get("date");
    if (serverDateHeader) {
      const serverTime = new Date(serverDateHeader).getTime();
      if (!Number.isNaN(serverTime)) setClockOffsetMs(serverTime - Date.now());
    }
    const data = await res.json();
    setActivities(data);
    setLoading(false);
  };

  const loadCadastros = async () => {
    const [tRes, aRes, taRes] = await Promise.all([
      fetch("/api/tecnicos"),
      fetch("/api/armarios"),
      fetch("/api/tipos-atividade"),
    ]);
    setTecnicosList(await tRes.json());
    setArmariosList(await aRes.json());
    setTiposAtividadeList(await taRes.json());
  };

  useEffect(() => {
    load();
    loadCadastros();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const tecnicos = useMemo(() => tecnicosList.map((t) => t.nome), [tecnicosList]);
  const armarios = useMemo(() => armariosList.map((a) => a.nome), [armariosList]);

  const filtered = useMemo(() => {
    const now = new Date(Date.now() + clockOffsetMs);
    return activities.filter((a) => {
      if (tecnicoFilter !== "Todos" && a.nome_tecnico !== tecnicoFilter) return false;
      if (armarioFilter !== "Todos" && a.nome_armario !== armarioFilter) return false;
      if (periodoFilter !== "Todos") {
        if (!a.data_criacao) return false;
        const created = new Date(a.data_criacao.replace(" ", "T"));
        if (isNaN(created.getTime())) return false;
        if (periodoFilter === "Hoje") {
          if (created.toDateString() !== now.toDateString()) return false;
        } else if (periodoFilter === "Últimos 7 dias") {
          const diffDays = (now.getTime() - created.getTime()) / 86400000;
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (periodoFilter === "Últimos 30 dias") {
          const diffDays = (now.getTime() - created.getTime()) / 86400000;
          if (diffDays < 0 || diffDays > 30) return false;
        } else if (periodoFilter === "Este mês") {
          if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) return false;
        } else if (periodoFilter === "Personalizado") {
          if (dataInicioFilter) {
            const start = new Date(`${dataInicioFilter}T00:00:00`);
            if (!isNaN(start.getTime()) && created.getTime() < start.getTime()) return false;
          }
          if (dataFimFilter) {
            const end = new Date(`${dataFimFilter}T23:59:59`);
            if (!isNaN(end.getTime()) && created.getTime() > end.getTime()) return false;
          }
        }
      }
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const numero = formatActivityNumber(a.id, a.sigla).toLowerCase();
        const haystack = [
          numero,
          String(a.id),
          a.atividade,
          a.nome_armario,
          a.nome_tecnico,
          a.matricula_tecnico,
          a.numero_evento,
        ]
          .join("\n")
          .toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
  }, [
    activities,
    tecnicoFilter,
    armarioFilter,
    periodoFilter,
    dataInicioFilter,
    dataFimFilter,
    search,
    clockOffsetMs,
  ]);

  const grouped = useMemo(() => {
    const map: Record<ActivityStatus, Activity[]> = {
      aguardando: [],
      execucao: [],
      concluida: [],
      cancelada: [],
      excluida: [],
    };
    for (const a of filtered) map[a.status].push(a);
    return map;
  }, [filtered]);

  const patchActivity = async (id: number, body: Record<string, unknown>) => {
    const res = await fetch(`/api/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const updated = await res.json();
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const id = Number(draggableId);
    const newStatus = destination.droppableId as ActivityStatus;
    const sourceStatus = source.droppableId as ActivityStatus;

    const enteringExecucao = newStatus === "execucao" && sourceStatus !== "execucao";
    const nowStr = new Date(Date.now() + clockOffsetMs).toISOString().slice(0, 19).replace("T", " ");

    if (newStatus === "concluida") {
      // Solto na coluna "concluídas": pede a confirmação do tipo de conclusão
      const activity = activities.find((a) => a.id === id);
      if (!activity) return;
      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
      setRevertStatus(sourceStatus);
      setConcludingActivity({ ...activity, status: newStatus });
      return;
    }

    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: newStatus, ...(enteringExecucao ? { started_at: nowStr } : {}) }
          : a
      )
    );
    patchActivity(id, { status: newStatus });
  };

  const handleConclude = async (choice: ConclusionChoice, motivo: string) => {
    if (!concludingActivity) return;
    const body: Record<string, unknown> =
      choice === "cancelada"
        ? { status: "cancelada", motivo }
        : { status: "concluida", conclusao: choice, motivo };
    await patchActivity(concludingActivity.id, body);
    setConcludingActivity(null);
    setRevertStatus(null);
  };

  const handleConclusionCancel = () => {
    if (concludingActivity && revertStatus) {
      const id = concludingActivity.id;
      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status: revertStatus } : a)));
    }
    setConcludingActivity(null);
    setRevertStatus(null);
  };

  const handleSave = async (data: ActivityInput) => {
    if (editingActivity) {
      await patchActivity(editingActivity.id, data as unknown as Record<string, unknown>);
    } else {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      setActivities((prev) => [created, ...prev]);
    }
    setModalOpen(false);
    setEditingActivity(null);
  };

  const handleDelete = async (activity: Activity) => {
    if (!confirm(`Excluir a atividade ${formatActivityNumber(activity.id, activity.sigla)}?`)) return;
    const res = await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
    const updated = await res.json();
    // Nunca remove de fato: a atividade continua no histórico marcada como excluída.
    setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
  };

  const total = filtered.filter((a) => a.status !== "excluida").length;
  const emExecucao = filtered.filter((a) => a.status === "execucao").length;
  const concluidas = filtered.filter((a) => a.status === "concluida").length;
  const canceladas = filtered.filter((a) => a.status === "cancelada").length;

  const history = useMemo(() => [...filtered].sort((a, b) => b.id - a.id), [filtered]);

  return (
    <div className="min-h-screen">
      <Header
        user={user}
        onOpenCadastros={() => setCadastrosOpen(true)}
        onOpenUsuarios={() => setUsuariosOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <main className="max-w-[1600px] mx-auto px-6 py-5 space-y-4">
        <StatsBar total={total} execucao={emExecucao} concluidas={concluidas} canceladas={canceladas} />

        <FiltersBar
          tecnicos={tecnicos}
          armarios={armarios}
          tecnico={tecnicoFilter}
          armario={armarioFilter}
          periodo={periodoFilter}
          dataInicio={dataInicioFilter}
          dataFim={dataFimFilter}
          search={search}
          onTecnicoChange={setTecnicoFilter}
          onArmarioChange={setArmarioFilter}
          onPeriodoChange={setPeriodoFilter}
          onDataInicioChange={setDataInicioFilter}
          onDataFimChange={setDataFimFilter}
          onSearchChange={setSearch}
        />

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Carregando atividades...</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.key}
                  droppableId={col.key}
                  title={col.title}
                  count={grouped[col.key].length}
                  icon={col.icon}
                  headerColor={col.headerColor}
                  bgClass={col.bgClass}
                  dragOverClass={col.dragOverClass}
                  activities={grouped[col.key]}
                  onAdd={
                    col.key === "aguardando"
                      ? () => {
                          setEditingActivity(null);
                          setModalOpen(true);
                        }
                      : undefined
                  }
                  onEdit={(a) => {
                    setEditingActivity(a);
                    setModalOpen(true);
                  }}
                  onView={(a) => setViewingActivity(a)}
                  onDelete={handleDelete}
                  onRequestConclude={(a) => {
                    setRevertStatus(null);
                    setConcludingActivity(a);
                  }}
                  clockOffsetMs={clockOffsetMs}
                />
              ))}
            </div>
          </DragDropContext>
        )}

        <HistoryTable activities={history} clockOffsetMs={clockOffsetMs} onView={(a) => setViewingActivity(a)} />
      </main>

      {modalOpen && (
        <ActivityModal
          activity={editingActivity}
          tecnicos={tecnicosList}
          armarios={armariosList}
          tiposAtividade={tiposAtividadeList}
          onClose={() => {
            setModalOpen(false);
            setEditingActivity(null);
          }}
          onSave={handleSave}
          onOpenCadastros={() => setCadastrosOpen(true)}
        />
      )}

      {viewingActivity && (
        <ActivityDetailsModal
          activity={viewingActivity}
          clockOffsetMs={clockOffsetMs}
          onClose={() => setViewingActivity(null)}
          onEdit={() => {
            setEditingActivity(viewingActivity);
            setViewingActivity(null);
            setModalOpen(true);
          }}
        />
      )}

      {cadastrosOpen && (
        <CadastrosModal
          tecnicos={tecnicosList}
          armarios={armariosList}
          tiposAtividade={tiposAtividadeList}
          onClose={() => setCadastrosOpen(false)}
          onChanged={loadCadastros}
        />
      )}

      {concludingActivity && (
        <ConclusionModal
          activity={concludingActivity}
          onClose={handleConclusionCancel}
          onConfirm={handleConclude}
        />
      )}

      {usuariosOpen && user.isAdmin && <UsuariosModal onClose={() => setUsuariosOpen(false)} />}

      {profileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onUpdated={(u) => setUser((prev) => ({ ...u, isAdmin: prev.isAdmin }))}
        />
      )}
    </div>
  );
}

function ClockOutline() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 8.5v7l6-3.5Z" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-5" />
    </svg>
  );
}
