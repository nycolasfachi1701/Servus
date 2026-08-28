import type { Sessao } from "@/lib/sessao";

/**
 * Chave do ícone — não o componente. Este módulo é lido pelo layout (que
 * roda no servidor) e o resultado é enviado para o menu (componente de
 * cliente): só dados serializáveis podem cruzar essa fronteira.
 */
export type IconeNav =
  | "painel"
  | "escalas"
  | "minhas-escalas"
  | "calendario"
  | "membros"
  | "disponibilidade"
  | "eventos"
  | "ministerios"
  | "cultos"
  | "configuracoes";

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: IconeNav;
  nivel: "todos" | "lideranca" | "admin";
  /** Aparece na barra inferior do celular. */
  destaque?: boolean;
};

export const ITENS_NAV: ItemNav[] = [
  { href: "/painel", rotulo: "Painel", icone: "painel", nivel: "todos", destaque: true },
  { href: "/escalas", rotulo: "Escalas", icone: "escalas", nivel: "lideranca", destaque: true },
  { href: "/minhas-escalas", rotulo: "Minhas escalas", icone: "minhas-escalas", nivel: "todos", destaque: true },
  { href: "/calendario", rotulo: "Calendário", icone: "calendario", nivel: "todos", destaque: true },
  { href: "/membros", rotulo: "Membros", icone: "membros", nivel: "lideranca", destaque: true },
  { href: "/disponibilidade", rotulo: "Disponibilidade", icone: "disponibilidade", nivel: "todos" },
  { href: "/eventos", rotulo: "Eventos", icone: "eventos", nivel: "lideranca" },
  { href: "/ministerios", rotulo: "Ministérios", icone: "ministerios", nivel: "lideranca" },
  { href: "/cultos", rotulo: "Cultos", icone: "cultos", nivel: "lideranca" },
  { href: "/configuracoes", rotulo: "Configurações", icone: "configuracoes", nivel: "admin" },
];

export function itensVisiveis(sessao: Pick<Sessao, "ehAdmin" | "ehLideranca">): ItemNav[] {
  return ITENS_NAV.filter((item) => {
    if (item.nivel === "admin") return sessao.ehAdmin;
    if (item.nivel === "lideranca") return sessao.ehLideranca;
    return true;
  });
}

/** Até 5 atalhos na barra inferior do celular (o 5º é o botão "Menu"). */
export function itensBarraInferior(sessao: Pick<Sessao, "ehAdmin" | "ehLideranca">): ItemNav[] {
  const destaque = itensVisiveis(sessao).filter((i) => i.destaque);
  const semDuplicar = sessao.ehLideranca
    ? destaque.filter((i) => i.href !== "/minhas-escalas")
    : destaque;
  return semDuplicar.slice(0, 4);
}
