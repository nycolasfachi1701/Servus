"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "@/components/ui/botao";
import { AreaTexto, Campo, Entrada } from "@/components/ui/campo";
import { Alerta } from "@/components/ui/alerta";
import { Cartao, CartaoCabecalho, CartaoCorpo } from "@/components/ui/cartao";
import { CampoFoto } from "@/components/campo-foto";
import type { Configuracoes } from "@/lib/tipos";
import { salvarConfiguracoes, type EstadoConfig } from "./acoes";

const VAZIO: EstadoConfig = {};

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar configurações"}
    </Botao>
  );
}

export function FormularioConfiguracoes({ config }: { config: Configuracoes }) {
  const [estado, acao] = useActionState(salvarConfiguracoes, VAZIO);

  return (
    <form action={acao} className="space-y-5">
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
      {estado.ok ? <Alerta tom="sucesso">{estado.ok}</Alerta> : null}

      <Cartao>
        <CartaoCabecalho titulo="Dados da igreja" />
        <CartaoCorpo className="space-y-4 pt-3">
          <Campo rotulo="Nome da igreja" htmlFor="nome_igreja" obrigatorio>
            <Entrada id="nome_igreja" name="nome_igreja" required defaultValue={config.nome_igreja} />
          </Campo>
          <CampoFoto nome="logo_url" valorInicial={config.logo_url} pasta="igreja" rotulo="Logo" />
          <Campo
            rotulo="Cor principal"
            htmlFor="cor_primaria"
            dica="O sistema usa o vinho como cor de destaque; ajuste se a sua igreja usar outro tom."
          >
            <input
              id="cor_primaria"
              type="color"
              name="cor_primaria"
              defaultValue={config.cor_primaria}
              className="h-10 w-20 cursor-pointer rounded-xl border border-borda bg-superficie p-1"
            />
          </Campo>
        </CartaoCorpo>
      </Cartao>

      <Cartao>
        <CartaoCabecalho
          titulo="Mensagem da escala"
          descricao="Usada no botão “Enviar pro WhatsApp”. Use {periodo} no título."
        />
        <CartaoCorpo className="space-y-4 pt-3">
          <Campo rotulo="Título" htmlFor="mensagem_titulo">
            <Entrada
              id="mensagem_titulo"
              name="mensagem_titulo"
              defaultValue={config.mensagem_titulo}
            />
          </Campo>
          <Campo rotulo="Despedida" htmlFor="mensagem_despedida">
            <AreaTexto
              id="mensagem_despedida"
              name="mensagem_despedida"
              className="min-h-16"
              defaultValue={config.mensagem_despedida}
            />
          </Campo>
        </CartaoCorpo>
      </Cartao>

      <Cartao>
        <CartaoCabecalho
          titulo="Rodízio"
          descricao="Pesos usados na sugestão automática da escala. O rodízio deve ser sempre o maior."
        />
        <CartaoCorpo className="grid gap-4 pt-3 sm:grid-cols-2">
          <Campo
            rotulo="Limite de escalas por pessoa"
            htmlFor="limite_escalas_mes"
            dica="Padrão sugerido ao gerar uma escala."
          >
            <Entrada
              id="limite_escalas_mes"
              name="limite_escalas_mes"
              type="number"
              min={1}
              max={31}
              defaultValue={config.limite_escalas_mes}
            />
          </Campo>
          <Campo rotulo="Peso do rodízio" htmlFor="peso_rodizio">
            <Entrada
              id="peso_rodizio"
              name="peso_rodizio"
              type="number"
              min={0}
              max={100}
              defaultValue={config.peso_rodizio}
            />
          </Campo>
          <Campo rotulo="Peso da preferência de dia" htmlFor="peso_preferencia">
            <Entrada
              id="peso_preferencia"
              name="peso_preferencia"
              type="number"
              min={0}
              max={100}
              defaultValue={config.peso_preferencia}
            />
          </Campo>
          <Campo rotulo="Peso das duplas" htmlFor="peso_dupla">
            <Entrada
              id="peso_dupla"
              name="peso_dupla"
              type="number"
              min={0}
              max={100}
              defaultValue={config.peso_dupla}
            />
          </Campo>
        </CartaoCorpo>
      </Cartao>

      <BotaoSalvar />
    </form>
  );
}
