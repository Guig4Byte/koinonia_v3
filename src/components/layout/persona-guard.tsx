"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe, useStoredSessionState } from "@/hooks/use-auth";
import { clearStoredAuth } from "@/lib/auth-storage";

const roleRedirectMap = {
  pastor: "/pastor",
  supervisor: "/supervisor",
  leader: "/lider",
} as const;

export function PersonaGuard() {
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
      clearStoredAuth();
      router.replace("/login");
      return;
    }

    if (meQuery.data) {
      const destination = roleRedirectMap[meQuery.data.role as keyof typeof roleRedirectMap];
      router.replace(destination ?? "/login");
    }
  }, [meQuery.data, meQuery.isError, router, sessionState.hasSession, sessionState.isHydrated]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="rounded-[2rem] border border-white/70 bg-card/95 px-6 py-8 text-center shadow-[0_30px_90px_-48px_rgba(44,44,42,0.45)]">
        <p className="text-sm font-medium text-stone-500">
          Preparando sua visao pastoral...
        </p>
      </div>
    </div>
  );
}
