"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe, useStoredSessionState } from "@/hooks/use-auth";
import { clearStoredAuth } from "@/lib/auth-storage";

export default function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const sessionState = useStoredSessionState();
  const meQuery = useMe({
    enabled: sessionState.isHydrated && sessionState.hasSession,
  });

  useEffect(() => {
    if (!sessionState.isHydrated) {
      return;
    }

    if (!sessionState.hasSession) {
      router.replace("/login");
      return;
    }

    if (meQuery.isError) {
      console.error("[AuthenticatedAppLayout] Auth error:", meQuery.error);
      clearStoredAuth();
      router.replace("/login");
    }
  }, [meQuery.isError, meQuery.error, router, sessionState.hasSession, sessionState.isHydrated]);

  const isLoading =
    !sessionState.isHydrated || (sessionState.hasSession && meQuery.isPending);

  const isUnauthorized =
    sessionState.isHydrated &&
    (!sessionState.hasSession || meQuery.isError || !meQuery.data);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <p className="text-sm text-[var(--text-muted)]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <p className="text-sm text-[var(--text-muted)]">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
