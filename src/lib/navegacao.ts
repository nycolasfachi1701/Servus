import {
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  ClipboardList,
  Cog,
  Church,
  HandHeart,
  LayoutDashboard,
  PartyPopper,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Sessao } from "@/lib/sessao";

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  nivel: "todos" | "lideranca" | "admin";
  /** Aparece na barra inferior do celular. */
  destaque?: boolean;
};

export const ITENS_NAV: ItemNav[] = [
  { href: "/painel", rotulo: "Painel", icone: LayoutDashboard, nivel: "todos", destaque: true },
  { href: "/escalas", rotulo: "Escalas", icone: ClipboardList, nivel: "lideranca", destaque: true },
  { href: "/minhas-escalas", rotulo: "Minhas escalas", icone: CalendarCheck, nivel: "todos", destaque: true },
  { href: "/calendario", rotulo: "Calendário", icone: CalendarDays, nivel: "todos", destaque: true },
  { href: "/membros", rotulo: "Membros", icone: Users, nivel: "lideranca", destaque: true },
  { href: "/disponibilidade", rotulo: "Disponibilidade", icone: CalendarRange, nivel: "todos" },
  { href: "/eventos", rotulo: "Eventos", icone: PartyPopper, nivel: "lideranca" },
  { href: "/ministerios", rotulo: "Ministérios", icone: HandHeart, nivel: "lideranca" },
  { href: "/cultos", rotulo: "Cultos", icone: Church, nivel: "lideranca" },
  { href: "/configuracoes", rotulo: "Configurações", icone: Cog, nivel: "admin" },
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
