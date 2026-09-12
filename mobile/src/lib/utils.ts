import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** `YYYY-MM-DD` → Date ao meio-dia local (evita erro de fuso). */
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

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarTelefone(telefone: string): string {
  const d = somenteDigitos(telefone).replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

/** Conversa direta no WhatsApp. */
export function linkWhatsAppPessoa(telefone: string, texto?: string): string {
  const numero = somenteDigitos(telefone);
  const completo = numero.startsWith("55") ? numero : `55${numero}`;
  const query = texto ? `?text=${encodeURIComponent(texto)}` : "";
  return `https://wa.me/${completo}${query}`;
}

/** Compartilhar um texto — quem envia escolhe o grupo. */
export function linkWhatsAppTexto(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export function chaveData(data: Date): string {
  const mes = `${data.getMonth() + 1}`.padStart(2, "0");
  const dia = `${data.getDate()}`.padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function hojeChave(): string {
  return chaveData(new Date());
}

export function somarDias(chave: string, dias: number): string {
  const d = dataLocal(chave);
  d.setDate(d.getDate() + dias);
  return chaveData(d);
}

export function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}
