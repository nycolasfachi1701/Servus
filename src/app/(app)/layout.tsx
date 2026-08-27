import { exigirSessao } from "@/lib/sessao";
import { obterConfiguracoes } from "@/lib/dados/configuracoes";
import { itensBarraInferior, itensVisiveis } from "@/lib/navegacao";
import { ROTULO_PAPEL } from "@/lib/tipos";
import { Marca } from "@/components/layout/marca";
import { AlternarTema } from "@/components/layout/alternar-tema";
import { BarraInferior, MenuLateral } from "@/components/layout/navegacao";
import { BotaoSair } from "@/components/layout/sair";
import { Avatar } from "@/components/ui/avatar";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const config = await obterConfiguracoes();

  const itens = itensVisiveis(sessao);
  const atalhos = itensBarraInferior(sessao);

  return (
    <div className="min-h-dvh md:flex">
      {/* ------------------------------------------------ menu lateral */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-borda bg-superficie md:flex">
        <div className="brilho-vinho border-b border-borda px-4 py-5">
          <Marca nomeIgreja={config.nome_igreja} />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <MenuLateral itens={itens} />
        </div>
        <div className="border-t border-borda p-3">
          <div className="mb-2 flex items-center gap-3 px-1">
            <Avatar nome={sessao.nome} fotoUrl={sessao.fotoUrl} tamanho="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{sessao.nome}</p>
              <p className="truncate text-xs text-texto-suave">{ROTULO_PAPEL[sessao.papel]}</p>
            </div>
            <AlternarTema className="h-8 w-8" />
          </div>
          <BotaoSair />
        </div>
      </aside>

      {/* ---------------------------------------------------- conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-borda bg-superficie/95 px-4 py-3 backdrop-blur md:hidden">
          <Marca tamanho="sm" nomeIgreja={config.nome_igreja} />
          <Avatar nome={sessao.nome} fotoUrl={sessao.fotoUrl} tamanho="sm" />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      <BarraInferior
        itens={atalhos}
        todosItens={itens}
        nome={sessao.nome}
        fotoUrl={sessao.fotoUrl}
        email={sessao.email}
        papel={ROTULO_PAPEL[sessao.papel]}
        aoSair={<BotaoSair />}
      />
    </div>
  );
}
