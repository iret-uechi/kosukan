import { useEffect, useState } from "react";

interface AuthSessionResponse {
  authenticated: boolean;
  enabled: boolean;
  user?: {
    login: string;
    name?: string;
  } | null;
}

export function AuthStatus() {
  const [session, setSession] = useState<AuthSessionResponse | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) return null;
        if (!response.headers.get("content-type")?.includes("application/json")) return null;
        return response.json() as Promise<AuthSessionResponse>;
      })
      .then((nextSession) => {
        if (active) setSession(nextSession);
      })
      .catch(() => {
        if (active) setSession(null);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!session?.enabled || !session.authenticated || !session.user) {
    return null;
  }

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 8,
        justifyContent: "flex-end",
        marginTop: 12,
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }}>
        @{session.user.login}
      </span>
      <a
        href="/api/auth/logout"
        style={{
          background: "rgba(255,255,255,0.14)",
          borderRadius: 6,
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          padding: "5px 8px",
          textDecoration: "none",
        }}
      >
        ログアウト
      </a>
    </div>
  );
}
