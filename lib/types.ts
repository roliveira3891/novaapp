export type ActivityStatus = "aguardando" | "execucao" | "concluida" | "cancelada" | "excluida";

export type ConclusionType = "total" | "parcial" | null;

export interface Activity {
  id: number;
  numero_evento: string;
  data_criacao: string;
  atividade: string;
  nome_armario: string;
  descricao: string;
  nome_tecnico: string;
  matricula_tecnico: string;
  status: ActivityStatus;
  conclusao: ConclusionType;
  started_at: string | null;
  tempo_execucao_segundos: number;
  concluded_at: string | null;
  motivo: string | null;
  regional: string;
  deleted_at: string | null;
  deleted_by: string | null;
  sigla: string;
}

export interface ActivityInput {
  numero_evento: string;
  atividade: string;
  nome_armario: string;
  descricao: string;
  nome_tecnico: string;
  /** Só no mobile: status escolhido no cadastro (sem kanban). */
  status?: ActivityStatus;
  conclusao?: ConclusionType;
  motivo?: string;
}

export interface Tecnico {
  id: number;
  nome: string;
  matricula: string;
  regional: string;
}

export interface Armario {
  id: number;
  nome: string;
  regional: string;
}

export interface TipoAtividade {
  id: number;
  nome: string;
  regional: string;
  sigla: string;
}

export interface User {
  id: number;
  matricula: string;
  nome: string;
  regional: string;
  avatar: string;
  isAdmin?: boolean;
}
