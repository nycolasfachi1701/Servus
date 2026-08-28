"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Botao } from "@/components/ui/botao";
import { AreaTexto, Campo, Entrada, Selecao } from "@/components/ui/campo";
import { Alerta } from "@/components/ui/alerta";
import { Cartao, CartaoCorpo } from "@/components/ui/cartao";
import { CampoFoto } from "@/components/campo-foto";
import { ROTULO_ESTADO_CIVIL, ROTULO_STATUS, type Pessoa } from "@/lib/tipos";
import { salvarMembro, type EstadoMembro } from "./acoes";

export type FuncaoAgrupada = {
  ministerio: string;
  cor: string;
  funcoes: { id: string; nome: string }[];
};

const VAZIO: EstadoMembro = {};

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar membro"}
    </Botao>
  );
}

export function FormularioMembro({
  membro,
  funcoesSelecionadas,
  grupos,
}: {
  membro?: Pessoa;
  funcoesSelecionadas: string[];
  grupos: FuncaoAgrupada[];
}) {
  const [estado, acao] = useActionState(salvarMembro, VAZIO);
  const selecionadas = new Set(funcoesSelecionadas);

  return (
    <form action={acao} className="space-y-5">
      {membro ? <input type="hidden" name="id" value={membro.id} /> : null}
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <Cartao>
        <CartaoCorpo className="space-y-4">
          <CampoFoto nome="foto_url" valorInicial={membro?.foto_url} />

          <Campo rotulo="Nome completo" htmlFor="nome" obrigatorio>
            <Entrada id="nome" name="nome" required defaultValue={membro?.nome} />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Telefone / WhatsApp" htmlFor="telefone" dica="Ex.: (11) 99999-0000">
              <Entrada
                id="telefone"
                name="telefone"
                type="tel"
                inputMode="tel"
                defaultValue={membro?.telefone ?? ""}
              />
            </Campo>
            <Campo rotulo="E-mail" htmlFor="email">
              <Entrada id="email" name="email" type="email" defaultValue={membro?.email ?? ""} />
            </Campo>
            <Campo rotulo="Nascimento" htmlFor="nascimento">
              <Entrada
                id="nascimento"
                name="nascimento"
                type="date"
                defaultValue={membro?.nascimento ?? ""}
              />
            </Campo>
            <Campo rotulo="Batismo" htmlFor="batismo">
              <Entrada
                id="batismo"
                name="batismo"
                type="date"
                defaultValue={membro?.batismo ?? ""}
              />
            </Campo>
            <Campo rotulo="Estado civil" htmlFor="estado_civil">
              <Selecao
                id="estado_civil"
                name="estado_civil"
                defaultValue={membro?.estado_civil ?? "nao_informado"}
              >
                {Object.entries(ROTULO_ESTADO_CIVIL).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo rotulo="Status" htmlFor="status">
              <Selecao id="status" name="status" defaultValue={membro?.status ?? "ativo"}>
                {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>

          <Campo rotulo="Endereço" htmlFor="endereco">
            <Entrada id="endereco" name="endereco" defaultValue={membro?.endereco ?? ""} />
          </Campo>

          <Campo
            rotulo="Observações"
            htmlFor="observacoes"
            dica="Informação sensível: visível apenas para a liderança."
          >
            <AreaTexto id="observacoes" name="observacoes" defaultValue={membro?.observacoes ?? ""} />
          </Campo>
        </CartaoCorpo>
      </Cartao>

      <Cartao>
        <CartaoCorpo className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Funções nos ministérios</h2>
            <p className="mt-0.5 text-sm text-texto-suave">
              Marque o que a pessoa exerce. Só quem exerce a função entra no rodízio dela.
            </p>
          </div>

          {grupos.length === 0 ? (
            <p className="text-sm text-texto-suave">
              Nenhuma função cadastrada ainda. Crie ministérios e funções primeiro.
            </p>
          ) : (
            <div className="space-y-4">
              {grupos.map((grupo) => (
                <fieldset key={grupo.ministerio}>
                  <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: grupo.cor }}
                      aria-hidden="true"
                    />
                    {grupo.ministerio}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {grupo.funcoes.map((funcao) => (
                      <label
                        key={funcao.id}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-borda px-3 py-2 text-sm transition-colors has-[:checked]:border-primaria has-[:checked]:bg-primaria-tenue has-[:checked]:text-primaria"
                      >
                        <input
                          type="checkbox"
                          name="funcoes"
                          value={funcao.id}
                          defaultChecked={selecionadas.has(funcao.id)}
                          className="h-4 w-4 accent-[var(--primaria)]"
                        />
                        {funcao.nome}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </CartaoCorpo>
      </Cartao>

      <div className="flex items-center gap-3">
        <BotaoSalvar />
        <Link
          href={membro ? `/membros/${membro.id}` : "/membros"}
          className="text-sm text-texto-suave hover:text-texto"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
