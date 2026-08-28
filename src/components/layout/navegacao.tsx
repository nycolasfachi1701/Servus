"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Church,
  ClipboardList,
  Cog,
  HandHeart,
  LayoutDashboard,
  Menu,
  PartyPopper,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconeNav, ItemNav } from "@/lib/navegacao";
import { AlternarTema } from "./alternar-tema";
import { Avatar } from "@/components/ui/avatar";

/** Os componentes de ícone vivem aqui, do lado do cliente. */
const ICONES: Record<IconeNav, LucideIcon> = {
  painel: LayoutDashboard,
  escalas: ClipboardList,
  "minhas-escalas": CalendarCheck,
  calendario: CalendarDays,
  membros: Users,
  disponibilidade: CalendarRange,
  eventos: PartyPopper,
  ministerios: HandHeart,
  cultos: Church,
  configuracoes: Cog,
};

export function ehAtivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function LinkNav({
  item,
  ativo,
  onClick,
}: {
  item: ItemNav;
  ativo: boolean;
  onClick?: () => void;
}) {
  const Icone = ICONES[item.icone];
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        ativo
          ? "bg-vinho-tenue text-vinho"
          : "text-texto-suave hover:bg-superficie-2 hover:text-texto",
      )}
    >
      <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
      {item.rotulo}
    </Link>
  );
}

/** Menu lateral (desktop). */
export function MenuLateral({ itens }: { itens: ItemNav[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="space-y-1">
      {itens.map((item) => (
        <LinkNav key={item.href} item={item} ativo={ehAtivo(pathname, item.href)} />
      ))}
    </nav>
  );
}

/** Barra inferior (celular). */
export function BarraInferior({
  itens,
  todosItens,
  nome,
  fotoUrl,
  email,
  papel,
  aoSair,
}: {
  itens: ItemNav[];
  todosItens: ItemNav[];
  nome: string;
  fotoUrl: string | null;
  email: string;
  papel: string;
  aoSair: React.ReactNode;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  return (
    <>
      <nav
        aria-label="Atalhos"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {itens.map((item) => {
            const Icone = ICONES[item.icone];
            const ativo = ehAtivo(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
                    ativo ? "text-vinho" : "text-texto-suave",
                  )}
                >
                  <Icone className="h-5 w-5" aria-hidden="true" />
                  <span className="max-w-full truncate px-1">{item.rotulo}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setAberto(true)}
              aria-expanded={aberto}
              className="flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium text-texto-suave"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              Menu
            </button>
          </li>
        </ul>
      </nav>

      {aberto ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-borda bg-superficie p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar nome={nome} fotoUrl={fotoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{nome}</p>
                  <p className="truncate text-xs text-texto-suave">{papel} · {email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlternarTema />
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-texto-suave"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </button>
              </div>
            </div>
            <nav aria-label="Todas as seções" className="space-y-1">
              {todosItens.map((item) => (
                <LinkNav
                  key={item.href}
                  item={item}
                  ativo={ehAtivo(pathname, item.href)}
                  onClick={() => setAberto(false)}
                />
              ))}
            </nav>
            <div className="mt-4 border-t border-borda pt-4">{aoSair}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
