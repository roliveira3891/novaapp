import { ImageResponse } from "next/og";

// Ícone do app instalado (PNG gerado na hora): fundo roxo com "NOVA".
// O texto fica na zona segura (~60%) para servir também como ícone "maskable".
export async function GET(_req: Request, { params }: { params: { size: string } }) {
  const size = params.size === "512" ? 512 : params.size === "180" ? 180 : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4A1F6F, #6B2FA5)",
          color: "white",
          fontSize: size * 0.26,
          fontWeight: 800,
          letterSpacing: size * 0.01,
        }}
      >
        NOVA
      </div>
    ),
    { width: size, height: size }
  );
}
