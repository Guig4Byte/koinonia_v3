import type { AuthTokens } from "@/types";

const SESSION_MARKER_KEY = "koinonia.session-active";
const AUTH_STORAGE_EVENT = "koinonia-auth-storage";

let inMemoryAccessToken: string | null = null;

const isBrowser = () => typeof window !== "undefined";

function notifyAuthStorageChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

function setSessionMarker() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(SESSION_MARKER_KEY, "1");
}

function clearSessionMarker() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(SESSION_MARKER_KEY);
}

export function getStoredAccessToken() {
  return inMemoryAccessToken;
}

export function getStoredRefreshToken() {
  // Refresh token fica em cookie HttpOnly e não deve ser acessível ao JavaScript.
  return null;
}

export function hasStoredSession() {
  if (inMemoryAccessToken) {
    return true;
  }

  if (!isBrowser()) {
    return false;
  }

  return window.localStorage.getItem(SESSION_MARKER_KEY) === "1";
}

export function persistAuthTokens(tokens: AuthTokens) {
  inMemoryAccessToken = tokens.accessToken;
  setSessionMarker();
  notifyAuthStorageChange();
}

export function updateStoredAccessToken(accessToken: string) {
  inMemoryAccessToken = accessToken;
  setSessionMarker();
  notifyAuthStorageChange();
}

export function updateStoredRefreshToken(_refreshToken: string) {
  // Mantido por compatibilidade com chamadas antigas.
  // O refresh token real é gravado pelo servidor em cookie HttpOnly.
  setSessionMarker();
  notifyAuthStorageChange();
}

export function clearStoredAuth() {
  inMemoryAccessToken = null;
  clearSessionMarker();
  notifyAuthStorageChange();
}

export function subscribeToAuthStorage(callback: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorageChange = () => {
    callback();
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(AUTH_STORAGE_EVENT, handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(AUTH_STORAGE_EVENT, handleStorageChange);
  };
}
