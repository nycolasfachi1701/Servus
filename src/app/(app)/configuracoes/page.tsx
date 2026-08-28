import type { Metadata } from "next";
import { Trash2, UserPlus } from "lucide-react";
import { exigirAdmin } from "@/lib/sessao";
import { obterConfiguracoes } from "@/lib/dados/configuracoes";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarPessoasPublicas } from "@/lib/dados/pessoas";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCabecalho, CartaoCorpo } from "@/components/ui/cartao";
import { Botao } from "@/components/ui/botao";
import { Entrada, Selecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Alerta } from "@/components/ui/alerta";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { ROTULO_PAPEL, type Convite, type PapelUsuario, type Usuario } from "@/lib/tipos";
import { formatarData } from "@/lib/utils";
import { FormularioConfiguracoes } from "./formulario";
import { alterarPapel, criarConvite, excluirConvite } from "./acoes";

export const metadata: Metadata = { title: "Configurações" };

export default async function PaginaConfiguracoes() {
  const sessao = await exigirAdmin();
  const config = await obterConfiguracoes();
  const supabase = await criarClienteServidor();

  const [{ data: usuariosData }, { data: convitesData }, pessoas] = await Promise.all([
    supabase.from("usuarios").select("*").order("criado_em"),
    supabase.from("convites").select("*").is("usado_em", null).order("criado_em"),
    listarPessoasPublicas(),
  ]);

  const usuarios = (usuariosData ?? []) as Usuario[];
  const convites = (convitesData ?? []) as Convite[];
  const mapaPessoas = new Map(pessoas.map((p) => [p.id, p]));

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Identidade da igreja, mensagem da escala, rodízio e acessos."
      />

      <FormularioConfiguracoes config={config} />

      {/* ------------------------------------------------- usuários */}
      <Cartao>
        <CartaoCabecalho
          titulo="Usuários e papéis"
          descricao="Quem já tem acesso ao Servus e o que cada um pode fazer."
        />
        <CartaoCorpo className="pt-3">
          {usuarios.length === 0 ? (
            <p className="text-sm text-texto-suave">Nenhum usuário cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-borda">
              {usuarios.map((usuario) => {
                const pessoa = usuario.pessoa_id ? mapaPessoas.get(usuario.pessoa_id) : undefined;
                const ehVoce = usuario.id === sessao.usuarioId;
                return (
                  <li
                    key={usuario.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {pessoa?.nome ?? "Acesso sem membro vinculado"}
                        {ehVoce ? <span className="ml-2 text-xs text-texto-suave">(você)</span> : null}
                      </p>
                      <p className="text-xs text-texto-suave">
                        Desde {formatarData(usuario.criado_em.slice(0, 10))}
                      </p>
                    </div>
                    {ehVoce ? (
                      <Etiqueta tom="primaria">{ROTULO_PAPEL[usuario.papel]}</Etiqueta>
                    ) : (
                      <form action={alterarPapel} className="flex gap-2">
                        <input type="hidden" name="usuario_id" value={usuario.id} />
                        <Selecao
                          name="papel"
                          defaultValue={usuario.papel}
                          aria-label={`Papel de ${pessoa?.nome ?? "usuário"}`}
                          className="w-44"
                        >
                          {(Object.keys(ROTULO_PAPEL) as PapelUsuario[]).map((papel) => (
                            <option key={papel} value={papel}>
                              {ROTULO_PAPEL[papel]}
                            </option>
                          ))}
                        </Selecao>
                        <Botao type="submit" variante="secundario">
                          Salvar
                        </Botao>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CartaoCorpo>
      </Cartao>

      {/* ------------------------------------------------- convites */}
      <Cartao>
        <CartaoCabecalho
          titulo="Convites de acesso"
          descricao="Autorize um e-mail: ao se cadastrar, a pessoa já entra com o papel certo."
        />
        <CartaoCorpo className="space-y-4 pt-3">
          <Alerta tom="info">
            O Servus não envia e-mails de convite por conta própria — avise a pessoa para acessar
            <strong> /cadastro</strong> usando exatamente este e-mail.
          </Alerta>

          {convites.length > 0 ? (
            <ul className="divide-y divide-borda">
              {convites.map((convite) => (
                <li key={convite.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{convite.email}</p>
                    <p className="text-xs text-texto-suave">
                      {ROTULO_PAPEL[convite.papel]}
                      {convite.pessoa_id
                        ? ` · ${mapaPessoas.get(convite.pessoa_id)?.nome ?? "membro"}`
                        : " · sem membro vinculado"}
                    </p>
                  </div>
                  <ConfirmarAcao
                    acao={excluirConvite}
                    campos={{ id: convite.id }}
                    pergunta={`Cancelar o convite de ${convite.email}?`}
                    variante="fantasma"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Cancelar convite</span>
                  </ConfirmarAcao>
                </li>
              ))}
            </ul>
          ) : null}

          <form action={criarConvite} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <Entrada name="email" type="email" required placeholder="email@da-pessoa.com" aria-label="E-mail" />
            <Selecao name="papel" defaultValue="membro" aria-label="Papel">
              {(Object.keys(ROTULO_PAPEL) as PapelUsuario[]).map((papel) => (
                <option key={papel} value={papel}>
                  {ROTULO_PAPEL[papel]}
                </option>
              ))}
            </Selecao>
            <Selecao name="pessoa_id" defaultValue="" aria-label="Membro vinculado">
              <option value="">Vincular depois</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Selecao>
            <Botao type="submit">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Convidar
            </Botao>
          </form>
        </CartaoCorpo>
      </Cartao>
    </div>
  );
}
