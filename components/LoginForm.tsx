"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "./AuthShell";

export default function LoginForm() {
  const router = useRouter();
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao entrar.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Entrar" subtitle="Acesse com sua matrícula e senha">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Matrícula">
          <input
            required
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="input"
            placeholder="Ex: 123456"
            autoFocus
          />
        </Field>
        <Field label="Senha">
          <input
            required
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="input"
            placeholder="Sua senha"
          />
        </Field>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-vivo-purple hover:bg-vivo-purpleDark text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60 transition-colors"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Não tem uma conta?{" "}
        <a href="/register" className="text-vivo-purple font-medium hover:text-vivo-purpleDark">
          Registre-se
        </a>
      </p>

      <div className="mt-5 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs font-medium text-gray-400 mb-1.5">Responsáveis</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Nilton Mota Nascimento &middot;{" "}
          <a href="mailto:Nilton.Nascimento@telefonica.com" className="text-vivo-purple hover:text-vivo-purpleDark">
            Nilton.Nascimento@telefonica.com
          </a>
          <br />
          Antonia Camila De Freitas Portela &middot;{" "}
          <a href="mailto:antonia.portela@telefonica.com" className="text-vivo-purple hover:text-vivo-purpleDark">
            antonia.portela@telefonica.com
          </a>
        </p>
      </div>

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
