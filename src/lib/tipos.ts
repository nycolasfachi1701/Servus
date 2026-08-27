/**
 * Tipos do banco (Postgres/Supabase) e do domínio do Servus.
 * Mantido à mão e alinhado com `supabase/migrations`.
 */

export type PapelUsuario = "admin" | "lider" | "membro";
export type StatusPessoa = "ativo" | "afastado" | "visitante" | "inativo";
export type EstadoCivil =
  | "solteiro"
  | "casado"
  | "divorciado"
  | "viuvo"
  | "uniao_estavel"
  | "nao_informado";

export type Pessoa = {
  id: string;
  nome: string;
  foto_url: string | null;
  telefone: string | null;
  email: string | null;
  nascimento: string | null;
  batismo: string | null;
  endereco: string | null;
  estado_civil: EstadoCivil;
  status: StatusPessoa;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type PessoaPublica = Pick<Pessoa, "id" | "nome" | "foto_url" | "status">;

export type Usuario = {
  id: string;
  pessoa_id: string | null;
  papel: PapelUsuario;
  criado_em: string;
  atualizado_em: string;
};

export type Convite = {
  id: string;
  email: string;
  papel: PapelUsuario;
  pessoa_id: string | null;
  criado_em: string;
  usado_em: string | null;
};

export type Ministerio = {
  id: string;
  nome: string;
  cor: string;
  descricao: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type MinisterioLider = { ministerio_id: string; pessoa_id: string };

export type Funcao = {
  id: string;
  ministerio_id: string;
  nome: string;
  criado_em: string;
};

export type PessoaFuncao = { pessoa_id: string; funcao_id: string };

export type TipoCulto = {
  id: string;
  nome: string;
  dia_semana: number;
  horario: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type TipoCultoVaga = {
  id: string;
  tipo_culto_id: string;
  funcao_id: string;
  quantidade: number;
};

export type Culto = {
  id: string;
  tipo_culto_id: string | null;
  titulo: string | null;
  data: string;
  horario: string;
  observacao: string | null;
  finalizado_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Disponibilidade = {
  pessoa_id: string;
  culto_id: string;
  disponivel: boolean;
  observacao: string | null;
  criado_em: string;
};

export type EscalaItem = {
  id: string;
  culto_id: string;
  funcao_id: string;
  pessoa_id: string | null;
  confirmado: boolean;
  confirmado_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Evento = {
  id: string;
  titulo: string;
  inicio: string;
  fim: string | null;
  local: string | null;
  ministerio_id: string | null;
  responsavel_id: string | null;
  descricao: string | null;
  imagem_url: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Configuracoes = {
  id: number;
  nome_igreja: string;
  logo_url: string | null;
  cor_primaria: string;
  mensagem_titulo: string;
  mensagem_despedida: string;
  limite_escalas_mes: number;
  peso_rodizio: number;
  peso_preferencia: number;
  peso_dupla: number;
  atualizado_em: string;
};

export type RodizioCarga = {
  pessoa_id: string;
  funcao_id: string;
  total: number;
  ultima_data: string | null;
};

type Tabela<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  /**
   * Vazio de propósito: o Servus não usa `select` com embeds. Cada consulta
   * traz uma tabela e a composição é feita no TypeScript — isso mantém o
   * RLS previsível (um membro lê nomes pela view `pessoas_publicas`, nunca
   * pela tabela `pessoas`).
   */
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      pessoas: Tabela<Pessoa, Omit<Partial<Pessoa>, "nome"> & { nome: string }>;
      usuarios: Tabela<Usuario, Partial<Usuario> & { id: string }>;
      convites: Tabela<Convite, Partial<Convite> & { email: string }>;
      ministerios: Tabela<Ministerio, Partial<Ministerio> & { nome: string }>;
      ministerio_lideres: Tabela<MinisterioLider, MinisterioLider>;
      funcoes: Tabela<Funcao, Partial<Funcao> & { ministerio_id: string; nome: string }>;
      pessoa_funcao: Tabela<PessoaFuncao, PessoaFuncao>;
      tipos_culto: Tabela<
        TipoCulto,
        Partial<TipoCulto> & { nome: string; dia_semana: number; horario: string }
      >;
      tipo_culto_vaga: Tabela<
        TipoCultoVaga,
        Partial<TipoCultoVaga> & { tipo_culto_id: string; funcao_id: string }
      >;
      cultos: Tabela<Culto, Partial<Culto> & { data: string; horario: string }>;
      disponibilidade: Tabela<
        Disponibilidade,
        Partial<Disponibilidade> & { pessoa_id: string; culto_id: string; disponivel: boolean }
      >;
      escala_itens: Tabela<
        EscalaItem,
        Partial<EscalaItem> & { culto_id: string; funcao_id: string }
      >;
      eventos: Tabela<Evento, Partial<Evento> & { titulo: string; inicio: string }>;
      configuracoes: Tabela<Configuracoes, Partial<Configuracoes>>;
    };
    Views: {
      pessoas_publicas: { Row: PessoaPublica; Relationships: [] };
      rodizio_carga: { Row: RodizioCarga; Relationships: [] };
    };
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    CompositeTypes: Record<string, never>;
    Enums: {
      papel_usuario: PapelUsuario;
      status_pessoa: StatusPessoa;
      estado_civil: EstadoCivil;
    };
  };
};

/** Rótulos em PT-BR usados na interface. */
export const ROTULO_PAPEL: Record<PapelUsuario, string> = {
  admin: "Administrador",
  lider: "Líder de ministério",
  membro: "Membro",
};

export const ROTULO_STATUS: Record<StatusPessoa, string> = {
  ativo: "Ativo",
  afastado: "Afastado",
  visitante: "Visitante",
  inativo: "Inativo",
};

export const ROTULO_ESTADO_CIVIL: Record<EstadoCivil, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  uniao_estavel: "União estável",
  nao_informado: "Não informado",
};

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
