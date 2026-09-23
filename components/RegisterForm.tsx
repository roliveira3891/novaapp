"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "./AuthShell";
import AvatarPicker from "./AvatarPicker";
import { REGIONAIS } from "@/lib/regionais";

export default function RegisterForm() {
  const router = useRouter();
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [regional, setRegional] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [avatar, setAvatar] = useState("a1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula, nome, regional, senha, avatar }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao registrar.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Criar conta" subtitle="Registre-se para acessar o painel operacional">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="text-xs text-gray-500 mb-2 block">Escolha um avatar</span>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        <Field label="Matrícula">
          <input
            required
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="input"
            placeholder="Ex: 123456"
          />
        </Field>
        <Field label="Nome completo">
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input"
            placeholder="Ex: Carlos Silva"
          />
        </Field>
        <Field label="Regional">
          <select
            required
            value={regional}
            onChange={(e) => setRegional(e.target.value)}
            className="input"
          >
            <option value="" disabled>
              Selecione a regional
            </option>
            {REGIONAIS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Senha">
            <input
              required
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input"
              placeholder="Mín. 4 caracteres"
            />
          </Field>
          <Field label="Confirmar senha">
            <input
              required
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="input"
              placeholder="Repita a senha"
            />
          </Field>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-vivo-purple hover:bg-vivo-purpleDark text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60 transition-colors"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Já tem uma conta?{" "}
        <a href="/login" className="text-vivo-purple font-medium hover:text-vivo-purpleDark">
          Entrar
        </a>
      </p>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #8b3fd8;
        }
      `}</style>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
