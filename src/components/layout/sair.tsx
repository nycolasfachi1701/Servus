import { LogOut } from "lucide-react";
import { sair } from "@/app/(auth)/acoes";

export function BotaoSair() {
  return (
    <form action={sair}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-texto-suave transition-colors hover:bg-superficie-2 hover:text-erro"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair
      </button>
    </form>
  );
}
