import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase";
import { ESPACO, useCores } from "@/lib/tema";
import { Marca } from "@/componentes/marca";
import { Aviso, Botao, Campo, Cartao, Entrada, Mini } from "@/componentes/ui";

export default function Cadastro() {
  const cores = useCores();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    setErro(null);
    setAviso(null);
    if (nome.trim().length < 3) {
      setErro("Informe seu nome completo.");
      return;
    }
    if (senha.length < 8) {
      setErro("A senha precisa ter ao menos 8 caracteres.");
      return;
    }

    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { nome: nome.trim() } },
    });
    setCarregando(false);

    if (error) {
      setErro(
        error.message.includes("already registered")
          ? "Este e-mail já tem cadastro. Faça login."
          : "Não foi possível criar o acesso. Tente novamente.",
      );
      return;
    }

    if (!data.session) {
      setAviso("Cadastro criado! Confirme o e-mail que enviamos para ativar o acesso.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: ESPACO.xl,
          gap: ESPACO.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Marca />

        <Cartao style={{ gap: ESPACO.lg }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: cores.texto }}>
              Criar acesso
            </Text>
            <Mini>
              Use o mesmo e-mail que a liderança cadastrou. O papel vem do convite.
            </Mini>
          </View>

          {erro ? <Aviso texto={erro} tom="erro" /> : null}
          {aviso ? <Aviso texto={aviso} tom="sucesso" /> : null}

          <Campo rotulo="Nome completo">
            <Entrada value={nome} onChangeText={setNome} placeholder="Seu nome" />
          </Campo>

          <Campo rotulo="E-mail">
            <Entrada
              value={email}
              onChangeText={setEmail}
              placeholder="voce@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              inputMode="email"
            />
          </Campo>

          <Campo rotulo="Senha" dica="Mínimo de 8 caracteres.">
            <Entrada
              value={senha}
              onChangeText={setSenha}
              placeholder="••••••••"
              secureTextEntry
            />
          </Campo>

          <Botao titulo="Criar acesso" aoTocar={cadastrar} carregando={carregando} />
        </Cartao>

        <Link href="/login" asChild>
          <Pressable>
            <Text style={{ textAlign: "center", color: cores.textoSuave, fontSize: 14 }}>
              Já tem acesso?{" "}
              <Text style={{ color: cores.primaria, fontWeight: "600" }}>Entrar</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
