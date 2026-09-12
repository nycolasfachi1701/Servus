import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase";
import { ESPACO, useCores } from "@/lib/tema";
import { Marca } from "@/componentes/marca";
import { Aviso, Botao, Campo, Cartao, Entrada, Mini } from "@/componentes/ui";

export default function Login() {
  const cores = useCores();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro(null);
    setAviso(null);
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setCarregando(false);
    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente novamente.",
      );
    }
    // o redirecionamento acontece sozinho quando a sessão muda
  }

  async function enviarLink() {
    setErro(null);
    setAviso(null);
    if (!email.trim()) {
      setErro("Informe o e-mail para receber o link.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setCarregando(false);
    if (error) setErro("Não foi possível enviar o link agora.");
    else setAviso("Link enviado! Confira sua caixa de entrada.");
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
            <Text style={{ fontSize: 20, fontWeight: "700", color: cores.texto }}>Entrar</Text>
            <Mini>Acesse com o e-mail cadastrado pela liderança.</Mini>
          </View>

          {erro ? <Aviso texto={erro} tom="erro" /> : null}
          {aviso ? <Aviso texto={aviso} tom="sucesso" /> : null}

          <Campo rotulo="E-mail">
            <Entrada
              value={email}
              onChangeText={setEmail}
              placeholder="voce@email.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />
          </Campo>

          <Campo rotulo="Senha">
            <Entrada
              value={senha}
              onChangeText={setSenha}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="current-password"
              onSubmitEditing={entrar}
              returnKeyType="go"
            />
          </Campo>

          <Botao titulo="Entrar" aoTocar={entrar} carregando={carregando} />

          <Pressable onPress={enviarLink} disabled={carregando}>
            <Text style={{ textAlign: "center", color: cores.primaria, fontSize: 14 }}>
              Prefiro receber um link por e-mail
            </Text>
          </Pressable>
        </Cartao>

        <Link href="/cadastro" asChild>
          <Pressable>
            <Text style={{ textAlign: "center", color: cores.textoSuave, fontSize: 14 }}>
              Ainda não tem acesso?{" "}
              <Text style={{ color: cores.primaria, fontWeight: "600" }}>Criar minha conta</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
