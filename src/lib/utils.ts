import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

/**
 * Converte `YYYY-MM-DD` em Date ao meio-dia local — evita o clássico
 * "aniversário um dia antes" causado por fuso horário.
 */
export function dataLocal(data: string): Date {
  return parseISO(`${data.slice(0, 10)}T12:00:00`);
}

export function formatarData(data: string, padrao = "dd/MM/yyyy"): string {
  return format(dataLocal(data), padrao, { locale: ptBR });
}

export function formatarDataExtenso(data: string): string {
  return format(dataLocal(data), "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatarDataCurta(data: string): string {
  return format(dataLocal(data), "dd/MM", { locale: ptBR });
}

export function formatarDataHora(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/** `20:00:00` → `20:00` */
export function formatarHorario(horario: string): string {
  return horario.slice(0, 5);
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

/** Idade em anos a partir da data de nascimento (`YYYY-MM-DD`). */
export function idade(nascimento: string): number {
  const nasc = dataLocal(nascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

/** Só dígitos — usado para montar o link do WhatsApp. */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarTelefone(telefone: string): string {
  const d = somenteDigitos(telefone).replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

/** Link direto de conversa no WhatsApp (sem API paga). */
export function linkWhatsAppPessoa(telefone: string, texto?: string): string {
  const numero = somenteDigitos(telefone);
  const completo = numero.startsWith("55") ? numero : `55${numero}`;
  const query = texto ? `?text=${encodeURIComponent(texto)}` : "";
  return `https://wa.me/${completo}${query}`;
}

/** Compartilhar um texto no WhatsApp — o usuário escolhe o grupo. */
export function linkWhatsAppTexto(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export function ehMesmaData(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** `2026-08-27` no fuso local (sem passar por UTC). */
export function chaveData(data: Date): string {
  const mes = `${data.getMonth() + 1}`.padStart(2, "0");
  const dia = `${data.getDate()}`.padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function hojeChave(): string {
  return chaveData(new Date());
}

/** Soma dias a uma chave `YYYY-MM-DD`. */
export function somarDias(chave: string, dias: number): string {
  const d = dataLocal(chave);
  d.setDate(d.getDate() + dias);
  return chaveData(d);
}

export function csvEscapar(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * Fuso da igreja. Datas com hora (eventos) são digitadas e exibidas neste
 * fuso, independentemente de onde o servidor estiver rodando.
 */
export const FUSO_IGREJA = process.env.NEXT_PUBLIC_FUSO_IGREJA ?? "America/Sao_Paulo";

function deslocamentoMinutos(data: Date, fuso: string): number {
  const formatador = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const partes = Object.fromEntries(
    formatador.formatToParts(data).map((parte) => [parte.type, parte.value]),
  );
  const comoUtc = Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    Number(partes.hour) === 24 ? 0 : Number(partes.hour),
    Number(partes.minute),
    Number(partes.second),
  );
  return (comoUtc - data.getTime()) / 60000;
}

/** `2026-09-06T19:30` (input datetime-local) → instante ISO em UTC. */
export function campoLocalParaIso(valor: string, fuso = FUSO_IGREJA): string {
  const [data, hora = "00:00"] = valor.split("T");
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const base = Date.UTC(ano, mes - 1, dia, h, m);
  let instante = base - deslocamentoMinutos(new Date(base), fuso) * 60000;
  instante = base - deslocamentoMinutos(new Date(instante), fuso) * 60000;
  return new Date(instante).toISOString();
}

function partesNoFuso(iso: string, fuso = FUSO_IGREJA) {
  const formatador = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return Object.fromEntries(
    formatador.formatToParts(new Date(iso)).map((parte) => [parte.type, parte.value]),
  ) as Record<string, string>;
}

/** Instante ISO → `2026-09-06T19:30` para preencher um datetime-local. */
export function isoParaCampoLocal(iso: string, fuso = FUSO_IGREJA): string {
  const p = partesNoFuso(iso, fuso);
  return `${p.year}-${p.month}-${p.day}T${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

/** Instante ISO → `2026-09-06` no fuso da igreja (usado no calendário). */
export function chaveDataIso(iso: string, fuso = FUSO_IGREJA): string {
  const p = partesNoFuso(iso, fuso);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Instante ISO → `19:30` no fuso da igreja. */
export function horaIso(iso: string, fuso = FUSO_IGREJA): string {
  const p = partesNoFuso(iso, fuso);
  return `${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}
