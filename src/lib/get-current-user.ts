export interface CurrentUser {
  userId: string;
  role: string;
  personId: string;
  churchId: string;
}

export function getCurrentUser(request: Request): CurrentUser | null {
  const userId = request.headers.get("x-user-id");
  const role = request.headers.get("x-user-role");
  const personId = request.headers.get("x-person-id");
  const churchId = request.headers.get("x-church-id");

  if (!userId || !role || !personId || !churchId) {
    return null;
  }

  return { userId, role, personId, churchId };
}
