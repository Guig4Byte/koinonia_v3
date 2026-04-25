import type { AuthTokens } from "@/types";

const ACCESS_TOKEN_KEY = "koinonia.access-token";
const REFRESH_TOKEN_KEY = "koinonia.refresh-token";
const AUTH_STORAGE_EVENT = "koinonia-auth-storage";

const isBrowser = () => typeof window !== "undefined";

function notifyAuthStorageChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

export function getStoredAccessToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function hasStoredSession() {
  return Boolean(getStoredAccessToken() || getStoredRefreshToken());
}

export function persistAuthTokens(tokens: AuthTokens) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  notifyAuthStorageChange();
}

export function updateStoredAccessToken(accessToken: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  notifyAuthStorageChange();
}

export function updateStoredRefreshToken(refreshToken: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  notifyAuthStorageChange();
}

export function clearStoredAuth() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
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
